# Deployment

## Backend on Render

- Build command: `cd backend && mvn clean package -DskipTests`
- Start command: `java -jar backend/target/backend-1.0.0.jar`
- Set environment variables in Render:
  - `DB_URL`
  - `DB_USERNAME`
  - `DB_PASSWORD`
  - `JWT_SECRET`
  - `JWT_ACCESS_EXPIRATION`
  - `JWT_REFRESH_EXPIRATION`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `FRONTEND_URL`

## Database

Use a managed MySQL database in production. Do not use Docker MySQL in production.

## Cloudinary

Configure the Cloudinary credentials in Render environment variables only.

## Frontend

Deploy the React frontend separately and point `VITE_API_BASE_URL` to the Render backend URL.

## CORS

Set `FRONTEND_URL` to the deployed frontend origin so credentials-based requests are allowed safely.

## Notes

- Docker Compose is only for local MySQL and Adminer.
- Production uses managed database infrastructure and external file storage.
