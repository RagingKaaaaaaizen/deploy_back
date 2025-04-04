# Node.js + MySQL - Boilerplate API with Email Sign Up, Verification, Authentication & Forgot Password

## Overview

This boilerplate API provides a foundation for building a secure application using Node.js and MySQL. It includes features such as email sign-up, verification, JWT authentication, role-based authorization, and password management.

---

## Features

- **Email Sign Up and Verification**
- **JWT Authentication with Refresh Tokens**
- **Role-Based Authorization (User & Admin)**
- **Forgot Password and Reset Password Functionality**
- **Account Management (CRUD) Routes with Role-Based Access Control**
- **Swagger API Documentation Route**

---

## Project Structure

```
/project-root
│
├── /_helpers
│   ├── db.js
│   ├── role.js
│   ├── send-email.js
│   └── swagger.js
│
├── /_middleware
│   ├── authorize.js
│   ├── error-handler.js
│   └── validate-request.js
│
├── /accounts
│   ├── account.model.js
│   ├── refresh-token.model.js
│   ├── account.service.js
│   └── accounts.controller.js
│
├── config.json
├── package.json
└── server.js
```

---

## Installation

1. **Install Node.js and NPM**  
   Download from [Node.js](https://nodejs.org/en/download/).

2. **Install MySQL Community Server**  
   Download from [MySQL](https://dev.mysql.com/downloads/mysql/).

3. **Install Required Packages**  
   Run the following command in the project root folder:
   ```bash
   npm install
   ```

4. **Configure SMTP Settings**  
   Update the `smtpOptions` in `config.json` for email functionality. You can create a free test account at [Ethereal](https://ethereal.email/).

---

## Start the API

Run the following command:

For production mode:
```bash
npm start
```

For development mode:
```bash
npm run start:dev
```

---

## API Endpoints

### Register a New Account
- **Endpoint:** `POST /accounts/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```

### Verify Email
- **Endpoint:** `POST /accounts/verify-email`
- **Body:**
  ```json
  {
    "token": "verification_token"
  }
  ```

### Forgot Password
- **Endpoint:** `POST /accounts/forgot-password`
- **Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

### Reset Password
- **Endpoint:** `POST /accounts/reset-password`
- **Body:**
  ```json
  {
    "token": "reset_token",
    "password": "newpassword",
    "confirmPassword": "newpassword"
  }
  ```

### Authenticate
- **Endpoint:** `POST /accounts/authenticate`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```

### Get All Accounts (Admin Only)
- **Endpoint:** `GET /accounts`
- **Authorization:** Bearer Token

### Update Account
- **Endpoint:** `PUT /accounts/{id}`
- **Authorization:** Bearer Token
- **Body:**
  ```json
  {
    "firstName": "NewFirstName",
    "lastName": "NewLastName"
  }
  ```

### Refresh Token
- **Endpoint:** `POST /accounts/refresh-token`

---

## Node Packages

### Required Packages
```bash
npm install bcryptjs body-parser cookie-parser cors dotenv express express-jwt helmet http-status-codes joi jsonwebtoken mysql2 nodemailer nodemailer-express-handlebars nodemon rootpath sequelize sqlite3 swagger-ui-express uuid yamljs
```

### Development Packages
```bash
npm install --save-dev @types/bcryptjs @types/cors @types/dotenv @types/express @types/helmet @types/http-status-codes @types/uuid ts-node-dev typescript
```

---

## Team Assignments

### Backend Developer (API)
- **@ Niel Ivan M. Eroy**

### Frontend Developer (Angular)
- **@Rey Nino Perez**

### Tester (API and Frontend Testing)
- **@Sean Ivan Ostra**

### Documentation Specialist (README.md)
- **Jurace L. Lomutos**

### DevOps Lead (Repository Setup, Branch Management, CI/CD Pipeline if Applicable)
- **@Andrew Czar S. Mata**

---

# Collaborative Development of a Full-Stack Application
## Hotel Management System

