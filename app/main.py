from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
import json

from app.database.session import get_db, redis_client
from app.services.url_service import get_url_by_short_code, record_url_click
from app.api.url_routes import router as url_router
from app.api.auth_routes import router as auth_router


app = FastAPI(
    title="URLiy",
    description="URL shortener",
    version="0.1.0",
)

origins = [
    "https://urliy.spacekid.xyz",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"url:{short_code}"

    cached_data = await redis_client.get(cache_key)
    # REDIS CACHE HIT
    if cached_data:
        cached_data = json.loads(cached_data)

        await record_url_click(
            db=db,
            url_id=cached_data["url_id"],
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            referrer=request.headers.get("referer"),
        )

        return RedirectResponse(
            url=cached_data["original_url"],
            status_code=302,
        )

    url = await get_url_by_short_code(db, short_code)

    if not url:
        raise HTTPException(
            status_code=404,
            detail="Short URL not found",
        )

#EXPIRATION CHECK
    if url.expires_at and url.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=410,
            detail="Short URL has expired",
        )

#CLICK TRACKING
    await record_url_click(
        db=db,
        url_id=url.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        referrer=request.headers.get("referer"),
    )

#SAVE URL TO REDIS CACHE
    cache_data = json.dumps({
        "url_id": str(url.id),
        "original_url": url.original_url,
    })

    await redis_client.set(
        cache_key,
        cache_data,
        ex=345600,  #4 days
    )

    return RedirectResponse(
        url=url.original_url,
        status_code=302,
    )
