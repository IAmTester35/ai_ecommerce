import logging
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers import ai_search, payment, notifications

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title="AutoMatch AI Backend",
    version="1.0.0",
    description="Backend API hỗ trợ AI Vector Search, RAG và Payment Gateway cho AutoMatch AI"
)

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

# Cấu hình CORS chuẩn tuân thủ W3C
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký Routers
app.include_router(ai_search.router)
app.include_router(payment.router)
app.include_router(notifications.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
