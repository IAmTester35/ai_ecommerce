import sys
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.logger import setup_logging
from routers import ai_search, payment, notifications, reviews

# Cấu hình logging chuẩn có màu ANSI và lọc spam healthcheck
setup_logging(level=logging.INFO)
logger = logging.getLogger("backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("==========================================")
    logger.info("🚀 AutoMatch AI Backend is starting up...")
    logger.info(f"🔧 CORS Origins: {settings.cors_origins}")
    logger.info("==========================================")
    yield
    logger.info("🛑 AutoMatch AI Backend is shutting down...")

app = FastAPI(
    title="AutoMatch AI Backend",
    version="1.0.0",
    description="Backend API hỗ trợ AI Vector Search, RAG và Payment Gateway cho AutoMatch AI",
    lifespan=lifespan
)

# Endpoint Healthcheck chuyên dụng cho Docker / Kubernetes
@app.get("/health", include_in_schema=False)
async def health_check():
    return JSONResponse(content={"status": "ok", "service": "automatch-ai-backend"})

# Middleware ghi log HTTP request & response time (bỏ qua health check và swagger docs tĩnh)
EXCLUDED_LOG_PATHS = {"/health", "/docs", "/openapi.json", "/favicon.ico"}

@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    path = request.url.path
    if path in EXCLUDED_LOG_PATHS:
        return await call_next(request)

    start_time = time.time()
    client_ip = request.client.host if request.client else "unknown"
    method = request.method
    query_params = str(request.query_params)
    req_desc = f"{method} {path}" + (f"?{query_params}" if query_params else "")
    
    logger.info(f"➡️ [REQ] {client_ip} | {req_desc}")
    
    try:
        response: Response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        logger.info(f"⬅️ [RES] {client_ip} | {req_desc} | Status: {response.status_code} | Took: {process_time:.2f}ms")
        return response
    except Exception as e:
        process_time = (time.time() - start_time) * 1000
        logger.error(f"❌ [ERR] {client_ip} | {req_desc} | Failed after {process_time:.2f}ms | Error: {str(e)}", exc_info=True)
        raise e

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
app.include_router(reviews.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, access_log=True, log_level="info")
