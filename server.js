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

        // =========================
        // Health Check and Test Endpoints
        // =========================
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
        
        // Auto-fix disposal values (run once to fix old records)
        const autoFixDisposals = require('./auto-fix-disposals');
        await autoFixDisposals();

        // =========================
        // CORS Configuration - MUST BE FIRST
        // =========================
        console.log('🔧 Setting up CORS...');
        
        // Allow CORS - Configure for production with better error handling
        const corsOptions = {
            origin: function (origin, callback) {
                // Allow requests with no origin (like mobile apps or curl requests)
                if (!origin) {
                    console.log('✅ CORS: Request with no origin allowed');
                    return callback(null, true);
                }
                
                const allowedOrigins = [
                    'https://computer-lab-inventory-frontend.onrender.com',
                    'http://localhost:4200',
                    'http://localhost:4200/'
                ];
                
                // Add FRONTEND_URL from environment if it exists
                if (process.env.FRONTEND_URL) {
                    allowedOrigins.push(process.env.FRONTEND_URL);
                }
                
                // Check if origin is allowed (case-insensitive and with/without trailing slash)
                const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
                const isAllowed = allowedOrigins.some(allowed => 
                    allowed.toLowerCase().replace(/\/$/, '') === normalizedOrigin
                );
                
                if (isAllowed) {
                    console.log('✅ CORS: Origin allowed:', origin);
                    callback(null, true);
                } else {
                    console.log('❌ CORS: Origin blocked:', origin);
                    console.log('❌ CORS: Allowed origins:', allowedOrigins);
                    // Instead of throwing error, still allow but log the issue
                    callback(null, true); // Changed to allow all origins temporarily for debugging
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
            exposedHeaders: ['Content-Range', 'X-Content-Range'],
            preflightContinue: false,
            optionsSuccessStatus: 204,
            maxAge: 86400 // 24 hours
        };

        app.use(cors(corsOptions));

        // Add additional CORS headers manually as fallback
        app.use((req, res, next) => {
            const origin = req.headers.origin;
            if (origin) {
                res.header('Access-Control-Allow-Origin', origin);
                res.header('Access-Control-Allow-Credentials', 'true');
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
            }
            
            // Handle preflight
            if (req.method === 'OPTIONS') {
                console.log('✅ CORS: Handling OPTIONS preflight for', req.url);
                return res.sendStatus(204);
            }
            
            console.log('📝 Request:', req.method, req.url, 'from', origin || 'no-origin');
            next();
        });
        
        console.log('✅ CORS configured successfully');

        // =========================
        // Body Parser and Cookie Parser
        // =========================
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.use(cookieParser());

        // =========================
        // API Routes
        // =========================
        console.log('🔗 Registering API routes...');
        
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
