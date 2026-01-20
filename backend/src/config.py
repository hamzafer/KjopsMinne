from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/kvitteringshvelv"
    use_mock_ocr: bool = True
    upload_dir: str = "uploads"
    admin_api_key: str = ""  # Empty = disabled

    class Config:
        env_file = ".env"


settings = Settings()
