from fastapi import APIRouter, HTTPException, status

from app.crud.users import create_user, get_user_by_email
from app.schemas.users import UserCreate, UserRead
from app.utils.email import send_email_async

router = APIRouter()


@router.post("/register/", response_model=UserRead)
async def register(user_in: UserCreate):
    # It verifies that user is not already registered
    user = get_user_by_email(user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email Already registered!!"
        )

    # It saves user in the database
    user = create_user(email=user_in.email, password=user_in.password)

    # For sending email
    await send_email_async(
        subject="Welcome to flight booking engine",
        recipient=user_in.email,
        body=f"Hello {user_in.email},\n\n Thankyou for registering.",
    )
    return user
