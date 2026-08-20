<div align="center">

# HRMS — Human Resource Management System

A production-style modular monolith for HR operations — employee management, attendance, leave, payroll, recruitment, performance, documents, notifications, audit logs, and dashboards.

</div>

---

## Table of Contents

- [Live Deployment](#live-deployment)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Repository Layout](#repository-layout)
- [Local Setup](#local-setup)
- [Local URLs](#local-urls)
- [Backend Highlights](#backend-highlights)
- [Frontend Highlights](#frontend-highlights)
- [Testing](#testing)
- [Deployment (Railway)](#deployment-railway)
- [Future Improvements](#future-improvements)

---

## Live Deployment

| Service | URL |
|---|---|
| Frontend | [meticulous-courage-production-58ee.up.railway.app](https://meticulous-courage-production-58ee.up.railway.app/) |
| Backend API | [humanresourcemanagementsystem-production.up.railway.app](https://humanresourcemanagementsystem-production.up.railway.app/) |
| Swagger UI | [/swagger-ui/index.html](https://humanresourcemanagementsystem-production.up.railway.app/swagger-ui/index.html) |
| Database (Railway proxy) | [sakura.proxy.rlwy.net](https://sakura.proxy.rlwy.net/) |

---

## Tech Stack

| Layer | Stack |
|---|---|
| **Backend** | Java 20, Spring Boot 3, Spring Web, Spring Data JPA, Spring Security, JWT, MySQL 8, Lombok, Validation, OpenAPI, JUnit 5, Mockito, MockMvc |
| **Frontend** | React, JavaScript, Vite, Tailwind CSS, React Router, Axios, TanStack Query |
| **Storage** | Cloudinary |
| **Email** | Resend (password reset emails) |
| **Deployment** | Railway (backend, frontend, and MySQL) |

---

## Features

- JWT login, refresh, logout, current-user, password change
- Role-based access control across the platform
- Employee, department, designation management
- Attendance check-in/check-out and summaries
- Leave application workflow with balances and overlap checks
- Salary structure and payroll generation with strategy/factory selection
- Recruitment, candidates, interviews, and status transitions
- Goals and performance reviews
- Cloudinary-backed document storage
- Password reset emails via Resend
- Persistent notifications and audit logs
- HR dashboard and employee 360 view

---

## Repository Layout

```
├── backend/            # Spring Boot API
├── frontend/           # React client
```

---

## Local Setup

> Requires a running MySQL instance and a Resend API key for password reset emails.

**1. Configure environment variables**

```bash
cp .env.example .env
```
Fill in your database connection, JWT secret, Cloudinary credentials, and Resend API key.

**2. Start the backend**

```bash
cd backend
./mvnw spring-boot:run
```

Windows:

```powershell
cd backend
mvnw.cmd spring-boot:run
```

**3. Start the frontend**

```bash
cd frontend
npm install
npm run dev
```

---

## Local URLs

| Service | URL |
|---|---|
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui/index.html |
| Frontend | http://localhost:5173 |
| MySQL | localhost:3306 |

---

## Backend Highlights

- DTO-first REST API design
- Transactional service layer
- Specifications for employee filtering
- Cloudinary file abstraction
- Resend integration for transactional email
- Centralized exception handling
- OpenAPI security definition for JWT

## Frontend Highlights

- Clean, responsive SaaS-style UI with light/dark theme support
- Protected routes and automatic token refresh
- Responsive sidebar and top bar across all screen sizes
- Real backend integration for all implemented pages

---

## Testing

```bash
cd backend
mvn test
```

---

## Deployment (Railway)

This project is deployed entirely on **[Railway](https://railway.app)**.

1. A Railway MySQL plugin provides the database, exposed via the proxy at `sakura.proxy.rlwy.net`.
2. The `backend/` service is deployed on Railway with the following environment variables configured:
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (from the Railway MySQL plugin)
   - `JWT_SECRET`
   - Cloudinary credentials
   - Resend API key
3. The `frontend/` service is deployed as a separate Railway service, with `VITE_API_BASE_URL` pointing to the backend URL above.
4. Live URLs:
   - Frontend: https://meticulous-courage-production-58ee.up.railway.app/
   - Backend: https://humanresourcemanagementsystem-production.up.railway.app/
   - Swagger: https://humanresourcemanagementsystem-production.up.railway.app/swagger-ui/index.html

---

## Future Improvements

- [ ] Add field-level permissions and approval history screens
- [ ] Expand report exports
- [ ] Add file previews and richer employee 360 charts
- [ ] Add scheduled payroll and notifications jobs