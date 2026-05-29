@echo off
echo Starting Campus AI Backend...
cd backend
start cmd /k "maven\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run"
cd ..

echo Starting Campus AI Frontend...
cd frontend
start cmd /k "npm run dev"
cd ..

echo Project is starting up!
echo Frontend will be available at http://localhost:5173
echo Backend API will be available at http://localhost:8080/api
