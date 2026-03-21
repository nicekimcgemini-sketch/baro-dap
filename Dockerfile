# Stage 1: Maven 빌드
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN cd backend-java && mvn package -DskipTests

# Stage 2: 실행
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/backend-java/target/baro-dap-1.0.0.jar app.jar
COPY --from=build /app/frontend ./frontend/
CMD ["java", "-jar", "app.jar"]
