import httpx
import asyncio
import os
import logging
from typing import List, Dict, Optional
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)

async def fetch_from_car_api(client: httpx.AsyncClient, make: str, model: str, year: str) -> Optional[str]:
    """
    Giải pháp 2: Lấy ảnh từ CarImagery API (Miễn phí, không cần Key).
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
    Giải pháp 1: Fallback tìm ảnh bằng Google Custom Search API.
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

async def fetch_single_car_image(car: dict) -> Optional[str]:
    """
    Điều phối luồng lấy ảnh theo thứ tự ưu tiên và tuân thủ SoC.
    """
    make = car.get("make", "")
    model = car.get("model", "")
    year = car.get("year", "")
    
    query = f"{year} {make} {model}".strip()
    if not query:
        return None

    async with httpx.AsyncClient() as client:
        # Bước 1: Gọi API chính (Không cần Key)
        image_url = await fetch_from_car_api(client, make, model, year)
        if image_url:
            return image_url
            
        # Bước 2: Gọi API dự phòng (Google Search)
        image_url = await fetch_from_google_search(client, query)
        if image_url:
            return image_url

    # Bước 3: Thay vì dựa dẫm vào placeholder ngoài không kiểm soát, 
    # trả về None để Frontend xử lý hiển thị ảnh nội bộ (local asset).
    return None

async def fetch_images_for_cars(cars: List[Dict]) -> List[Dict]:
    """
    Tải ảnh song song cho toàn bộ kết quả trả về.
    """
    tasks = [fetch_single_car_image(car) for car in cars]
    images = await asyncio.gather(*tasks, return_exceptions=True)
    
    for idx, image_url in enumerate(images):
        if isinstance(image_url, Exception):
            logger.error(f"Unhandled exception fetching image: {image_url}")
            cars[idx]["image_url"] = None
        else:
            cars[idx]["image_url"] = image_url
            
    return cars
