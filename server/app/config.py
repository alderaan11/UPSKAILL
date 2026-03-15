from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    newsapi_key: str = ""
    adzuna_app_id: str = ""
    adzuna_app_key: str = ""
    france_travail_client_id: str = ""
    france_travail_client_secret: str = ""
    supabase_url: str = ""
    supabase_service_role_key: str = ""  # server-side only, never sent to browser
    supabase_jwt_secret: str = ""        # Dashboard → Project Settings → API → JWT Secret
    allowed_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
