from fastapi import APIRouter

router = APIRouter()


@router.get("/flights")
async def get_flights():
    return {"message": "List of flights"}
