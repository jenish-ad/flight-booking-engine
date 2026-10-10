import uuid

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.api.deps import get_cache, get_current_user, get_duffel_service
from app.api.routes import flights, offers, orders
from app.core.config import get_settings
from app.core.db import get_session
from app.models.orders import Order  # noqa: F401  (registers the table)
from app.models.users import UserInDB
from app.services.duffel import DuffelService

USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class FakeCache:
    """In-memory stand-in for RedisCache; records each set's ttl for assertions."""

    def __init__(self):
        self.data = {}
        self.ttls = {}

    async def get(self, key):
        return self.data.get(key)

    async def set(self, key, value, ttl_seconds):
        self.data[key] = value
        self.ttls[key] = ttl_seconds


@pytest.fixture
def fake_cache():
    return FakeCache()


@pytest.fixture
def engine():
    # One in-memory SQLite database per test, shared by every client in that test.
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def client_factory(monkeypatch, engine, fake_cache):
    clients = []
    monkeypatch.setenv("DUFFEL_BASE_URL", "https://duffel.test")

    def make(handler, token="test-placeholder", authenticated=True, user_id=USER_ID):
        monkeypatch.setenv("DUFFEL_ACCESS_TOKEN", token)
        get_settings.cache_clear()
        settings = get_settings()
        app = FastAPI()
        for module in (flights, offers, orders):
            app.include_router(module.router)

        async def service():
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                yield DuffelService(settings, client)

        def session():
            with Session(engine) as session:
                yield session

        app.dependency_overrides[get_duffel_service] = service
        app.dependency_overrides[get_session] = session
        app.dependency_overrides[get_cache] = lambda: fake_cache
        if authenticated:
            app.dependency_overrides[get_current_user] = lambda: UserInDB(
                id=user_id, email="user@example.com", password="hashed"
            )
        client = TestClient(app)
        clients.append(client)
        return client

    yield make
    for client in clients:
        client.close()
