# PC Parts Comparison System - Full-Stack Inventory Management with AI Integration

## Overview

This is a comprehensive PC Parts Comparison System built with Node.js, MySQL, and Angular. It features an intelligent inventory management system with AI-powered comparison capabilities, user authentication, and advanced analytics.

---

## 🚀 Features

### **Core System Features**
- **Email Sign Up and Verification**
- **JWT Authentication with Refresh Tokens**
- **Role-Based Authorization (User & Admin)**
- **Forgot Password and Reset Password Functionality**
- **Account Management (CRUD) Routes with Role-Based Access Control**
- **Swagger API Documentation Route**

### **PC Parts Comparison Features**
- **AI-Powered Part Comparisons** (Gemini, OpenAI, Local LLM support)
- **Intelligent Specification Analysis**
- **Online Parts Search Integration**
- **Comparison History Tracking**
- **Upgrade Recommendations**
- **API Caching for Performance**
- **Multi-Provider AI Support**

### **Inventory Management**
- **Item Management** (CRUD operations)
- **Stock Tracking** with real-time updates
- **Storage Location Management**
- **PC Component Management**
- **Room Location Tracking**
- **Disposal Management**
- **Approval Request System**
- **Activity Logging**

### **Analytics & Reporting**
- **Comparison Statistics**
- **Usage Analytics**
- **Performance Metrics**
- **AI Service Health Monitoring**

---

## 📁 Project Structure

```
/project-root
│
├── /_helpers                    # Core helper modules
│   ├── db.js                    # Database connection & models
│   ├── role.js                  # Role-based authorization
│   ├── send-email.js           # Email service
│   └── swagger.js               # API documentation
│
├── /_middleware                 # Express middleware
│   ├── authorize.js             # JWT authorization
│   ├── error-handler.js         # Global error handling
│   ├── upload.js                # File upload handling
│   └── validate-request.js      # Request validation
│
├── /accounts                    # User authentication
│   ├── account.controller.js    # Account endpoints
│   ├── account.model.js         # User model
│   ├── account.service.js       # Business logic
│   └── refresh-token.model.js    # Token management
│
├── /comparison                  # AI-Powered Comparison System
│   ├── /ai                      # AI service providers
│   │   ├── ai-manager.service.js    # AI service manager
│   │   ├── gemini.service.js         # Google Gemini integration
│   │   ├── openai.service.js         # OpenAI integration
│   │   └── local-llm.service.js     # Local LLM integration
│   ├── /api-integration         # External API integrations
│   │   ├── pcpartpicker.service.js   # PCPartPicker API
│   │   ├── amazon.service.js          # Amazon API
│   │   ├── newegg.service.js         # Newegg API
│   │   └── api-manager.service.js    # API management
│   ├── comparison.controller.js     # Comparison endpoints
│   ├── comparison.routes.js           # Route definitions
│   ├── comparison.service.js         # Business logic
│   ├── comparison-history.model.js    # History tracking
│   ├── api-cache.model.js           # API response caching
│   └── part-specification.model.js  # Part specifications
│
├── /items                       # Item management
│   ├── item.controller.js       # Item endpoints
│   ├── item.model.js           # Item model
│   └── item.service.js         # Business logic
│
├── /stock                       # Stock management
│   ├── stock.controller.js      # Stock endpoints
│   ├── stock.model.js          # Stock model
│   └── stock.service.js        # Business logic
│
├── /storage-location           # Storage management
│   ├── storage-location.controller.js
│   ├── storage-location.model.js
│   └── storage-location.service.js
│
├── /pc                         # PC management
│   ├── pc.model.js             # PC model
│   ├── pc.service.js          # PC business logic
│   ├── pc-component.controller.js    # Component endpoints
│   ├── pc-component.model.js         # Component model
│   ├── pc-component.routes.js        # Component routes
│   ├── pc-component.service.js      # Component logic
│   ├── room-location.controller.js  # Room endpoints
│   ├── room-location.model.js       # Room model
│   ├── room-location.routes.js      # Room routes
│   └── room-location.service.js    # Room logic
│
├── /specifications             # Specification management
│   ├── specification.controller.js
│   ├── specification.model.js
│   └── specification.service.js
│
├── /dispose                    # Disposal management
│   ├── dispose.controller.js
│   ├── dispose.model.js
│   └── dispose.service.js
│
├── /approval-requests          # Approval system
│   ├── approval-request.controller.js
│   ├── approval-request.model.js
│   └── approval-request.service.js
│
├── /activity-log              # Activity tracking
│   ├── activity-log.controller.js
│   ├── activity-log.model.js
│   ├── activity-log.routes.js
│   └── activity-log.service.js
│
├── /analytics                 # Analytics & reporting
│   ├── analytics.controller.js
│   ├── analytics.routes.js
│   └── analytics.service.js
│
├── /brand                     # Brand management
│   ├── brand.controller.js
│   ├── brand.model.js
│   └── brand.service.js
│
├── /category                  # Category management
│   ├── category.controller.js
│   ├── category.model.js
│   └── category.service.js
│
├── /inventory-test            # Testing modules
│   ├── item-category.controller.js
│   ├── item-category.service.js
│   ├── item.category.model.js
│   ├── item.controller.js
│   ├── item.model.js
│   └── item.service.js
│
├── /uploads                   # File storage
│   └── /receipts             # Receipt storage
│
├── auto-migrate.js            # Database migration system
├── config.json                # Configuration
├── execute-schema.js          # Database setup
├── ensure-uploads-dir.js      # Directory setup
├── jwt-config.js             # JWT configuration
├── package.json              # Dependencies
├── server.js                 # Main server file
├── setup_database.sql        # Database schema
├── sample_data.sql           # Sample data
├── comparison-migration.sql  # Comparison feature migration
├── swagger.yaml              # API documentation
├── render.yaml               # Deployment configuration
├── setup-gemini.ps1         # Gemini AI setup (Windows)
├── setup-gemini.bat         # Gemini AI setup (Windows CMD)
├── AI_CONFIGURATION_GUIDE.md # AI setup documentation
└── POSTMAN_TESTING_GUIDE.md  # API testing guide
```

