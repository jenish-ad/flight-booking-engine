import os
from email.message import EmailMessage

from aiosmtplib import SMTP
from dotenv import load_dotenv

load_dotenv()


async def send_email_async(subject: str, recipient: str, body: str):
    message = EmailMessage()
    message["From"] = f"{os.getenv('MAIL_FROM_NAME')}"
    message["To"] = recipient
    message["Subject"] = subject

    smtp = SMTP(
        hostname=os.getenv("MAIL_HOST"),
        port=int(os.getenv("MAIL_PORT")),
        start_tls=True,
    )

    await smtp.connect()
    await smtp.starttls()
    await smtp.login(os.getenv("MAIL_USERNAME"), os.getenv("MAIL_PASSWORD"))
    await smtp.quit()
