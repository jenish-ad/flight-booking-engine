#This ia a blue print for creating a docker image

FROM python:3.10-slim

# It installs uv.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# It copies the application into a container.
COPY . /app

# It installs application dependencies.
WORKDIR /app
RUN uv sync --frozen --no-cache

# It runs the application.
CMD ["/app/.venv/bin/fastapi", "run", "app/main.py", "--port", "80", "--host", "0.0.0.0"]