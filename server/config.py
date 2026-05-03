import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    # Database
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'hospital.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "medvista-super-secret-key-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    # Mail (Gmail SMTP)
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "your-email@gmail.com")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "your-app-password")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_USERNAME", "your-email@gmail.com")

    # Google Gemini API
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

    # Secret key for Flask
    SECRET_KEY = os.environ.get("SECRET_KEY", "medvista-flask-secret-2026")
