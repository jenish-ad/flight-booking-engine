from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session

from app.core.config import Settings, get_settings
from app.core.db import get_session
from app.crud.users import get_user_by_email
from app.models.users import UserInDB
from app.schemas.auth import TokenPayload
from app.services.cache import RedisCache
from app.services.duffel import DuffelService
from app.utils.security import oauth2_scheme

SessionDep = Annotated[Session, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]


def get_current_user(
    session: SessionDep, settings: SettingsDep, token: TokenDep
) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise credentials_exception from None

    user = get_user_by_email(session, token_data.sub)
    if user is None:
        raise credentials_exception
    return user


CurrentUser = Annotated[UserInDB, Depends(get_current_user)]


def get_duffel_service(request: Request, settings: SettingsDep) -> DuffelService:
    return DuffelService(settings, request.app.state.http_client)


DuffelServiceDep = Annotated[DuffelService, Depends(get_duffel_service)]


def get_cache(request: Request) -> RedisCache:
    return request.app.state.cache


CacheDep = Annotated[RedisCache, Depends(get_cache)]
