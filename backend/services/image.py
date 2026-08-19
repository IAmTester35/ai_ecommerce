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

async def fetch_from_car_api(client: httpx.AsyncClient, make: str, model: str, year: str) -> Optional[str]:
    """
    Lấy ảnh từ CarImagery API (Miễn phí, không cần Key).
    """
    term = f"{year}+{make}+{model}".replace(" ", "+")
    try:
        response = await client.get(
            f"http://www.carimagery.com/api.asmx/GetImageUrl?searchTerm={term}",
            timeout=3.0
        )
        if response.status_code == 200:
            root = ET.fromstring(response.text)
            url = root.text
            if url and url.startswith("http"):
                return url
    except Exception as e:
        logger.warning(f"Car API error for {term}: {e}")
        
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
    Lấy ảnh cho một xe theo thứ tự ưu tiên: DB -> CarImagery API -> Google Search.
    """
    # 0. Ưu tiên đọc từ DB
    if car.get("image_url"):
        return car["image_url"]
        
    make = car.get("make", "")
    model = car.get("model", "")
    year = str(car.get("year", ""))
    car_id = car.get("id", "")
    
    query = f"{year} {make} {model}".strip()
    if not query:
        return None

    # 1. Gọi API chính (Không cần Key)
    image_url = await fetch_from_car_api(client, make, model, year)
    if image_url:
        _schedule_image_cache(car_id, image_url)
        return image_url
        
    # 2. Gọi API dự phòng (Google Search)
    image_url = await fetch_from_google_search(client, query)
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
