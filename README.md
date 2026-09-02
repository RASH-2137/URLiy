<div align="center">

# 🚀 URLiy

**A URL shortener built for speed, reliability, and simplicity.**

[![Live App](https://img.shields.io/badge/Live_App-urliy.spacekid.xyz-000000?style=for-the-badge&logo=vercel)](https://urliy.spacekid.xyz)
[![Backend API](https://img.shields.io/badge/Backend_API-url.spacekid.xyz-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://url.spacekid.xyz)
[![API Docs](https://img.shields.io/badge/API_Docs-Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://url.spacekid.xyz/docs)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)]()
[![Redis](https://img.shields.io/badge/Redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)]()

</div>

---

## ✨ Overview

**URLiy** is a full-stack URL shortening platform that converts long URLs into compact, shareable links. 

It pairs a React + Vite frontend with an asynchronous FastAPI backend, PostgreSQL for persistent storage, and Redis for caching and rate limiting.

The project goes beyond basic URL shortening and includes:

* 🔗 **Short URL generation**
* 👤 **User authentication**
* 🔐 **Protected user operations**
* 📊 **Click analytics**
* ⏳ **Temporary URL expiration**
* ♾️ **Permanent URLs for authenticated users**
* ⚡ **Redis caching**
* 🛡️ **Redis-backed rate limiting**
* 🔄 **Database fallback when Redis is unavailable**
* 🔁 **Short-code collision checking**
* 🌐 **Production deployment**
* 🔒 **Environment-based configuration**
* 🚦 **Restricted CORS configuration**

### 🌐 Live Deployment

| Service | URL |
| :--- | :--- |
| **Frontend** | [https://urliy.spacekid.xyz](https://urliy.spacekid.xyz) |
| **Backend API** | [https://url.spacekid.xyz](https://url.spacekid.xyz) |
| **API Documentation** | [https://url.spacekid.xyz/docs](https://url.spacekid.xyz/docs) |

> *The frontend is deployed on Vercel; the FastAPI backend runs on Render.*

---

## 📸 Product Showcase

### Homepage
<div align="center">
  <img width="900" height="509" alt="image" src="https://github.com/user-attachments/assets/3762f10b-36b9-4201-bf5c-ccbeb04f9d0a" />
</div>

### Dashboard & URL Creation
<div align="center">
  <img width="887" height="507" alt="image" src="https://github.com/user-attachments/assets/c0395721-7f66-4e26-aa39-66fb30f52f31" />
</div>

### Analytics
<div align="center">
  <img width="900" height="507" alt="image" src="https://github.com/user-attachments/assets/0a1e1037-4606-4c96-84fe-7325bb1e9831" />

</div>

---

## 🏗️ System Architecture

URLiy follows a straightforward full-stack architecture:

```mermaid
graph TD
    User([👤 User]) -->|Interacts| FE[React + Vite<br>Hosted on Vercel]
    FE -->|REST API Calls| BE[FastAPI Backend<br>Hosted on Render]
    
    BE -->|URL Cache & Rate Limits| Redis[(Redis)]
    BE -->|URLs, Users & Analytics| PG[(PostgreSQL)]
    
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style FE fill:#61DAFB,stroke:#333,color:#000
    style BE fill:#009688,stroke:#333,color:#fff
    style Redis fill:#DC382D,stroke:#333,color:#fff
    style PG fill:#336791,stroke:#333,color:#fff
```

### 🔄 URL Redirect Flow

One of the most important parts of URLiy is the redirect path. When someone opens a shortened URL such as `https://url.spacekid.xyz/CBhm8kd`, the backend follows a cache-first strategy:

```mermaid
sequenceDiagram
    actor User
    participant API as FastAPI
    participant Cache as Redis
    participant DB as PostgreSQL

    User->>API: GET /CBhm8kd
    API->>Cache: Check for short code
    
    alt Cache HIT
        Cache-->>API: Returns Destination URL
        API-->>User: 🚀 302 Redirect
    else Cache MISS
        Cache-->>API: Not Found
        API->>DB: Query short code
        DB-->>API: Returns Destination URL
        API->>Cache: Store mapping in Redis
        API-->>User: 🚀 302 Redirect
    end
```

**Step-by-step:**
1. The client requests a short code.
2. FastAPI checks Redis for the short-code mapping.
3. If Redis contains the mapping, the destination is resolved directly from the cache.
4. If Redis misses, PostgreSQL is queried.
5. If the URL exists and is valid, the mapping is placed into Redis.
6. The backend returns an HTTP 302 redirect to the original URL.
7. The redirect is recorded for analytics.

This cache-aside approach reduces repeated database lookups for frequently accessed links.

---

## 🛡️ Engineering & Reliability

URLiy includes several mechanisms intended to make the application more resilient and safer to operate.

### ⚡ Redis URL Caching
Short-code mappings are cached in Redis, allowing frequently accessed URLs to resolve without querying PostgreSQL on every request. Cached records use a 4-day expiration for temporary URLs.

### 🔄 Redis Failure Fallback
Redis is used as a performance layer rather than the only source of truth. If Redis is unavailable during a redirect request, the application continues resolving URLs directly from PostgreSQL instead of failing just because the cache is unavailable. Redis write failures are also handled without preventing the redirect from being returned.

```mermaid
graph LR
    A[Redis Unavailable] -->|Fallback| B[(PostgreSQL)]
    B -->|URL Resolved| C[302 Redirect]
    style A fill:#ffcccc,stroke:#ff0000
    style B fill:#336791,color:#fff
```

### 🛡️ Rate Limiting
URLiy uses Redis-backed request counters to limit API traffic. The rate limiter:
* Identifies clients using their IP address
* Uses Redis INCR counters
* Applies an expiration window using EXPIRE
* Returns HTTP 429 Too Many Requests when the configured limit is exceeded
* Fails open if Redis itself is unavailable, so the application keeps operating

This helps reduce excessive API requests and basic abuse/spam.

### 🔁 Short-Code Collision Handling
Short codes are generated automatically. Before inserting a generated code into PostgreSQL, URLiy checks whether that code already exists:

```mermaid
graph TD
    A[Generate short code] --> B{Does code already exist?}
    B -->|YES| A
    B -->|NO| C[Save URL to DB]
```

This prevents the application from ever assigning an already-used short code.

### ⏳ URL Expiration
Temporary URLs receive an expiration time. When a user requests an expired URL, the backend returns HTTP 410 Gone. Authenticated users can also create permanent URLs without an expiration time.

### 🔐 Authentication & Authorization
URLiy includes authenticated user functionality. Protected operations include:
* Creating permanent URLs
* Viewing a user's URL history
* Deleting/deactivating owned URLs
* Viewing analytics for owned URLs

Authorization checks ensure users cannot access protected URL-management or analytics operations belonging to another user.

### 📊 Click Analytics
Redirect requests are recorded as URL clicks. The analytics system stores information associated with each click, including:
* Click ID
* URL ID
* IP address
* User agent
* Referrer
* Timestamp

Authenticated users can retrieve analytics for their own URLs.

### 🌐 CORS Protection
The API uses FastAPI's CORS middleware. Production frontend origins are explicitly configured rather than allowing arbitrary origins, preventing unrelated websites from freely making browser-based cross-origin requests to the API.

### 🔑 Environment-Based Configuration
Infrastructure configuration and secrets are supplied through environment variables rather than being hardcoded into application source code. Typical configuration includes: `DATABASE_URL`, `REDIS_URL`, `BASE_URL`, `SECRET_KEY`, `ENVIRONMENT`.

> ⚠️ **Local .env files should never contain production credentials and should never be committed to Git.**

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | User interface |
| **Backend** | Python + FastAPI | REST API and redirect engine |
| **ORM** | SQLAlchemy | Database access |
| **Database** | PostgreSQL | Persistent application data |
| **Cache** | Redis | URL caching and rate limiting |
| **Authentication** | JWT | JSON Web Token user authentication |
| **Frontend Hosting** | Vercel | Production frontend deployment |
| **Backend Hosting** | Render | Production API deployment |

---

## 🔌 API Overview

* **Base URL:** `https://url.spacekid.xyz`
* **Interactive API documentation:** `https://url.spacekid.xyz/docs`

### URL Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/urls/` | No | Create a temporary short URL |
| `POST` | `/api/v1/urls/permanent` | Yes | Create a permanent URL |
| `GET` | `/api/v1/urls/my` | Yes | Retrieve the authenticated user's URLs |
| `DELETE` | `/api/v1/urls/{short_code}` | Yes | Deactivate an owned URL |
| `GET` | `/api/v1/urls/{short_code}/analytics` | Yes | Retrieve click analytics |
| `GET` | `/{short_code}` | No | Resolve and redirect a short URL |
| `GET` | `/health` | No | Application health/status endpoint |

---

## 📁 Project Structure

```text
URLiy/
│
├── app/
│   ├── api/
│   │   ├── auth_routes.py
│   │   └── url_routes.py
│   ├── auth/
│   │   └── dependencies.py
│   ├── cache/
│   ├── config/
│   ├── database/
│   │   └── session.py
│   ├── dependencies/
│   ├── middleware/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   │   └── url_service.py
│   ├── tasks/
│   ├── utils/
│   │   └── rate_limit.py
│   ├── workers/
│   └── main.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
│
├── docs/
│   ├── screenshots/
│   │   ├── homepage.png
│   │   ├── dashboard.png
│   │   └── analytics.png
│   └── architecture/
│       └── urliy-system-design.png
│
├── .gitignore
└── README.md
```

---

## 🚀 Local Development

### Prerequisites
Make sure the following are installed:
* Python 3.10+
* Node.js 18+
* PostgreSQL
* Redis

### 1. Clone the Repository
```bash
git clone https://github.com/RASH-2137/URLiy.git
cd URLiy
```

### 2. Create a Python Virtual Environment
**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file according to the configuration expected by the application.

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/urliy
REDIS_URL=redis://localhost:6379/0
BASE_URL=http://localhost:8000
SECRET_KEY=change_this_for_local_development
ENVIRONMENT=development
```

> ⚠️ Never commit real production credentials or secrets to GitHub.

### 5. Start the Backend
From the project root:
```bash
uvicorn app.main:app --reload
```

* API: `http://127.0.0.1:8000`
* Interactive docs: `http://127.0.0.1:8000/docs`
* Health endpoint: `http://127.0.0.1:8000/health`

### 6. Start the Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```

The frontend will normally be available at `http://localhost:5173`.

### 🧪 Basic Verification
Check Python syntax before deploying changes:
```bash
python -m compileall app
```

Check for Git whitespace errors:
```bash
git diff --check
```

---

## 🚢 Deployment

### Frontend — Vercel
The React/Vite frontend is deployed through Vercel.
* Production frontend: `https://urliy.spacekid.xyz`

### Backend — Render
The FastAPI backend is deployed through Render.
* Production API: `https://url.spacekid.xyz`

*(The custom domain points to the Render service, while the frontend remains independently deployed through Vercel.)*

### 🔒 Production Considerations
URLiy separates the frontend, API, database, and caching layers:

```mermaid
graph TD
    V[Vercel Frontend] -->|HTTPS| R[Render / FastAPI]
    R -->|Reads/Writes| PG[(PostgreSQL)]
    R -->|Cache| Redis[(Redis)]
```

The application uses:
* Environment variables for sensitive configuration
* Restricted production CORS origins
* Authentication for protected operations
* Authorization checks for user-owned resources
* Redis-backed request limiting
* Database fallback for Redis failures
* URL expiration
* Short-code collision checks

---

## 🔮 Future Improvements

* 📱 QR code generation
* ✏️ Custom aliases
* 📊 More advanced analytics and visualizations
* 🌍 Geographic analytics
* 🧹 Automated cleanup of expired URLs
* 🧪 Expanded automated test coverage
* 📈 More detailed observability and monitoring
* ⚙️ Additional abuse-prevention mechanisms
* 🌐 Support for user-managed custom domains

---

## 🎯 Project Goals

URLiy was built to explore and demonstrate practical full-stack engineering concepts, including:
* Asynchronous Python APIs
* REST API design
* Database modeling
* Authentication and authorization
* Caching strategies
* Rate limiting
* Failure handling
* URL redirection
* Analytics
* Environment-based configuration
* Production deployment
* Frontend/backend integration

The goal wasn't simply to generate shorter URLs, but to build a small production-style system with multiple components working together reliably.

---

<div align="center">

**👨‍💻 Rahul Sharma**

Portfolio: https://rash-2137.github.io

GitHub: https://github.com/RASH-2137

[Report Bug](../../issues) · [Request Feature](../../issues) · [Discussions](../../discussions)

</div>
