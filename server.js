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
                if (db.sequelize && db.RoomLocation && db.PC) {
                    console.log('✅ Database and models are ready');
                    resolve();
                } else {
                    console.log('⏳ Waiting for database and models to be ready...');
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
        ? [process.env.FRONTEND_URL || 'https://computer-lab-inventory-frontend-wnxh.onrender.com'] 
        : (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Additional CORS headers for better compatibility
app.use((req, res, next) => {
    const allowedOrigin = process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL || 'https://computer-lab-inventory-frontend-wnxh.onrender.com'
        : '*';
    
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
    } else {
        next();
    }
});

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

// Test PC creation endpoint without authentication
app.post('/api/pcs-test', async (req, res) => {
    try {
        console.log('🔍 Testing PC creation endpoint');
        console.log('🔍 Request body:', req.body);
        
        if (!db.PC) {
            return res.status(500).json({ 
                message: 'PC model not available', 
                timestamp: new Date()
            });
        }
        
        // Check if room location exists
        const roomLocation = await db.RoomLocation.findByPk(req.body.roomLocationId);
        console.log('🔍 Room location found:', roomLocation);
        
        if (!roomLocation) {
            return res.status(400).json({ 
                message: 'Room location not found', 
                roomLocationId: req.body.roomLocationId,
                timestamp: new Date()
            });
        }
        
        res.json({ 
            message: 'PC creation test successful', 
            roomLocation: roomLocation,
            timestamp: new Date(),
            status: 'OK'
        });
    } catch (error) {
        console.error('PC creation test error:', error);
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

// Start the server
startServer();
