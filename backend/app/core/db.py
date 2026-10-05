import os

from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import ENV_FILE

load_dotenv(ENV_FILE)

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=True)


def get_session():
    with Session(engine) as session:
        yield session


def init_db():
    SQLModel.metadata.create_all(engine)
