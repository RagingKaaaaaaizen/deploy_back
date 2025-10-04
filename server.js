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
const autoMigrate = require('./auto-migrate');
const ensureUploadsDirectory = require('./ensure-uploads-dir');

// Function to register routes (used by both server startup and testing)
function registerRoutes() {
    console.log('🔗 Registering API routes...');
    
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

    console.log('✅ API routes registered successfully');
}

// Wait for database initialization before starting server
async function startServer() {
    try {
        // Wait for database to be ready
        await new Promise(resolve => {
            const checkDb = () => {
                const requiredModels = ['sequelize', 'Stock', 'ApprovalRequest', 'Account', 'Item', 'StorageLocation', 'RoomLocation', 'PC'];
                const missingModels = requiredModels.filter(model => !db[model]);
                
                if (missingModels.length === 0) {
                    console.log('✅ Database and all required models are ready');
                    console.log('Available models:', Object.keys(db));
                    resolve();
                } else {
                    console.log('⏳ Waiting for database and models to be ready...');
                    console.log('Missing models:', missingModels);
                    console.log('Available models:', Object.keys(db));
                    setTimeout(checkDb, 100);
                }
            };
            checkDb();
        });

        // Run auto-migration for receiptAttachment column
        await autoMigrate();
        
        // Ensure uploads directory exists
        ensureUploadsDirectory();



        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.use(cookieParser());

// Allow CORS - Configure for production
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'https://computer-lab-inventory-frontend-d487.onrender.com',
            'http://localhost:4200'
        ];
        
        // Add FRONTEND_URL from environment if it exists
        if (process.env.FRONTEND_URL) {
            allowedOrigins.push(process.env.FRONTEND_URL);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
    console.log('Request Origin:', req.headers.origin);
    console.log('Request Method:', req.method);
    console.log('Request URL:', req.url);
    next();
});

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

// Test accounts endpoint without authentication
app.get('/api/accounts-test', async (req, res) => {
    try {
        const accountCount = await db.Account.count();
        res.json({ 
            message: 'Accounts test endpoint', 
            accountCount: accountCount,
            timestamp: new Date(),
            status: 'OK'
        });
    } catch (error) {
        console.error('Accounts test error:', error);
        res.status(500).json({ 
            message: 'Database error', 
            error: error.message,
            timestamp: new Date()
        });
    }
});

// Test room locations endpoint without authentication
app.get('/api/room-locations-test', async (req, res) => {
    try {
        console.log('🔍 Testing room locations endpoint');
        console.log('🔍 db.RoomLocation available:', !!db.RoomLocation);
        
        if (!db.RoomLocation) {
            return res.status(500).json({ 
                message: 'RoomLocation model not available', 
                timestamp: new Date()
            });
        }
        
        const roomCount = await db.RoomLocation.count();
        const rooms = await db.RoomLocation.findAll({
            attributes: ['id', 'name', 'description']
        });
        
        res.json({ 
            message: 'Room locations test endpoint', 
            roomCount: roomCount,
            rooms: rooms,
            timestamp: new Date(),
            status: 'OK'
        });
    } catch (error) {
        console.error('Room locations test error:', error);
        res.status(500).json({ 
            message: 'Database error', 
            error: error.message,
            timestamp: new Date()
        });
    }
});

// Test PC Build Template endpoint without authentication
app.get('/api/pc-build-templates-test', async (req, res) => {
    try {
        console.log('🔍 Testing PC Build Template endpoint');
        console.log('🔍 db.PCBuildTemplate available:', !!db.PCBuildTemplate);
        console.log('🔍 db.PCBuildTemplateComponent available:', !!db.PCBuildTemplateComponent);
        
        if (!db.PCBuildTemplate) {
            return res.status(500).json({ 
                message: 'PCBuildTemplate model not available', 
                timestamp: new Date()
            });
        }
        
        if (!db.PCBuildTemplateComponent) {
            return res.status(500).json({ 
                message: 'PCBuildTemplateComponent model not available', 
                timestamp: new Date()
            });
        }
        
        // Check if tables exist
        const [templateTables] = await db.sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('PCBuildTemplates', 'PCBuildTemplateComponents')
        `);
        
        const templateCount = await db.PCBuildTemplate.count();
        
        res.json({ 
            message: 'PC Build Template test endpoint', 
            templateCount: templateCount,
            tablesExist: templateTables.length,
            tables: templateTables.map(t => t.TABLE_NAME),
            modelsAvailable: {
                PCBuildTemplate: !!db.PCBuildTemplate,
                PCBuildTemplateComponent: !!db.PCBuildTemplateComponent
            },
            timestamp: new Date(),
            status: 'OK'
        });
    } catch (error) {
        console.error('PC Build Template test error:', error);
        res.status(500).json({ 
            message: 'Database error', 
            error: error.message,
            timestamp: new Date()
        });
    }
});

// TEMPORARY: Create PC Build Template tables manually
app.get('/api/create-pc-tables', async (req, res) => {
    try {
        console.log('🔧 Creating PC Build Template tables manually...');
        
        // Create PCBuildTemplates table
        await db.sequelize.query(`
            CREATE TABLE IF NOT EXISTS PCBuildTemplates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                createdBy INT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_name (name),
                INDEX idx_createdBy (createdBy),
                INDEX idx_createdAt (createdAt)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Create PCBuildTemplateComponents table
        await db.sequelize.query(`
            CREATE TABLE IF NOT EXISTS PCBuildTemplateComponents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                templateId INT NOT NULL,
                categoryId INT NOT NULL,
                itemId INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                remarks TEXT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_templateId (templateId),
                INDEX idx_categoryId (categoryId),
                INDEX idx_itemId (itemId),
                UNIQUE KEY unique_template_category (templateId, categoryId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Verify tables were created
        const [tables] = await db.sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('PCBuildTemplates', 'PCBuildTemplateComponents')
        `);
        
        console.log('✅ PC Build Template tables created successfully!');
        
        res.json({ 
            success: true, 
            message: 'PC Build Template tables created successfully',
            tablesCreated: tables.length,
            tables: tables.map(t => t.TABLE_NAME),
            timestamp: new Date()
        });
    } catch (error) {
        console.error('❌ Error creating PC Build Template tables:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating tables',
            error: error.message,
            timestamp: new Date()
        });
    }
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

// Export app for testing
module.exports = app;

// Start the server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
    startServer();
}