---

## 🛠️ Installation

### **Prerequisites**
1. **Node.js and NPM** - Download from [Node.js](https://nodejs.org/en/download/)
2. **MySQL Community Server** - Download from [MySQL](https://dev.mysql.com/downloads/mysql/)
3. **Git** - For version control

### **Setup Steps**

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd deploy_back
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Run the database setup script
   node execute-schema.js
   ```

4. **Configure Environment Variables**
   ```bash
   # Copy and edit configuration
   cp config.json config.local.json
   # Update database credentials and SMTP settings
   ```

5. **AI Configuration (Optional)**
   ```bash
   # For Gemini AI (Recommended - FREE!)
   ./setup-gemini.ps1
   
   # OR manually set environment variables
   $env:GEMINI_API_KEY="your_gemini_api_key"
   ```

---

## 🚀 Running the Application

### **Development Mode (Recommended)**
```bash
# With AI setup (includes Gemini API key)
./setup-gemini.ps1

# OR standard development
npm run start:dev
```

### **Production Mode**
```bash
npm start
```

### **Direct Node Execution**
```bash
node server.js
```

---

## 🤖 AI Configuration

The system supports multiple AI providers for intelligent part comparisons:

### **1. Google Gemini (FREE - Recommended)**
```bash
# Quick setup
./setup-gemini.ps1

# OR manual setup
$env:GEMINI_API_KEY="your_gemini_api_key"
```

### **2. OpenAI (Premium)**
```bash
$env:OPENAI_API_KEY="sk-your-openai-key"
```

### **3. Local LLM (Free Alternative)**
```bash
# Install Ollama first
# Then set environment
$env:OLLAMA_URL="http://localhost:11434"
```

For detailed AI setup instructions, see [AI_CONFIGURATION_GUIDE.md](./AI_CONFIGURATION_GUIDE.md)

---

## 📡 API Endpoints

### **🔐 Authentication Endpoints**
- `POST /api/accounts/register` - Register new account
- `POST /api/accounts/verify-email` - Verify email address
- `POST /api/accounts/authenticate` - Login
- `POST /api/accounts/forgot-password` - Request password reset
- `POST /api/accounts/reset-password` - Reset password
- `POST /api/accounts/refresh-token` - Refresh JWT token
- `GET /api/accounts` - Get all accounts (Admin only)
- `PUT /api/accounts/{id}` - Update account

### **🤖 AI-Powered Comparison Endpoints**
- `POST /api/comparison/compare-parts` - Compare two parts with AI
- `GET /api/comparison/history` - Get comparison history
- `GET /api/comparison/specifications/{id}` - Get part specifications
- `POST /api/comparison/search-online` - Search online parts
- `GET /api/comparison/suggestions` - Get comparison suggestions
- `POST /api/comparison/explain-specifications/{id}` - AI explanation
- `POST /api/comparison/upgrade-recommendation` - Get upgrade recommendations
- `GET /api/comparison/stats` - Get comparison statistics
- `GET /api/comparison/ai-stats` - Get AI service health

### **📦 Inventory Management Endpoints**
- `GET /api/items` - Get all items
- `POST /api/items` - Create new item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item
- `GET /api/stocks` - Get stock information
- `POST /api/stocks` - Add stock
- `PUT /api/stocks/{id}` - Update stock

### **🏢 Storage & Location Endpoints**
- `GET /api/storage-locations` - Get storage locations
- `POST /api/storage-locations` - Create storage location
- `GET /api/room-locations` - Get room locations
- `POST /api/room-locations` - Create room location

### **💻 PC Management Endpoints**
- `GET /api/pcs` - Get all PCs
- `POST /api/pcs` - Create new PC
- `GET /api/pc-components` - Get PC components
- `POST /api/pc-components` - Add component to PC

### **📊 Analytics & Reporting Endpoints**
- `GET /api/analytics/overview` - Get system overview
- `GET /api/analytics/usage` - Get usage statistics
- `GET /api/activity-logs` - Get activity logs

### **🔧 System Endpoints**
- `GET /health` - Health check
- `GET /api/test` - Test endpoint
- `GET /api-docs` - API documentation (Swagger)

---

## 🧪 Testing

### **API Testing**
For comprehensive API testing, see [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md)

### **Quick Test Commands**
```bash
# Health check
curl http://localhost:4000/health

# Test endpoint
curl http://localhost:4000/api/test

# API documentation
# Visit: http://localhost:4000/api-docs
```

---

## 📦 Dependencies

### **Core Dependencies**
```bash
npm install bcryptjs body-parser cookie-parser cors dotenv express express-jwt helmet http-status-codes joi jsonwebtoken mysql2 nodemailer nodemailer-express-handlebars nodemon rootpath sequelize sqlite3 swagger-ui-express uuid yamljs
```

### **AI & Comparison Dependencies**
```bash
npm install axios google-generative-ai openai ollama
```

### **Development Dependencies**
```bash
npm install --save-dev @types/bcryptjs @types/cors @types/dotenv @types/express @types/helmet @types/http-status-codes @types/uuid ts-node-dev typescript
```

---

## 🚀 Deployment

### **Environment Variables for Production**
```bash
# Database
DB_HOST=your_production_host
DB_USER=your_production_user
DB_PASSWORD=your_production_password
DB_NAME=your_production_database

# AI Services
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Application
NODE_ENV=production
PORT=4000
```

### **Production Commands**
```bash
# Start production server
npm start

# OR with PM2
pm2 start server.js --name "pc-parts-comparison"
```

---

## 📚 Documentation

- **[AI Configuration Guide](./AI_CONFIGURATION_GUIDE.md)** - Complete AI setup instructions
- **[Postman Testing Guide](./POSTMAN_TESTING_GUIDE.md)** - Comprehensive API testing
- **[API Documentation](http://localhost:4000/api-docs)** - Interactive Swagger docs

---

## 👥 Development Team

### **Backend Developer (API)**
- **@ Niel Ivan M. Eroy**

### **Frontend Developer (Angular)**
- **@Rey Nino Perez**

### **Tester (API and Frontend Testing)**
- **@Sean Ivan Ostra**

### **Documentation Specialist (README.md)**
- **Jurace L. Lomutos**

### **DevOps Lead (Repository Setup, Branch Management, CI/CD Pipeline if Applicable)**
- **@Andrew Czar S. Mata**

---

## 🎯 Project Status

✅ **Completed Features:**
- User authentication and authorization
- AI-powered part comparison system
- Inventory management
- Stock tracking
- PC component management
- Analytics and reporting
- API documentation
- Database migrations

🚧 **In Development:**
- Frontend Angular application
- Advanced AI features
- Performance optimizations

---

# PC Parts Comparison System
## Intelligent Inventory Management with AI Integration

