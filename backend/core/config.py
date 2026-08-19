import os
from typing import List
from dotenv import load_dotenv

# Tải biến môi trường từ .env
load_dotenv()

class Settings:
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    # Google Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL_EXTRACT: str = os.getenv("GEMINI_MODEL_EXTRACT", "gemini-3.1-flash-lite")
    GEMINI_MODEL_GEN: str = os.getenv("GEMINI_MODEL_GEN", "gemini-3.6-flash")
    GEMINI_MODEL_EMBED: str = os.getenv("GEMINI_MODEL_EMBED", "gemini-embedding-2")

    # Jina AI
    JINA_API_KEY: str = os.getenv("JINA_API_KEY", "")

    # ZaloPay
    ZALOPAY_APP_ID: int = int(os.getenv("ZALOPAY_APP_ID", "2554")) if os.getenv("ZALOPAY_APP_ID", "2554").isdigit() else 2554
    ZALOPAY_KEY1: str = os.getenv("ZALOPAY_KEY1", "")
    ZALOPAY_KEY2: str = os.getenv("ZALOPAY_KEY2", "")
    ZALOPAY_ENDPOINT: str = os.getenv("ZALOPAY_ENDPOINT", "https://sb-openapi.zalopay.vn/v2/create")
    ZALOPAY_QUERY_ENDPOINT: str = os.getenv("ZALOPAY_QUERY_ENDPOINT", "https://sb-openapi.zalopay.vn/v2/query")
    ZALOPAY_CALLBACK_URL: str = os.getenv("ZALOPAY_CALLBACK_URL", "http://localhost:8000/api/payment/callback")

    # CORS
    @property
    def cors_origins(self) -> List[str]:
        raw_origins = os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://localhost:8081,http://127.0.0.1:5173,http://127.0.0.1:3000,http://127.0.0.1:8081"
        )
        return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

settings = Settings()
