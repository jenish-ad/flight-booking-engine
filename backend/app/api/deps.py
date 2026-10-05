from typing import Annotated

import httpx
from fastapi import Depends
from sqlmodel import Session

from app.core.config import Settings, get_settings
from app.core.db import get_session
from app.services.duffel import DuffelService

SessionDep = Annotated[Session, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


async def get_duffel_service(settings: SettingsDep):
    async with httpx.AsyncClient() as client:
        yield DuffelService(settings, client)


DuffelServiceDep = Annotated[DuffelService, Depends(get_duffel_service)]
