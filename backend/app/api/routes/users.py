from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import CurrentUser, SessionDep, SettingsDep
from app.crud.users import authenticate_user, create_user, get_user_by_email
from app.schemas.auth import Token
from app.schemas.users import UserCreate, UserRead
from app.services.email import send_email_async
from app.utils.security import create_access_token

router = APIRouter(tags=["auth"])


@router.post("/register/", response_model=UserRead)
def register(
    background_task: BackgroundTasks,
    user_in: UserCreate,
    session: SessionDep,
):
    # It verifies that user is not already registered
    user = get_user_by_email(session, user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email Already registered!!"
        )

    # It saves user in the database
    user = create_user(session, email=user_in.email, password=user_in.password)

    # For sending email

    subject = "Welcome to flight booking engine"
    recipient = [user_in.email]
    body_text = f"Hello {user_in.email},\n\n Thankyou for registering."
    background_task.add_task(send_email_async, subject, recipient, body_text)

    return user


@router.post("/token")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep,
    settings: SettingsDep,
) -> Token:
    user = authenticate_user(session, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email}, settings=settings)
    return Token(access_token=access_token)


@router.get("/users/me", response_model=UserRead)
def read_current_user(current_user: CurrentUser):
    return current_user
