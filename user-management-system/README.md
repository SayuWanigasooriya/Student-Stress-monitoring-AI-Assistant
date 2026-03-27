# User Management System

A React-based User Management System for AI-Powered Stress Monitoring and Wellbeing Support System.

## Project Structure

```text
Ai_Ml project/
├── backend/   Spring Boot API
└── frontend/  React app
```

## Features

- **Login Page**: User authentication
- **Signup Page**: New user registration
- **User Profile**: View and manage user profile with CRUD operations
  - Create: Register new users
  - Read: View profile details
  - Update: Edit profile information
  - Delete: Remove user account

## Installation

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Start the frontend development server:
```bash
npm start
```

3. Start the backend:
```bash
cd backend
./mvnw spring-boot:run
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Start by creating an account on the Signup page
2. Login with your credentials
3. View and manage your profile
4. Edit profile information or delete your account

## Technologies

- React 18
- React Router DOM
- Spring Boot
- LocalStorage for data persistence
