@echo off
echo Building and Starting the Monolithic Application...
cd backend

echo Running Maven to build frontend and start backend...
call maven\apache-maven-3.9.6\bin\mvn.cmd clean compile spring-boot:run

cd ..
pause
