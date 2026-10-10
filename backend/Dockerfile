FROM python:3.10-slim

# Pinned so a new uv release can't change the build unexpectedly.
COPY --from=ghcr.io/astral-sh/uv:0.12.17 /uv /uvx /bin/

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# Install dependencies first: this layer is reused until pyproject.toml or uv.lock changes,
# so editing code doesn't reinstall every package.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache --no-dev --no-install-project

COPY . .

CMD ["fastapi", "run", "app/main.py", "--port", "80", "--host", "0.0.0.0"]
