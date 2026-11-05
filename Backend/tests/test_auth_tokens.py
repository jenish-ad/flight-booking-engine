from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException
from sqlmodel import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.models.users import UserInDB
from app.utils.security import create_access_token

EMAIL = "user@example.com"


@pytest.fixture
def session(engine):
    with Session(engine) as session:
        session.add(UserInDB(email=EMAIL, password="hashed"))
        session.commit()
        yield session


def sign(claims):
    settings = get_settings()
    return jwt.encode(
        claims, settings.secret_key.get_secret_value(), algorithm=settings.algorithm
    )


def test_valid_token(session):
    token = create_access_token({"sub": EMAIL}, get_settings())
    assert get_current_user(session, get_settings(), token).email == EMAIL


@pytest.mark.parametrize(
    "claims",
    [
        {"sub": EMAIL},  # no exp: would otherwise never expire
        {"exp": datetime.now(timezone.utc) + timedelta(minutes=5)},  # no sub
        {"sub": EMAIL, "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        {
            "sub": "nobody@example.com",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
    ],
    ids=["missing-exp", "missing-sub", "expired", "unknown-user"],
)
def test_rejected_tokens(session, claims):
    with pytest.raises(HTTPException) as exc:
        get_current_user(session, get_settings(), sign(claims))
    assert exc.value.status_code == 401


def test_token_signed_with_other_key_is_rejected(session):
    settings = get_settings()
    token = jwt.encode(
        {"sub": EMAIL, "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        "not-the-real-secret-key-but-long-enough",
        algorithm=settings.algorithm,
    )
    with pytest.raises(HTTPException) as exc:
        get_current_user(session, settings, token)
    assert exc.value.status_code == 401
