from fastapi import FastAPI

app = FastAPI(
    title="URLly",
    description="Production-grade URL shortener",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "urlly",
    }