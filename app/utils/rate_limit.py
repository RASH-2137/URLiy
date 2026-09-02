from fastapi import HTTPException, Request, status

from app.database.session import redis_client


async def rate_limit(
    request: Request,
    limit: int,
    window_seconds: int,
    key_prefix: str,
) -> None:
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{key_prefix}:{client_ip}"

    try:
        async with redis_client.pipeline(transaction=True) as pipe:
            pipe.incr(key)
            pipe.expire(key, window_seconds)
            results = await pipe.execute()

        request_count = results[0]

        if request_count > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )

    except HTTPException:
        raise

    except Exception:
        return