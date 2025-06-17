# DataViz Service

AI-powered dashboard and chart service with real-time data visualization, user authentication, and intelligent chart suggestions.

## Architecture Overview

```mermaid
flowchart TB
    subgraph "Client Layer"
        UI[Frontend App]
        API[API Clients]
    end
    
    subgraph "DataViz Service"
        AUTH[Authentication]
        CHARTS[Charts API]
        DASH[Dashboards API]
        AI[AI Suggestions]
        HEALTH[Health Checks]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        REMOTE[Remote Data Sources]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI GPT-4]
        EMAIL[Resend Email]
    end
    
    UI --> AUTH
    UI --> CHARTS
    UI --> DASH
    API --> CHARTS
    
    CHARTS --> AI
    AI --> OPENAI
    AUTH --> EMAIL
    
    CHARTS --> DB
    DASH --> DB
    AUTH --> DB
    
    CHARTS -.-> REMOTE
    
    classDef api fill:#e3f2fd
    classDef data fill:#f3e5f5
    classDef external fill:#fff3e0
    
    class AUTH,CHARTS,DASH,AI api
    class DB,REMOTE data
    class OPENAI,EMAIL external
```

## Database Schema

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string password
        timestamp createdAt
        timestamp updatedAt
    }
    
    Chart {
        string id PK
        string name
        string description
        string chart
        json config
        json data
        boolean publish
        string remoteUrl
        boolean isRemote
        string preview
        string userId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    Dashboard {
        string id PK
        string name
        string description
        boolean publish
        string userId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    Slot {
        string dashboardId PK,FK
        string chartId PK,FK
        json settings
        timestamp createdAt
        timestamp updatedAt
    }
    
    Codes {
        string id PK
        string code
        string userId FK
        int expire
        timestamp createdAt
        timestamp updatedAt
    }
    
    User ||--o{ Chart : creates
    User ||--o{ Dashboard : owns
    Dashboard ||--o{ Slot : contains
    Chart ||--o{ Slot : placed_in
    User ||--o{ Codes : has_activation_codes
```

## API Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant A as Auth API
    participant C as Charts API
    participant D as Dashboard API
    participant AI as AI Service
    participant DB as Database
    participant EXT as External APIs
    
    Note over U,EXT: User Registration & Login
    U->>A: POST /auth/register
    A->>DB: Create user
    A->>EXT: Send activation email
    A-->>U: Registration successful
    
    U->>A: POST /auth/login
    A->>DB: Verify credentials
    A-->>U: Set auth cookie
    
    Note over U,EXT: Chart Creation with AI
    U->>C: POST /charts (with data)
    C->>AI: POST /hints (data analysis)
    AI->>EXT: Query OpenAI for suggestions
    AI-->>C: Chart recommendations
    C->>DB: Save chart
    C-->>U: Chart created with AI suggestions
    
    Note over U,EXT: Dashboard Management
    U->>D: POST /dashboards
    D->>DB: Create dashboard
    D-->>U: Dashboard created
    
    U->>D: PUT /dashboards/:id/slots
    D->>DB: Update chart slots
    D-->>U: Dashboard layout saved
    
    Note over U,EXT: Public Access
    U->>C: GET /charts/show/:id
    C->>DB: Check if published
    alt Chart is remote
        C->>EXT: Fetch latest data
        C->>DB: Update chart data
    end
    C-->>U: Chart data
```

## Quick Start

### Local Development (Non-Containerized)

```bash
# Clone repository
git clone <repository-url>
cd dataviz-srv

# Install dependencies
bun install

# Install Prisma globally
bun install -g prisma@5.19.0

# Setup environment
cp sample.env .env
# Edit .env with your configuration:
# DATABASE_URL=postgresql://user:password@localhost:5432/dataviz
# JWT_SECRET=your-secret-key
# OPENAI_API_KEY=sk-your-key (optional)
# RESEND_API_KEY=re-your-key (optional)

# Setup PostgreSQL database
# Option 1: Local PostgreSQL
createdb dataviz
# Option 2: Use existing database URL in .env

# Generate Prisma client and apply schema
npx prisma db push

# Seed test data (optional)
bun run seeds/seed-users.ts

# Start development server
bun run dev
# Server runs on http://localhost:3003
```

### Development with Docker

```bash
# Start with Docker Compose
docker-compose up --build

# Run tests
curl http://localhost:3003/api/health
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration with email activation
- `POST /auth/login` - Login with JWT cookie
- `GET /auth/user` - Get current user info
- `GET /auth/logout` - Logout and clear cookie

### Charts
- `GET /charts` - List user's charts
- `POST /charts` - Create new chart
- `GET /charts/:id` - Get chart details (auth required)
- `GET /charts/show/:id` - Public chart view (if published)
- `PUT /charts/:id` - Update chart
- `DELETE /charts/:id` - Delete chart
- `POST /charts/publish/:id` - Toggle chart visibility

### Dashboards
- `GET /dashboards` - List user's dashboards
- `POST /dashboards` - Create dashboard
- `GET /dashboards/:id` - Get dashboard details
- `PUT /dashboards/:id` - Update dashboard
- `PUT /dashboards/:id/slots` - Update chart layout
- `DELETE /dashboards/:id` - Delete dashboard

### AI Suggestions
- `POST /hints` - Get AI-powered chart suggestions from data

### Health & Monitoring
- `GET /api/health` - Application health status
- `GET /api/ready` - Readiness probe (checks database)
- `GET /api/startup` - Startup probe (checks initialization)
- `GET /api/metrics` - Prometheus metrics

## Features

### 🤖 AI-Powered Chart Suggestions
- Upload CSV/JSON data to get intelligent visualization recommendations
- OpenAI GPT-4 analyzes data structure and suggests optimal chart types
- Automatic data transformation suggestions (grouping, aggregation, pivoting)

## Data Format

DataViz expects data in matrix format for charting:

### Sample Data Structure
```json
[
  ["_", "2024-09-18", "2024-09-19", "2024-09-20", "2024-09-21", "2024-09-22"],
  ["Visits", 4319, 4405, 3821, 485, 251],
  ["Uniq Visitors", 3292, 3303, 2891, 407, 224],
  ["New Visits", 1102, 1109, 920, 177, 108]
]
```

**Format Rules:**
- First row: category headers (dates, regions, etc.)
- First column: series names 
- First cell (`[0][0]`): placeholder (`"_"` or `"-"`)
- Data cells: numeric values for visualization

### Supported Chart Types
- **Bar Charts** - Categorical data comparison
- **Line Charts** - Time series and trends
- **Pie/Donut Charts** - Part-to-whole relationships
- **Geo Charts** - Geographic data visualization
- **Network/Scatter Plots** - Relationships and correlations

### 🏗️ Dashboard Builder
- Drag-and-drop chart layout with grid system
- Multiple charts per dashboard
- Configurable chart settings and positioning
- Published dashboards for public sharing

### 🔐 Security Features
- JWT-based authentication with HTTP-only cookies
- Email activation system with PIN codes
- User isolation (users can only access their own data)
- CORS protection and security headers

### 📈 Remote Data Integration
- Charts can pull data from external URLs
- Automatic data refresh for remote sources (daily)
- Cached data with smart update logic

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT token signing |
| `NODE_ENV` | No | Environment (development/production) |
| `PORT` | No | Server port (default: 3003) |
| `LOG_LEVEL` | No | Logging level (debug/info/warn/error) |
| `OPENAI_API_KEY` | No | OpenAI API key for AI suggestions |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `SENDER_EMAIL` | No | From email address |
| `HOST` | No | Base URL for email links |
| `DOMAINS` | No | Allowed CORS domains (comma-separated) |

### Database Setup

```bash
# Generate Prisma client
bunx prisma generate

# Apply migrations
bunx prisma migrate deploy

# Seed test data
bun run seeds/seed-users.ts

# View database
bunx prisma studio
```

## Development Tools

### Bruno API Collection
Test all endpoints with the included Bruno collection:
```bash
cd bruno/
# Open with Bruno REST client
```

### Health Monitoring
- Structured JSON logging with configurable levels
- Prometheus metrics for monitoring
- Health checks for Kubernetes deployment
- Request/response logging middleware

### Docker Support
- `Dockerfile` - Production image
- `Dockerfile.dev` - Development with hot reload  
- `docker-compose.yaml` - Full development stack

## Deployment

### Local Development
```bash
bun run dev  # Hot reload server
```

### Docker
```bash
docker build -t dataviz-srv .
docker run -p 3003:3003 dataviz-srv
```

### Fly.io Deployment

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and create app
flyctl auth login
flyctl launch --no-deploy

# Set environment variables
flyctl secrets set \
  DATABASE_URL="postgres://user:pass@host:5432/dbname" \
  JWT_SECRET="your-secure-jwt-secret" \
  OPENAI_API_KEY="sk-your-openai-key" \
  RESEND_API_KEY="re-your-resend-key"

# Deploy application
flyctl deploy

# Check deployment status
flyctl status
flyctl logs
```

**Fly.io Configuration** (`fly.toml`):
- Uses Dockerfile for production build
- Automatic HTTPS with certificates
- Health checks on `/api/health`
- Environment variables via `flyctl secrets`

### Kubernetes (Helm)
```bash
helm upgrade --install dataviz-srv ./charts/dataviz-srv \
  --namespace dataviz \
  --create-namespace
```

See [charts/dataviz-srv/README.md](charts/dataviz-srv/README.md) for detailed Helm configuration.

## Project Structure

```
├── lib/                    # Core utilities
│   ├── ai.ts              # OpenAI integration
│   ├── db.ts              # Database operations
│   ├── email.ts           # Email templates & sending
│   ├── jwt.ts             # JWT token management
│   ├── logger.ts          # Structured logging
│   ├── middlewares.ts     # Express middleware
│   └── pin.ts             # PIN generation
├── routes/                # API endpoints
│   ├── auth.ts            # Authentication routes
│   ├── charts.ts          # Chart CRUD operations
│   ├── dashboards.ts      # Dashboard management
│   ├── health.ts          # Health check endpoints
│   └── hints.ts           # AI suggestions
├── domain/                # Business logic
│   └── dashboard-facade.ts
├── repository/            # Data access layer
│   ├── dashboard-repository.ts
│   └── repository-factory.ts
├── prisma/                # Database schema & migrations
├── bruno/                 # API testing collection
├── charts/dataviz-srv/    # Helm chart for K8s deployment
└── docker-compose.yaml    # Development environment
```

## API Examples

### Create Chart with AI Suggestions
```bash
# 1. Upload data and get AI suggestions
curl -X POST http://localhost:3003/hints \
  -H "Cookie: access_token=..." \
  -H "Content-Type: application/json" \
  -d '[["Region","Sales","Profit"],["North",100,20],["South",150,30]]'

# 2. Create chart based on suggestion
curl -X POST http://localhost:3003/charts \
  -H "Cookie: access_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales by Region",
    "chart": "bar",
    "data": [["Region","Sales"],["North",100],["South",150]],
    "config": {"xAxis": "Region", "yAxis": ["Sales"]}
  }'
```

### Dashboard Layout Management
```bash
# Update dashboard with chart positions
curl -X PUT http://localhost:3003/dashboards/dashboard-id/slots \
  -H "Cookie: access_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "slots": [
      {
        "chartId": "chart-1",
        "settings": {"x": 0, "y": 0, "w": 2, "h": 1}
      },
      {
        "chartId": "chart-2", 
        "settings": {"x": 2, "y": 0, "w": 2, "h": 1}
      }
    ]
  }'
```

## Monitoring & Observability

### Metrics Available
- `dataviz_uptime_seconds` - Service uptime
- `dataviz_memory_usage_bytes` - Memory consumption  
- `dataviz_database_status` - DB connection health
- `dataviz_users_total` - Total registered users
- `dataviz_charts_total` - Total charts created
- `dataviz_dashboards_total` - Total dashboards

### Logging Format
```json
{
  "service": "dataviz-srv",
  "level": "info",
  "message": "HTTP request",
  "method": "GET",
  "url": "/charts",
  "status": 200,
  "duration_ms": 45,
  "user_id": "user-123"
}
```