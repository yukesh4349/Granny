@echo off
echo ==============================================
echo      Starting Granny Project Services
echo ==============================================

echo 1. Starting Backend, AI Microservice, and Databases via Docker...
docker-compose up -d

echo 2. Installing NPM dependencies...
call npm install

echo 3. Starting Web Portal...
start cmd /k "npm run dev:web"

echo 4. Starting Mobile App...
start cmd /k "npm run dev:mobile"

echo ==============================================
echo All services have been initiated!
echo ==============================================
