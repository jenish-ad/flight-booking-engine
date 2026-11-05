from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr

from app.core.config import get_settings


def get_mail_config() -> ConnectionConfig:
    settings = get_settings()
    return ConnectionConfig(
        MAIL_USERNAME=settings.mail_username,
        MAIL_PASSWORD=settings.mail_password,
        MAIL_FROM=settings.mail_from,
        MAIL_SERVER=settings.mail_server,
        MAIL_PORT=settings.mail_port,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )


async def send_email_async(subject: str, recipients: list[EmailStr], body_text: str):
    html = f"""
    <h2>{subject}</h2>
    <br/>
    <p>{body_text}</p>
    <br/>
    <br/>
    <br/>
    <p>Best Regards</p>
    <p>Flight Booking Engine</p>
    """
    message = MessageSchema(
        subject=subject, recipients=recipients, body=html, subtype=MessageType.html
    )

    fm = FastMail(get_mail_config())
    await fm.send_message(message)
