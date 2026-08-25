from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import get_settings
from app.database.session import get_db
from app.schemas.url_schema import URLCreate, URLResponse
from app.services.url_service import create_short_url
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
    )

    return URLResponse(
        id=url.id,
        short_code=url.short_code,
        short_url=f"{settings.base_url}/{url.short_code}",
        original_url=url.original_url,
        expires_at=url.expires_at,
    )