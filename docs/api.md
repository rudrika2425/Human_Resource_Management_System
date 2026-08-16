# API Reference

Base path: `/api/v1`

## Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/change-password`
- `POST /auth/register`
- `POST /auth/users/{userId}/activate`
- `POST /auth/users/{userId}/deactivate`

## Employees

- `GET /employees`
- `GET /employees/{id}`
- `POST /employees`
- `PUT /employees/{id}`
- `PATCH /employees/{id}`
- `POST /employees/{id}/activate`
- `POST /employees/{id}/deactivate`
- `DELETE /employees/{id}`

## Departments / Designations

- CRUD endpoints under `/departments` and `/designations`

## Attendance

- `POST /attendance/check-in/{employeeId}`
- `POST /attendance/check-out/{employeeId}`
- `GET /attendance/history/{employeeId}`
- `GET /attendance/summary/{employeeId}`

## Leaves

- `POST /leaves`
- `POST /leaves/{id}/approve`
- `POST /leaves/{id}/reject`
- `POST /leaves/{id}/cancel`
- `GET /leaves/history/{employeeId}`
- `GET /leaves/balance/{employeeId}?leaveType=ANNUAL`

## Payroll

- `POST /payroll/structure`
- `POST /payroll/generate`
- `GET /payroll/history/{employeeId}`
- `GET /payroll/structure/{employeeId}`

## Recruitment

- `POST /jobs`
- `GET /jobs`
- `POST /candidates`
- `GET /candidates`
- `POST /candidates/{id}/transition?status=INTERVIEW`
- `POST /interviews`
- `GET /interviews`
- `POST /interviews/{id}/status?status=COMPLETED`

## Performance

- `POST /goals`
- `GET /goals`
- `POST /performance-reviews`
- `GET /performance-reviews`

## Documents

- `POST /documents/upload`
- `GET /documents`
- `DELETE /documents/{id}`

## Notifications

- `GET /notifications`
- `GET /notifications/unread-count`
- `POST /notifications/{id}/read`

## Audit Logs

- `GET /audit-logs`

## Dashboard

- `GET /dashboard/hr`
- `GET /dashboard/manager/{managerEmployeeId}`
- `GET /dashboard/employee/{employeeId}`
