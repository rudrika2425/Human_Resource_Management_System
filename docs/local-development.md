# Local Development

1. Install Java 21.
2. Install Node.js 18+.
3. Install Docker Desktop.
4. Open the `hrm` folder in VS Code.
5. Copy `.env.example` to `.env` and set values.
6. Start the local database infrastructure:

```bash
docker compose up -d
```

7. Start the backend:

```bash
cd backend
./mvnw spring-boot:run
```

Windows:

```powershell
cd backend
mvnw.cmd spring-boot:run
```

8. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

9. Open Adminer at http://localhost:8081
10. Open Swagger at http://localhost:8080/swagger-ui/index.html
11. Open the app at http://localhost:5173

## Adminer Login

- System: MySQL
- Server: `mysql`
- Username: value of `DB_USERNAME`
- Password: value of `DB_PASSWORD`
- Database: `DB_NAME`
