from sqlmodel import Session, select

from app.models.users import UserInDB
from app.utils.security import hash_password, verify_password


def get_user_by_email(session: Session, email: str):
    return session.exec(select(UserInDB).where(UserInDB.email == email)).first()


def create_user(session: Session, email: str, password: str):
    hashed_password = hash_password(password)
    user = UserInDB(email=email, password=hashed_password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate_user(session: Session, email: str, password: str):
    user = get_user_by_email(session, email)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user
