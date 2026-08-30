import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.url import URL
from app.utils.short_code import generate_short_code
from app.models.url_click import URLClick

async def create_short_url(
    db: AsyncSession,
    original_url: str,
    user_id: uuid.UUID | None = None,
) -> URL:

    while True:
        short_code = generate_short_code()

        result = await db.execute(
            select(URL.id).where(URL.short_code == short_code)
        )

        if result.scalar_one_or_none() is None:
            break

    expires_at = None

    if user_id is None:
        expires_at = datetime.now(timezone.utc) + timedelta(days=4)

    url = URL(
        original_url=original_url,
        short_code=short_code,
        user_id=user_id,
        expires_at=expires_at,
    )

    db.add(url)

    await db.commit()
    await db.refresh(url)

    return url


async def get_url_by_short_code(
    db: AsyncSession,
    short_code: str,
) -> URL | None:
    result = await db.execute(
        select(URL).where(
            URL.short_code == short_code,
            URL.is_active.is_(True),
        )
    )

    return result.scalar_one_or_none()

async def create_short_url(
    db: AsyncSession,
    original_url: str,
    user_id: uuid.UUID | None = None,
    expires_at=None,
) -> URL:

    while True:
        short_code = generate_short_code()

        result = await db.execute(
            select(URL.id).where(URL.short_code == short_code)
        )

        if result.scalar_one_or_none() is None:
            break

    url = URL(
        original_url=original_url,
        short_code=short_code,
        user_id=user_id,
        expires_at=expires_at,
    )

    db.add(url)

    await db.commit()
    await db.refresh(url)

    return url

async def get_user_urls(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[URL]:
    result = await db.execute(
        select(URL)
        .where(
            URL.user_id == user_id,
            URL.is_active.is_(True),
        )
        .order_by(URL.created_at.desc())
    )

    return list(result.scalars().all())

async def record_url_click(
    db: AsyncSession,
    url_id: uuid.UUID,
    ip_address: str | None = None,
    user_agent: str | None = None,
    referrer: str | None = None,
) -> None:
    click = URLClick(
        url_id=url_id,
        ip_address=ip_address,
        user_agent=user_agent,
        referrer=referrer,
    )

    db.add(click)
    await db.commit()
async def get_url_analytics(
    db: AsyncSession,
    url_id: uuid.UUID,
) -> list[URLClick]:
    result = await db.execute(
        select(URLClick)
        .where(URLClick.url_id == url_id)
        .order_by(URLClick.clicked_at.desc())
    )
    return list(result.scalars().all())