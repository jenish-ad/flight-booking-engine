import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, HttpUrl, SecretStr

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseModel):
    duffel_access_token: SecretStr = SecretStr("")
    duffel_base_url: HttpUrl


@lru_cache
def get_settings() -> Settings:
    # Environment variables take precedence over the local .env file.
    load_dotenv(ENV_FILE)
    return Settings(
        duffel_access_token=os.getenv("DUFFEL_ACCESS_TOKEN", ""),
        duffel_base_url=os.getenv("DUFFEL_BASE_URL"),
    )
