from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import time

# Load biến môi trường trước khi import các module khác
load_dotenv()

# Import routers
from routers import users, cars, cart_orders, wishlist, interactions, notifications, admin, ai_search

app = FastAPI(title="AutoMatch AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(users.router)
app.include_router(cars.router)
app.include_router(cart_orders.router)
app.include_router(wishlist.router)
app.include_router(interactions.router)
app.include_router(notifications.router)
app.include_router(admin.router)
app.include_router(ai_search.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

