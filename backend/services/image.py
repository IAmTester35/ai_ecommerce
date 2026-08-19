import httpx
import asyncio
import os
import logging
from typing import List, Dict, Optional, Set
import xml.etree.ElementTree as ET
from core.dependencies import supabase

logger = logging.getLogger(__name__)

# Giữ reference cho các background tasks để tránh bị Garbage Collector thu hồi sớm
_background_tasks: Set[asyncio.Task] = set()

async def update_image_in_db(car_id: str, image_url: str):
    """
    Background Task: Lưu ảnh vào Supabase.
    """
    if not car_id or not image_url:
        return
    try:
        await asyncio.to_thread(
            supabase.table("cars").update({"image_url": image_url}).eq("id", car_id).execute
        )
        logger.info(f"Cached image for car {car_id} into DB.")
    except Exception as e:
        logger.warning(f"Failed to cache image for car {car_id}: {e}")

def _schedule_image_cache(car_id: str, image_url: str):
    task = asyncio.create_task(update_image_in_db(car_id, image_url))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)

HTTP_HEADERS = {
    "User-Agent": "CarEcommerceBackend/2.0 (contact@ecommerce-car.com)"
}

async def fetch_from_wikimedia_commons(client: httpx.AsyncClient, query: str) -> Optional[str]:
    """
    Lấy ảnh thật từ Wikimedia Commons API (Miễn phí, Direct CDN JPG/PNG).
    """
    url = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"{query} filetype:bitmap",
        "gsrnamespace": 6,
        "gsrlimit": 1,
        "prop": "imageinfo",
        "iiprop": "url",
        "iiurlwidth": 960,
        "format": "json"
    }
    try:
        response = await client.get(url, params=params, headers=HTTP_HEADERS, timeout=4.0)
        if response.status_code == 200:
            data = response.json()
            pages = data.get("query", {}).get("pages", {})
            for pid, pdata in pages.items():
                imageinfo = pdata.get("imageinfo", [])
                if imageinfo:
                    img_url = imageinfo[0].get("thumburl") or imageinfo[0].get("url")
                    if img_url and img_url.startswith("http") and not img_url.endswith(".svg"):
                        return img_url
    except Exception as e:
        logger.debug(f"Wikimedia Commons fetch error for {query}: {e}")
    return None

async def fetch_from_wikipedia_pageimages(client: httpx.AsyncClient, query: str) -> Optional[str]:
    """
    Lấy ảnh từ Wikipedia PageImages API (Miễn phí, Direct CDN JPG/PNG).
    """
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"{query} car",
        "gsrlimit": 1,
        "prop": "pageimages",
        "piprop": "thumbnail|original",
        "pithumbsize": 960
    }
    try:
        response = await client.get(url, params=params, headers=HTTP_HEADERS, timeout=4.0)
        if response.status_code == 200:
            data = response.json()
            pages = data.get("query", {}).get("pages", {})
            for pid, pdata in pages.items():
                if "thumbnail" in pdata and pdata["thumbnail"].get("source"):
                    return pdata["thumbnail"]["source"]
                if "original" in pdata and pdata["original"].get("source"):
                    return pdata["original"]["source"]
    except Exception as e:
        logger.debug(f"Wikipedia fetch error for {query}: {e}")
    return None

async def fetch_from_google_search(client: httpx.AsyncClient, query: str) -> Optional[str]:
    """
    Dự phòng: Tìm ảnh bằng Google Custom Search API.
    """
    api_key = os.environ.get("GOOGLE_SEARCH_API_KEY")
    cx = os.environ.get("GOOGLE_CX")
    if not api_key or not cx:
        return None
        
    try:
        response = await client.get(
            "https://www.googleapis.com/customsearch/v1",
            params={
                "key": api_key,
                "cx": cx,
                "q": f"{query} car exterior high quality",
                "searchType": "image",
                "num": 1
            },
            timeout=2.0
        )
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            if items:
                return items[0].get("link")
    except Exception as e:
        logger.warning(f"Google Search error for {query}: {e}")
        
    return None

async def fetch_single_car_image(client: httpx.AsyncClient, car: dict) -> Optional[str]:
    """
    Lấy ảnh cho một xe theo thứ tự ưu tiên: DB -> Wikimedia Commons -> Wikipedia -> Google Search.
    """
    # 0. Ưu tiên đọc từ DB
    if car.get("image_url") and "regcheck" not in car["image_url"] and "fancybox" not in car["image_url"]:
        return car["image_url"]
        
    make = car.get("make", "").strip()
    model = car.get("model", "").strip()
    year = str(car.get("year", "")).strip()
    car_id = car.get("id", "")
    
    search_terms = []
    if year and make and model:
        search_terms.append(f"{year} {make} {model}")
    if make and model:
        search_terms.append(f"{make} {model}")
        
    if not search_terms:
        return None

    # 1. Gọi Wikimedia Commons
    for term in search_terms:
        image_url = await fetch_from_wikimedia_commons(client, term)
        if image_url:
            _schedule_image_cache(car_id, image_url)
            return image_url

    # 2. Gọi Wikipedia Pageimages
    for term in search_terms:
        image_url = await fetch_from_wikipedia_pageimages(client, term)
        if image_url:
            _schedule_image_cache(car_id, image_url)
            return image_url
        
    # 3. Gọi API dự phòng (Google Search)
    image_url = await fetch_from_google_search(client, search_terms[0])
    if image_url:
        _schedule_image_cache(car_id, image_url)
        return image_url

    return None

async def fetch_images_for_cars(cars: List[Dict]) -> List[Dict]:
    """
    Tải ảnh song song cho toàn bộ kết quả trả về, tái sử dụng 1 HTTP connection pool.
    """
    if not cars:
        return []

    async with httpx.AsyncClient() as client:
        tasks = [fetch_single_car_image(client, car) for car in cars]
        images = await asyncio.gather(*tasks, return_exceptions=True)
        
        for idx, image_url in enumerate(images):
            if isinstance(image_url, Exception):
                logger.error(f"Unhandled exception fetching image: {image_url}")
                cars[idx]["image_url"] = None
            else:
                cars[idx]["image_url"] = image_url
                
    return cars
