import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr, HttpUrl, SecretStr

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseModel):
    database_url: str

    secret_key: SecretStr
    algorithm: str
    access_token_expire_minutes: int

    mail_username: str
    mail_password: SecretStr
    mail_from: EmailStr
    mail_server: str
    mail_port: int

    duffel_access_token: SecretStr = SecretStr("")
    duffel_base_url: HttpUrl


@lru_cache
def get_settings() -> Settings:
    # Environment variables take precedence over the local .env file.
    load_dotenv(ENV_FILE)
    return Settings(
        database_url=os.getenv("DATABASE_URL"),
        secret_key=os.getenv("SECRET_KEY"),
        algorithm=os.getenv("ALGORITHM"),
        access_token_expire_minutes=os.getenv("ACCESS_TOKEN_EXPIRE"),
        mail_username=os.getenv("MAIL_USERNAME"),
        mail_password=os.getenv("MAIL_PASSWORD"),
        mail_from=os.getenv("MAIL_FROM_NAME"),
        mail_server=os.getenv("MAIL_SERVER"),
        mail_port=os.getenv("MAIL_PORT"),
        duffel_access_token=os.getenv("DUFFEL_ACCESS_TOKEN", ""),
        duffel_base_url=os.getenv("DUFFEL_BASE_URL"),
    )
