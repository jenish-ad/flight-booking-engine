# Flight Booking Engine

A backend service for searching flights, managing reservations, processing
payments, and sending booking notifications.

The project is being built with Python and FastAPI. Its current codebase is an
initial backend scaffold: the package boundaries and intended responsibilities
are defined, but the API and business workflows have not yet been implemented.

## Repository layout

```text
flight-booking-engine/
|-- backend/
|   |-- app/           # FastAPI application source
|   |-- tests/         # Automated backend tests
|   |-- pyproject.toml # Python project configuration
|   `-- uv.lock        # Locked Python dependencies
|-- .gitignore
`-- README.md
```

The backend is organized into API routes, services, persistence operations,
database models, validation schemas, and adapters for external providers.
See [backend/README.md](backend/README.md) for setup and development details.

## Planned capabilities

- User registration and authentication
- Flight search and itinerary retrieval
- Reservation creation and cancellation
- Payment processing and verification
- Email and SMS booking notifications
- Integration with the Amadeus flight API

## Current status

Early development. The directory structure and module documentation are in
place; endpoints, database models, integrations, and tests are still to be
implemented.
