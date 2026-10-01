import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.deps import get_duffel_service
from app.api.routes.flights import router
from app.core.config import get_settings
from app.services.duffel import DuffelService


@pytest.fixture
def client_factory(monkeypatch):
    clients = []
    monkeypatch.setenv("DUFFEL_BASE_URL", "https://duffel.test")

    def make(handler, token="test-placeholder"):
        monkeypatch.setenv("DUFFEL_ACCESS_TOKEN", token)
        settings = get_settings()
        app = FastAPI()
        app.include_router(router)

        async def service():
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as client:
                yield DuffelService(settings, client)

        app.dependency_overrides[get_duffel_service] = service
        client = TestClient(app)
        clients.append(client)
        return client

    yield make
    for client in clients:
        client.close()
