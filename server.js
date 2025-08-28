require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./_middleware/error-handler');

// Initialize database
const db = require('./_helpers/db');

// Wait for database initialization before starting server
async function startServer() {
    try {
        // Wait for database to be ready
        await new Promise(resolve => {
            const checkDb = () => {
                if (db.sequelize) {
                    resolve();
                } else {
                    setTimeout(checkDb, 100);
                }
            };
            checkDb();
        });

        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.use(cookieParser());

// Allow CORS - Configure for production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL || 'https://your-frontend-app.onrender.com'] 
        : (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// API routes
app.use('/api/accounts', require('./accounts/account.controller'));
app.use('/api/employees', require('./employees/employee.controller'));
app.use('/api/departments', require('./departments/department.controller'));
app.use('/api/workflows', require('./workflows/workflow.controller'));
app.use('/api/requests', require('./requests/request.controller'));
app.use('/api/brands', require('./brand/brand.controller'));
app.use('/api/categories', require('./category'));
app.use('/api/items', require('./items'));
app.use('/api/stocks', require('./stock'));
app.use('/api/storage-locations', require('./storage-location'));
app.use('/api/pcs', require('./pc'));
app.use('/api/pc-components', require('./pc/pc-component.routes'));
app.use('/api/room-locations', require('./pc/room-location.routes'));
app.use('/api/specifications', require('./specifications/specification.controller'));
app.use('/api/dispose', require('./dispose'));
app.use('/api/activity-logs', require('./activity-log'));
app.use('/api/analytics', require('./analytics/analytics.routes'));

// Swagger docs
app.use('/api-docs', require('./_helpers/swagger'));

// Health check endpoint for Render
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

// Test disposal endpoint without authentication
app.get('/api/dispose-test', (req, res) => {
    res.json({ 
        message: 'Dispose endpoint is working!', 
        timestamp: new Date(),
        status: 'OK',
        endpoint: '/api/dispose-test'
    });
});

        // Global error handler
        app.use(errorHandler);

        // Start server
        const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
        app.listen(port, () => console.log('Server listening on port ' + port));
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
