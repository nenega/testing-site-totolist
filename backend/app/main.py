from fastapi import FastAPI
from apps.users.routers import users_router
from settings import settings
from apps.core.base_model import Base
from apps.core.dependencies import engine 

def get_application() -> FastAPI:
    _app = FastAPI(
        debug=settings.DEBUG
    )
    _app.include_router(users_router, prefix='/users', tags=['Users'])
    return _app


app = get_application()
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)