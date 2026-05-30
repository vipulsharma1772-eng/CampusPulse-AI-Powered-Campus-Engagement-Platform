# ==========================================
# Stage 1: Build Frontend and Backend
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy the entire workspace into the builder container
COPY . .

# Run maven package in the backend folder
# This will trigger the frontend maven plugin to download Node/NPM, 
# build the Vite/React application, and bundle the static resources 
# directly inside the final Spring Boot JAR file.
RUN cd backend && mvn clean package -DskipTests

# ==========================================
# Stage 2: Minimal Production JRE Runtime
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy only the compiled monolithic JAR file from the builder stage
# (Matches the Spring Boot version from pom.xml)
COPY --from=build /app/backend/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Expose default web service port
EXPOSE 8080

# Set default port environment variable (Render overrides this automatically)
ENV PORT=8080

# 1. Ensure the persistent disk folder structure exists (at /app/data/uploads)
# 2. Symlink the application's uploads directory to the persistent disk folder
# 3. Launch the Spring Boot application on the dynamic port assigned by Render
ENTRYPOINT ["sh", "-c", "mkdir -p /app/data/uploads && ln -sfn /app/data/uploads /app/uploads && java -Dserver.port=${PORT} -jar app.jar"]
