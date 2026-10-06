from functools import lru_cache

from sqlalchemy import Engine
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import get_settings


@lru_cache
def get_engine() -> Engine:
    # Created on first use so importing this module doesn't need DATABASE_URL.
    return create_engine(get_settings().database_url, echo=True)


def get_session():
    with Session(get_engine()) as session:
        yield session


def init_db():
    SQLModel.metadata.create_all(get_engine())
