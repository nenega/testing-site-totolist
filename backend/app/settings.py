from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


env_path = Path(__file__).parent / ".env"

class DataBaseSettings(BaseSettings):
    PGHOST: str
    PGDATABASE: str
    PGUSER: str
    PGPASSWORD: str
    PGPORT: int = 5432

    @property
    def DATABASE_URL(self) -> str:
        return (f'postgresql+asyncpg://{self.PGUSER}:{self.PGPASSWORD}@{self.PGHOST}:{self.PGPORT}/{self.PGDATABASE}')

class Settings(DataBaseSettings):
    DEBUG: bool = False

    model_config = SettingsConfigDict(
        env_file=env_path, 
        env_file_encoding='utf-8',
        extra='ignore'
    )


settings = Settings()