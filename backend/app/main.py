from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import users
from app.crud.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(users.router)


@app.get("/")
def hello():
    return {"message": "Flight Booking API"}
