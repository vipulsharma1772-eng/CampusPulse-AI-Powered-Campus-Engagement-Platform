@echo off
echo ==============================================================
echo   Starting Campus AI Platform (Production Mode)
echo ==============================================================

echo [1/2] Building the integrated application (Frontend + Backend)...
cd backend
call maven\apache-maven-3.9.6\bin\mvn.cmd clean package -DskipTests

echo [2/2] Launching the unified application...
java -jar target\backend-0.0.1-SNAPSHOT.jar

pause
