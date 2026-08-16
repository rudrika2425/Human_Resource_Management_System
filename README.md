# HRMS - Human Resource Management System

HRMS is a production-style modular monolith built with Spring Boot and React for HR operations: employee management, attendance, leave, payroll, recruitment, performance, documents, notifications, audit logs, and dashboards.

## Tech Stack

- Backend: Java 21, Spring Boot 3, Spring Web, Spring Data JPA, Spring Security, JWT, MySQL 8, Lombok, Validation, OpenAPI, JUnit 5, Mockito, MockMvc
- Frontend: React, JavaScript, Vite, Tailwind CSS, React Router, Axios, TanStack Query
- Storage: Cloudinary
- Local database infra: Docker Compose, MySQL, Adminer

## Features

- JWT login, refresh, logout, current-user, password change
- RBAC for SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE
- Employee, department, designation management
- Attendance check-in/check-out and summaries
- Leave application workflow with balances and overlap checks
- Salary structure and payroll generation with strategy/factory selection
- Recruitment, candidates, interviews, and status transitions
- Goals and performance reviews
- Cloudinary-backed document storage
- Persistent notifications and audit logs
- HR dashboard and employee 360 view

## Repository Layout

- `backend/` Spring Boot API
- `frontend/` React client
- `docker-compose.yml` local MySQL + Adminer
- `docs/` architecture and deployment notes

## Local Setup

1. Copy `.env.example` to `.env` and configure the values.
2. Start the database infrastructure:

```bash
docker compose up -d
```

3. Start the backend:

```bash
cd backend
./mvnw spring-boot:run
```

Windows:

```powershell
cd backend
mvnw.cmd spring-boot:run
```

4. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Local URLs

- Backend: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui/index.html
- Frontend: http://localhost:5173
- Adminer: http://localhost:8081
- MySQL: localhost:3306

## Adminer Login

- System: MySQL
- Server: `mysql`
- Username: value from `DB_USERNAME`
- Password: value from `DB_PASSWORD`
- Database: `DB_NAME`

## Docker Notes

Docker is only used for local MySQL and Adminer.
The Spring Boot application runs on the host machine, not inside Docker.

Useful commands:

```bash
docker compose ps
docker compose logs mysql
docker compose down
```

## Backend Highlights

- DTO-first REST API design
- Transactional service layer
- Specifications for employee filtering
- Cloudinary file abstraction
- Centralized exception handling
- OpenAPI security definition for JWT

## Frontend Highlights

- Premium green/black SaaS UI
- Protected routes and token refresh
- Responsive sidebar and top bar
- Real backend integration for all implemented pages

## Testing

Run backend tests:

```bash
cd backend
mvn test
```

## Production Deployment

- Backend: Render
- Database: managed MySQL
- Storage: Cloudinary
- Frontend: any static host or Render static site

See `docs/deployment.md` for the full Render setup.

## Screenshots

Add screenshots here after running the app locally.

## Future Improvements

- Add field-level permissions and approval history screens
- Expand report exports
- Add file previews and richer employee 360 charts
- Add scheduled payroll and notifications jobs
