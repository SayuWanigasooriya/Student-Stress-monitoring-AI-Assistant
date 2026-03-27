# User Management Backend

Spring Boot REST API for User Management System

## Prerequisites
- Java 17 or higher
- Maven 3.6+

## Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Build the project:
```bash
mvn clean install
```

3. Run the application:
```bash
mvn spring-boot:run
```

The server will start at `http://localhost:8080`

## API Endpoints

- POST `/api/users/signup` - Register new user
- POST `/api/users/login` - User login
- GET `/api/users/{id}` - Get user by ID
- PUT `/api/users/{id}` - Update user
- DELETE `/api/users/{id}` - Delete user

## Database

H2 in-memory database
- Console: http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:mem:userdb
- Username: sa
- Password: (empty)
