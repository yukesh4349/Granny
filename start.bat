@echo off
echo ==============================================
echo      Starting Granny Project Services
echo ==============================================

echo 1. Generating Prisma DB Client...
call npx prisma generate --schema=backend/prisma/schema.prisma

echo 2. Starting Backend Server (Port 4000)...
start cmd /k "npm run dev:backend"

echo 3. Starting Web Portal (Port 5173)...
start cmd /k "npm run dev:web"

echo 4. Starting Mobile App...
start cmd /k "npm run dev:mobile"

echo ==============================================
echo All Granny services are now running!
echo Backend API: http://localhost:4000/api
echo Health Check: http://localhost:4000/health
echo Web Portal:  http://localhost:5173
echo ==============================================
