import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, HttpUrl, SecretStr


class Settings(BaseModel):
    duffel_access_token: SecretStr = SecretStr("")
    duffel_base_url: HttpUrl


def get_settings() -> Settings:
    # Environment variables take precedence over the local .env file.
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
    return Settings(
        duffel_access_token=os.getenv("DUFFEL_ACCESS_TOKEN", ""),
        duffel_base_url=os.getenv("DUFFEL_BASE_URL"),
    )
