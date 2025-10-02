require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./_middleware/error-handler');

// Initialize database
const db = require('./_helpers/db');

// Set environment variables for test database connection
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'root';
process.env.DB_NAME = 'amp';
process.env.DB_HOST = 'localhost';
process.env.NODE_ENV = 'test';

async function setupTestServer() {
    try {
        console.log('🧪 Setting up test server...');
        
        // Wait for database to be ready
        await new Promise(resolve => {
            const checkDb = () => {
                const requiredModels = ['sequelize', 'Stock', 'ApprovalRequest', 'Account', 'Item', 'StorageLocation', 'RoomLocation', 'PC'];
                const missingModels = requiredModels.filter(model => !db[model]);
                
                if (missingModels.length === 0) {
                    console.log('✅ Database and all required models are ready');
                    resolve();
                } else {
                    console.log('⏳ Waiting for database and models to be ready...');
                    setTimeout(checkDb, 100);
                }
            };
            checkDb();
        });

        // Middleware
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.use(cookieParser());

        // CORS configuration
        const corsOptions = {
            origin: 'http://localhost:4200',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            optionsSuccessStatus: 204
        };
        app.use(cors(corsOptions));

        // API routes
        app.use('/api/accounts', require('./accounts/account.controller'));
        app.use('/api/brands', require('./brand/brand.controller'));
        app.use('/api/categories', require('./category'));
        app.use('/api/items', require('./items'));
        app.use('/api/stocks', require('./stock'));
        app.use('/api/storage-locations', require('./storage-location'));
        app.use('/api/pcs', require('./pc'));
        app.use('/api/pc-components', require('./pc/pc-component.routes'));
        app.use('/api/room-locations', require('./pc/room-location.routes'));
        app.use('/api/pc-build-templates', require('./pc/pc-build-template.routes'));
        app.use('/api/specifications', require('./specifications/specification.controller'));
        app.use('/api/dispose', require('./dispose'));
        app.use('/api/activity-logs', require('./activity-log'));
        app.use('/api/analytics', require('./analytics/analytics.routes'));
        app.use('/api/approval-requests', require('./approval-requests'));

        // Comparison Feature Routes
        app.use('/api', require('./comparison'));

        // Swagger docs
        app.use('/api-docs', require('./_helpers/swagger'));

        // Serve static files from uploads directory
        app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({ 
                status: 'OK',
                timestamp: new Date(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development'
            });
        });

        // Test endpoint without authentication
        app.get('/api/test', (req, res) => {
            res.json({ 
                message: 'Server is working!', 
                timestamp: new Date(),
                status: 'OK'
            });
        });

        // Test accounts endpoint without authentication
        app.get('/api/accounts-test', async (req, res) => {
            try {
                const accountCount = await db.Account.count();
                res.json({ 
                    message: 'Accounts endpoint is working!', 
                    timestamp: new Date(),
                    status: 'OK',
                    endpoint: '/api/accounts-test',
                    accountCount: accountCount
                });
            } catch (error) {
                res.status(500).json({ 
                    message: 'Accounts endpoint error', 
                    error: error.message,
                    endpoint: '/api/accounts-test'
                });
            }
        });

        // Error handling
        app.use(errorHandler);

        console.log('✅ Test server setup complete');
        return app;
    } catch (error) {
        console.error('❌ Failed to setup test server:', error);
        throw error;
    }
}

// Export the setup function and app
module.exports = { setupTestServer, app };
