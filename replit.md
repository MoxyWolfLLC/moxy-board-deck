# MoxyWolf Board Deck App

## Overview
A business metrics tracking application for MoxyWolf products. Enables operators to submit weekly/monthly KPI data and admins to manage users and generate board decks.

## Current State
MVP implementation with:
- User authentication (login/register)
- Role-based access (admin/operator)
- Product-based KPI submission forms
- Admin panel for user management with product assignment
- Deck generation system
- LivePlan financial data entry with 8 metrics (Revenue, Expenses, Operating Income/Margin, Net Profit, Cash Balance, AR, Days to Get Paid)
- Product filtering: Operators only see assigned products, admins see all products

## Architecture

### Frontend (React + Vite)
- **Pages**: Login, Register, Dashboard, Submit, Admin
- **UI**: Shadcn components with MoxyWolf dark theme (navy/orange)
- **State**: TanStack Query for server state, Zustand for auth

### Backend (Express)
- **Auth**: Session-based with express-session
- **Storage**: In-memory storage (MemStorage class)
- **API**: RESTful endpoints under /api

### Data Models
- **Users**: id, email, password, name, role, products (assigned product IDs), createdAt
- **Submissions**: id, productId, fieldName, value, userEmail, periodType, periodStart, updatedAt
- **DeckGeneration**: id, generatedBy, periodType, periodStart, slidesUrl, status, createdAt
- **FinancialRecord**: id, periodStart, periodEnd, revenue, expenses, operatingIncome, operatingMargin, netProfit, cashBalance, accountsReceivable, daysToGetPaid, updatedAt, updatedBy

### Products
5 default products with KPI fields:
- STIGViewer, DeepFeedback, PRMVP, SAMS, RegGenome

Each product has fields across 4 categories:
- KR1 (Sales & Marketing): TOF, MOF, BOF, Revenue
- KR2 (Development): Sprint velocity, Bug count
- KR3 (Operations): Uptime, Response time
- North Star: Trend, Days to Revenue, Churn, etc.

## Demo Credentials
- Admin: admin@moxywolf.com / admin123

## Routes
- `/` - Redirects to login
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Product selection dashboard
- `/submit/:productId` - KPI submission form
- `/admin` - Admin panel (admin only)

## API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/submissions` - Get submissions
- `POST /api/submissions` - Create/update submission
- `GET /api/admin/users` - Get all users (admin)
- `POST /api/admin/users` - Create user (admin)
- `PATCH /api/admin/users/:id` - Update user (admin)
- `DELETE /api/admin/users/:id` - Delete user (admin)
- `GET /api/admin/generations` - Get deck generations (admin)
- `POST /api/admin/generate-deck` - Generate deck (admin)
- `GET /api/admin/financials` - Get all financial records (admin)
- `GET /api/admin/financials/:period` - Get financial record by period (admin)
- `POST /api/admin/financials` - Create/update financial record (admin)

## Theme Colors
- Primary: #FF6B35 (MoxyWolf Orange)
- Background: Dark navy (#1a1a2e / #16213e)
- Card: Lighter navy with transparency
