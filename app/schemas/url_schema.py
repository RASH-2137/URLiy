from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, HttpUrl


class URLCreate(BaseModel):
    original_url: HttpUrl
    expires_at: datetime | None = None


class URLResponse(BaseModel):
    id: UUID
    short_code: str
    short_url: str
    original_url: HttpUrl
    expires_at: datetime | None
class URLClickSchema(BaseModel):
    id: UUID
    ip_address: str | None = None
    user_agent: str | None = None
    referrer: str | None = None
    clicked_at: datetime

class URLAnalyticsResponse(BaseModel):
    id: UUID
    short_code: str
    original_url: HttpUrl
    clicks: list[URLClickSchema]