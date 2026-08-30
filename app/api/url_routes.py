from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from app.config.settings import get_settings
from app.database.session import get_db
from app.schemas.url_schema import URLCreate, URLResponse, URLAnalyticsResponse, URLClickSchema
from app.services.url_service import create_short_url, get_user_urls, get_url_by_short_code, get_url_analytics
from app.auth.dependencies import get_current_user
from app.models.user import User
from fastapi import HTTPException
from app.database.session import redis_client

settings = get_settings()

router = APIRouter(
    prefix="/api/v1/urls",
    tags=["URLs"],
)


@router.post(
    "/",
    response_model=URLResponse,
    status_code=status.HTTP_201_CREATED,
)
async def shorten_url(
    data: URLCreate,
    db: AsyncSession = Depends(get_db),
):
    url = await create_short_url(
        db=db,
        original_url=str(data.original_url),
        expires_at=datetime.now(timezone.utc) + timedelta(days=4),
    )

    return URLResponse(
        id=url.id,
        short_code=url.short_code,
        short_url=f"{settings.base_url}/{url.short_code}",
        original_url=url.original_url,
        expires_at=url.expires_at,
    )

@router.post(
    "/permanent",
    response_model=URLResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_permanent_url(
    data: URLCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url = await create_short_url(
        db=db,
        original_url=str(data.original_url),
        user_id=current_user.id,
        expires_at=None,
    )

    return URLResponse(
        id=url.id,
        short_code=url.short_code,
        short_url=f"{settings.base_url}/{url.short_code}",
        original_url=url.original_url,
        expires_at=None,
    )

@router.get(
    "/my",
    response_model=list[URLResponse],
)
async def get_my_urls(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    urls = await get_user_urls(
        db=db,
        user_id=current_user.id,
    )

    return [
        URLResponse(
            id=url.id,
            short_code=url.short_code,
            short_url=f"{settings.base_url}/{url.short_code}",
            original_url=url.original_url,
            expires_at=url.expires_at,
        )
        for url in urls
    ]

@router.delete(
    "/{short_code}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_url(
    short_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url = await get_url_by_short_code(db, short_code)

    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Short URL not found",
        )

    if url.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this URL",
        )

    url.is_active = False

    await db.commit()

    await redis_client.delete(f"url:{short_code}")
@router.get(
    '/{short_code}/analytics',
    response_model=URLAnalyticsResponse,
)
async def get_analytics(
    short_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url = await get_url_by_short_code(db, short_code)

    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Short URL not found',
        )

    if url.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='You do not have permission to view analytics for this URL',
        )

    clicks = await get_url_analytics(db, url.id)

    return URLAnalyticsResponse(
        id=url.id,
        short_code=url.short_code,
        original_url=url.original_url,
        clicks=[
            URLClickSchema(
                id=c.id,
                ip_address=c.ip_address,
                user_agent=c.user_agent,
                referrer=c.referrer,
                clicked_at=c.clicked_at,
            ) for c in clicks
        ]
    )