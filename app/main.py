from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.responses import RedirectResponse

from app.database.session import get_db, redis_client
from app.services.url_service import get_url_by_short_code
from app.api.url_routes import router as url_router
from app.api.auth_routes import router as auth_router

from datetime import datetime, timezone

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession


app = FastAPI(
    title="URLiy",
    description="URL shortener",
    version="0.1.0",
)


app.include_router(url_router)
app.include_router(auth_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "URLiy",
    }

@app.get("/{short_code}")
async def redirect_short_url(
    short_code: str,
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"url:{short_code}"

    cached_url = await redis_client.get(cache_key)

    if cached_url:
        return RedirectResponse(
            url=cached_url,
            status_code=302,
        )

    url = await get_url_by_short_code(db, short_code)

    if not url:
        raise HTTPException(
            status_code=404,
            detail="Short URL not found",
        )

    if url.expires_at and url.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=410,
            detail="Short URL has expired",
        )

    await redis_client.set(
        cache_key,
        url.original_url,
        ex=345600,  # 4 days
    )

    response = RedirectResponse(
        url=url.original_url,
        status_code=302,
    )
    return response