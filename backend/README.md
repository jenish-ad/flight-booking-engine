# Flight Booking Engine Backend

FastAPI backend for the Flight Booking Engine.

> **Status:** This package is currently an application scaffold. Modules and
> their responsibilities have been defined, but there is not yet a runnable
> FastAPI application in `app/main.py`.

## Requirements

- Python 3.10 or newer
- [uv](https://docs.astral.sh/uv/) for dependency and environment management

## Setup

From the `backend` directory, install the locked dependencies:

```bash
uv sync
```

Activate the virtual environment on Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

On macOS or Linux:

```bash
source .venv/bin/activate
```

## Running the API

Once `app/main.py` contains a FastAPI application, start the development
server from the `backend` directory with:

```bash
uv run fastapi dev
```

The project entry point is configured as `app.main:app` in `pyproject.toml`.
FastAPI's interactive API documentation will normally be available at
`http://127.0.0.1:8000/docs`.

## Tests

Tests will live in `tests/`. After adding pytest as a development dependency,
run them with:

```bash
uv run pytest
```

## Application structure

```text
app/
|-- api/
|   |-- deps.py          # Shared FastAPI dependencies
|   `-- routes/          # HTTP endpoint modules
|-- core/                # Settings, security, and exceptions
|-- crud/                # Database persistence operations
|-- db/                  # Engine and session configuration
|-- integrations/        # Amadeus, payment, email, and SMS adapters
|-- models/              # Database models
|-- schemas/             # Pydantic request and response models
|-- services/            # Application business workflows
|-- utils/               # Small shared utilities
`-- main.py               # FastAPI application entry point
```

Requests should flow through the layers as follows:

```text
API route -> service -> CRUD/integration -> database or external provider
```

- **Routes** handle HTTP input and output.
- **Services** coordinate business rules and workflows.
- **CRUD modules** contain persistence queries and commands.
- **Models** describe persisted database entities.
- **Schemas** validate API inputs and serialize outputs.
- **Integrations** isolate third-party provider APIs.

## Configuration

Runtime settings will be defined in `app/core/config.py` and loaded from
environment variables. Local secrets should be stored in a `.env` file, which
is ignored by Git. When configuration variables are introduced, document them
in a committed `.env.example` file without real credentials.

## Development notes

- Keep route handlers thin and move business decisions into services.
- Do not expose third-party provider response formats directly through the API;
  normalize them into application schemas first.
- Add shared test fixtures to `tests/conftest.py` as the test suite grows.
- Introduce database migrations before committing persistent schema changes.
