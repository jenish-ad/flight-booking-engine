from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI

from app.api.routes import flights, offers, orders, users
from app.core.config import get_settings
from app.core.db import init_db
from app.services.cache import RedisCache


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    settings = get_settings()
    app.state.cache = RedisCache(settings.redis_host, settings.redis_port)
    # One shared client for the app's lifetime so connections are pooled across requests.
    async with httpx.AsyncClient() as client:
        app.state.http_client = client
        yield
    await app.state.cache.close()


app = FastAPI(lifespan=lifespan)
app.include_router(users.router)
app.include_router(flights.router)
app.include_router(offers.router)
app.include_router(orders.router)
