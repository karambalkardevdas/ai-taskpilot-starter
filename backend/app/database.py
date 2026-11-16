import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Build DATABASE_URL from environment variables or use default
db_user = os.getenv("DB_USER", "taskpilot")
db_password = os.getenv("DB_PASSWORD", "taskpilot_dev")
db_host = os.getenv("DB_HOST", "localhost")
db_port = os.getenv("DB_PORT", "5432")
db_name = os.getenv("DB_NAME", "taskpilot")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+psycopg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
