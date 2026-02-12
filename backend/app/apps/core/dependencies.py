from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from settings import settings


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  
)


async_session_maker = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

async def get_session():
    async with async_session_maker() as session:
        yield session