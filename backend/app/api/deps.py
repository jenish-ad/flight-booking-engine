from typing import Annotated

from fastapi import Depends, Request
from sqlmodel import Session

from app.core.config import Settings, get_settings
from app.core.db import get_session
from app.services.duffel import DuffelService

SessionDep = Annotated[Session, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


def get_duffel_service(request: Request, settings: SettingsDep) -> DuffelService:
    return DuffelService(settings, request.app.state.http_client)


DuffelServiceDep = Annotated[DuffelService, Depends(get_duffel_service)]
