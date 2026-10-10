import logging

import redis.asyncio as redis
from redis.asyncio.retry import Retry
from redis.backoff import NoBackoff
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)


class RedisCache:
    """Best-effort cache: if Redis is down, reads miss and writes are skipped."""

    def __init__(self, host: str, port: int):
        # Short timeouts and no retries so a slow or missing Redis can't hold up
        # requests (the client's default retries took ~15s per call when Redis was down).
        self.r = redis.Redis(
            host=host,
            port=port,
            decode_responses=True,
            socket_timeout=1,
            socket_connect_timeout=1,
            retry=Retry(NoBackoff(), 0),
        )

    async def get(self, key: str) -> str | None:
        try:
            return await self.r.get(key)
        except RedisError:
            logger.warning("Redis get failed for %s", key, exc_info=True)
            return None

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        try:
            await self.r.set(key, value, ex=ttl_seconds)
        except RedisError:
            logger.warning("Redis set failed for %s", key, exc_info=True)

    async def close(self) -> None:
        await self.r.aclose()
