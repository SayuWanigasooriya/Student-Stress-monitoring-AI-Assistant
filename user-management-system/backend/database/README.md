# MySQL Database Setup

## Prerequisites
- MySQL Server 8.0+ installed
- MySQL running on localhost:3306

## Setup

### Option 1: Automatic (Recommended)
The application will auto-create the database when you run it.

### Option 2: Manual
Run in MySQL:
```bash
mysql -u root -p < database/schema.sql
```

## Configuration
Update `application.properties` with your MySQL credentials:
```properties
spring.datasource.username=root
spring.datasource.password=your_password
```

## Database Details
- Database: user_management_db
- Table: users
- Port: 3306
