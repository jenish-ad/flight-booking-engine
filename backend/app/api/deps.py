from typing import Annotated

import httpx
from fastapi import Depends

from app.core.config import Settings, get_settings
from app.services.duffel import DuffelService


async def get_duffel_service(settings: Annotated[Settings, Depends(get_settings)]):
    async with httpx.AsyncClient() as client:
        yield DuffelService(settings, client)
