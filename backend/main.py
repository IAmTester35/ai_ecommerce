from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load biến môi trường trước khi import các module khác
load_dotenv()

from routers import ai_search, payment, notifications

# Import routers

app = FastAPI(title="AutoMatch AI Backend", version="1.0.0")

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(ai_search.router)
app.include_router(payment.router)
app.include_router(notifications.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

