const db = require('../_helpers/db');
const approvalRequestService = require('./approval-request.service');
const stockService = require('../stock/stock.service');
const disposeService = require('../dispose/dispose.service');

// Deep database and Sequelize test endpoint
exports.testDatabaseDeep = async (req, res) => {
    try {
        console.log('=== DEEP DATABASE AND SEQUELIZE TEST ===');
        
        // Test 1: Basic database connection
        console.log('Test 1: Basic database connection...');
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test 2: Check Sequelize sync status
        console.log('Test 2: Checking Sequelize sync status...');
        try {
            // Force a basic sync check
            await db.sequelize.sync({ alter: false, force: false });
            console.log('✅ Sequelize sync check passed');
        } catch (syncError) {
            console.error('❌ Sequelize sync error:', syncError);
            return res.status(500).json({
                message: 'Sequelize sync failed',
                error: syncError.message,
                stack: syncError.stack
            });
        }
        
        // Test 3: Check if Stock table exists and structure
        console.log('Test 3: Checking Stock table structure...');
        try {
            const [stockTableInfo] = await db.sequelize.query("DESCRIBE stocks");
            console.log('✅ Stock table structure:', stockTableInfo);
            
            const [approvalTableInfo] = await db.sequelize.query("DESCRIBE approval_requests");
            console.log('✅ Approval requests table structure:', approvalTableInfo);
        } catch (describeError) {
            console.error('❌ Error describing tables:', describeError);
            return res.status(500).json({
                message: 'Failed to describe database tables',
                error: describeError.message
            });
        }
        
        // Test 4: Test raw SQL insert into stocks table
        console.log('Test 4: Testing raw SQL insert into stocks table...');
        try {
            const testInsertSQL = `
                INSERT INTO stocks (itemId, locationId, quantity, price, totalPrice, remarks, receiptAttachment, disposeId, createdBy, createdAt)
                VALUES (1, 1, 1, 10.00, 10.00, 'Test raw SQL insert', NULL, NULL, 1, NOW())
            `;
            
            const [insertResult] = await db.sequelize.query(testInsertSQL);
            console.log('✅ Raw SQL insert successful:', insertResult);
            
            // Clean up the test insert
            const deleteSQL = `DELETE FROM stocks WHERE remarks = 'Test raw SQL insert'`;
            await db.sequelize.query(deleteSQL);
            console.log('✅ Test insert cleaned up');
        } catch (rawSQLError) {
            console.error('❌ Raw SQL insert failed:', rawSQLError);
            console.error('SQL Error details:', {
                message: rawSQLError.message,
                sql: rawSQLError.sql,
                parameters: rawSQLError.parameters
            });
        }
        
        // Test 5: Test Sequelize model create with minimal data
        console.log('Test 5: Testing Sequelize Stock.create with minimal data...');
        try {
            const minimalStockData = {
                itemId: 1,
                locationId: 1,
                quantity: 1,
                price: 10.00,
                totalPrice: 10.00,
                createdBy: 1
            };
            
            console.log('Creating with minimal data:', minimalStockData);
            const testStock = await db.Stock.create(minimalStockData);
            console.log('✅ Sequelize Stock.create successful:', testStock.id);
            
            // Clean up
            await testStock.destroy();
            console.log('✅ Test stock cleaned up');
        } catch (sequelizeCreateError) {
            console.error('❌ Sequelize Stock.create failed:', sequelizeCreateError);
            console.error('Sequelize Error details:', {
                message: sequelizeCreateError.message,
                name: sequelizeCreateError.name,
                sql: sequelizeCreateError.sql,
                parameters: sequelizeCreateError.parameters,
                original: sequelizeCreateError.original
            });
        }
        
        // Test 6: Check foreign key constraints
        console.log('Test 6: Checking foreign key constraints...');
        try {
            // Check if referenced items exist
            const itemCount = await db.Item.count();
            const locationCount = await db.StorageLocation.count();
            const accountCount = await db.Account.count();
            
            console.log('Foreign key reference counts:', {
                items: itemCount,
                locations: locationCount,
                accounts: accountCount
            });
            
            if (itemCount === 0) {
                console.warn('⚠️ No items found - this might cause foreign key errors');
            }
            if (locationCount === 0) {
                console.warn('⚠️ No storage locations found - this might cause foreign key errors');
            }
            if (accountCount === 0) {
                console.warn('⚠️ No accounts found - this might cause foreign key errors');
            }
        } catch (fkError) {
            console.error('❌ Foreign key check failed:', fkError);
        }
        
        // Test 7: Test approval to stock flow with actual pending request
        console.log('Test 7: Testing approval to stock flow...');
        const pendingRequest = await db.ApprovalRequest.findOne({
            where: { 
                status: 'pending',
                type: 'stock'
            }
        });
        
        let approvalFlowTest = null;
        if (pendingRequest) {
            console.log('Found pending request for testing:', pendingRequest.id);
            
            try {
                const requestData = pendingRequest.requestData;
                const stockData = {
                    itemId: parseInt(requestData.itemId),
                    locationId: parseInt(requestData.locationId),
                    quantity: parseInt(requestData.quantity),
                    price: parseFloat(requestData.price),
                    totalPrice: parseInt(requestData.quantity) * parseFloat(requestData.price),
                    remarks: requestData.remarks || '',
                    receiptAttachment: requestData.receiptAttachment || null,
                    disposeId: requestData.disposeId ? parseInt(requestData.disposeId) : null,
                    createdBy: pendingRequest.createdBy
                };
                
                console.log('Testing with stock data:', stockData);
                
                // Try to create the stock (for testing only, not actually saving)
                const testStock = await db.Stock.build(stockData);
                await testStock.validate();
                console.log('✅ Stock data validation passed');
                
                approvalFlowTest = {
                    valid: true,
                    message: 'Approval flow data is valid'
                };
            } catch (flowError) {
                console.error('❌ Approval flow test failed:', flowError);
                approvalFlowTest = {
                    valid: false,
                    error: flowError.message
                };
            }
        } else {
            approvalFlowTest = {
                valid: false,
                message: 'No pending stock requests found for testing'
            };
        }
        
        res.json({
            message: 'Deep database test completed!',
            tests: {
                databaseConnection: 'passed',
                sequelizeSync: 'passed',
                tableStructures: 'checked',
                rawSQLInsert: 'tested',
                sequelizeCreate: 'tested',
                foreignKeyChecks: 'completed',
                approvalFlowTest: approvalFlowTest
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Deep database test failed:', error);
        res.status(500).json({
            message: 'Deep database test failed',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

// Comprehensive backend test endpoint
exports.testBackend = async (req, res) => {
    try {
        console.log('=== COMPREHENSIVE BACKEND TEST ===');
        
        // Test 1: Database connection
        console.log('Test 1: Database connection...');
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test 2: Check all models
        console.log('Test 2: Checking models...');
        const models = Object.keys(db);
        console.log('Available models:', models);
        
        const requiredModels = ['Stock', 'ApprovalRequest', 'Account', 'Item', 'StorageLocation'];
        const missingModels = requiredModels.filter(model => !db[model]);
        
        if (missingModels.length > 0) {
            return res.status(500).json({
                message: 'Missing required models',
                missingModels: missingModels,
                availableModels: models
            });
        }
        console.log('✅ All required models available');
        
        // Test 3: Check model methods
        console.log('Test 3: Checking model methods...');
        const stockMethods = Object.getOwnPropertyNames(db.Stock);
        const approvalMethods = Object.getOwnPropertyNames(db.ApprovalRequest);
        
        console.log('Stock model methods:', stockMethods);
        console.log('ApprovalRequest model methods:', approvalMethods);
        
        if (!stockMethods.includes('create') || !approvalMethods.includes('create')) {
            return res.status(500).json({
                message: 'Missing required model methods',
                stockMethods: stockMethods,
                approvalMethods: approvalMethods
            });
        }
        console.log('✅ All required model methods available');
        
        // Test 4: Check database tables
        console.log('Test 4: Checking database tables...');
        const [results] = await db.sequelize.query("SHOW TABLES");
        const tableNames = results.map(row => Object.values(row)[0]);
        console.log('Database tables:', tableNames);
        
        const requiredTables = ['stocks', 'approval_requests', 'accounts', 'items', 'storage_locations'];
        const missingTables = requiredTables.filter(table => !tableNames.includes(table));
        
        if (missingTables.length > 0) {
            return res.status(500).json({
                message: 'Missing required database tables',
                missingTables: missingTables,
                availableTables: tableNames
            });
        }
        console.log('✅ All required tables exist');
        
        // Test 5: Check sample data
        console.log('Test 5: Checking sample data...');
        const stockCount = await db.Stock.count();
        const approvalCount = await db.ApprovalRequest.count();
        const accountCount = await db.Account.count();
        const itemCount = await db.Item.count();
        const locationCount = await db.StorageLocation.count();
        
        console.log('Data counts:', {
            stocks: stockCount,
            approvals: approvalCount,
            accounts: accountCount,
            items: itemCount,
            locations: locationCount
        });
        
        // Test 6: Check pending approvals
        const pendingApprovals = await db.ApprovalRequest.findAll({
            where: { status: 'pending' },
            limit: 5
        });
        
        console.log('Pending approvals:', pendingApprovals.length);
        if (pendingApprovals.length > 0) {
            console.log('Sample pending approval:', {
                id: pendingApprovals[0].id,
                type: pendingApprovals[0].type,
                status: pendingApprovals[0].status,
                requestData: pendingApprovals[0].requestData
            });
        }
        
        res.json({
            message: 'Backend test successful!',
            database: 'connected',
            models: models,
            requiredModels: requiredModels,
            stockMethods: stockMethods,
            approvalMethods: approvalMethods,
            tables: tableNames,
            requiredTables: requiredTables,
            dataCounts: {
                stocks: stockCount,
                approvals: approvalCount,
                accounts: accountCount,
                items: itemCount,
                locations: locationCount
            },
            pendingApprovals: pendingApprovals.length,
            sampleApproval: pendingApprovals.length > 0 ? {
                id: pendingApprovals[0].id,
                type: pendingApprovals[0].type,
                status: pendingApprovals[0].status,
                requestData: pendingApprovals[0].requestData
            } : null,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Backend test failed:', error);
        res.status(500).json({
            message: 'Backend test failed',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

// Simple test endpoint without authentication
exports.test = async (req, res) => {
    try {
        console.log('Test endpoint called');
        
        // Test database connection
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test models
        const models = Object.keys(db);
        console.log('Available models:', models);
        
        // Test Stock model
        const stockModelAvailable = !!db.Stock;
        console.log('Stock model available:', stockModelAvailable);
        
        // Test ApprovalRequest model
        const approvalModelAvailable = !!db.ApprovalRequest;
        console.log('ApprovalRequest model available:', approvalModelAvailable);
        
        // Test if we can query approval requests
        let pendingCount = 0;
        if (approvalModelAvailable) {
            try {
                const pendingRequests = await db.ApprovalRequest.findAll({
                    where: { status: 'pending' }
                });
                pendingCount = pendingRequests.length;
                console.log('Found', pendingCount, 'pending approval requests');
            } catch (queryError) {
                console.error('Error querying approval requests:', queryError);
            }
        }
        
        res.json({ 
            message: 'Approval requests test endpoint is working!',
            timestamp: new Date(),
            environment: process.env.NODE_ENV || 'development',
            database: 'connected',
            models: models,
            stockModel: stockModelAvailable,
            approvalModel: approvalModelAvailable,
            pendingRequests: pendingCount
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ 
            message: 'Test endpoint failed',
            error: error.message,
            stack: error.stack
        });
    }
};

// Simple API health check without complex operations
exports.apiCheck = async (req, res) => {
    try {
        console.log('=== SIMPLE API CHECK ===');
        
        // Test 1: Basic database connection
        await db.sequelize.authenticate();
        console.log('✅ Database connected');
        
        // Test 2: Count records without complex queries
        const approvalCount = await db.ApprovalRequest.count();
        console.log('✅ Approval requests count:', approvalCount);
        
        // Test 3: Simple model check
        const hasStock = !!db.Stock;
        const hasApprovalRequest = !!db.ApprovalRequest;
        console.log('✅ Models available - Stock:', hasStock, 'ApprovalRequest:', hasApprovalRequest);
        
        // Test 4: Get one approval request to test query
        let sampleApproval = null;
        if (approvalCount > 0) {
            sampleApproval = await db.ApprovalRequest.findOne({
                attributes: ['id', 'type', 'status'],
                limit: 1
            });
            console.log('✅ Sample approval found:', sampleApproval?.id);
        }
        
        const response = {
            message: 'API health check passed!',
            timestamp: new Date().toISOString(),
            database: 'connected',
            approvalCount: approvalCount,
            modelsAvailable: {
                Stock: hasStock,
                ApprovalRequest: hasApprovalRequest
            },
            sampleApprovalId: sampleApproval?.id || null,
            serverStatus: 'healthy'
        };
        
        console.log('✅ API Check successful:', response);
        res.json(response);
        
    } catch (error) {
        console.error('❌ API Check failed:', error);
        res.status(500).json({ 
            message: 'API health check failed', 
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
};

// Test endpoint to check stock service
exports.testStockService = async (req, res) => {
    try {
        console.log('Testing stock service...');
        console.log('Stock service methods:', Object.keys(stockService));
        
        // Test if we can call the service
        const testResult = await stockService.getAll();
        console.log('Stock service test successful, found', testResult.length, 'stocks');
        
        res.json({
            message: 'Stock service is working!',
            methods: Object.keys(stockService),
            stockCount: testResult.length,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Stock service test failed:', error);
        res.status(500).json({
            message: 'Stock service test failed!',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

// Test endpoint to check database connection
exports.testDatabase = async (req, res) => {
    try {
        console.log('Testing database connection...');
        
        // Test database connection
        await db.sequelize.authenticate();
        console.log('Database connection successful');
        
        // Test approval request model
        const approvalCount = await db.ApprovalRequest.count();
        console.log('Found', approvalCount, 'approval requests');
        
        // Test stock model
        const stockCount = await db.Stock.count();
        console.log('Found', stockCount, 'stock entries');
        
        res.json({
            message: 'Database is working!',
            approvalRequests: approvalCount,
            stockEntries: stockCount,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Database test failed:', error);
        res.status(500).json({
            message: 'Database test failed!',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

// Test endpoint to simulate approval process
// Test exact approval process simulation
exports.testApprovalSimulation = async (req, res) => {
    try {
        console.log('=== TESTING EXACT APPROVAL PROCESS SIMULATION ===');
        
        // Test 1: Database connection
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test 2: Get a pending approval request
        const pendingRequest = await db.ApprovalRequest.findOne({
            where: { 
                status: 'pending',
                type: 'stock'
            }
        });
        
        if (!pendingRequest) {
            return res.json({
                message: 'No pending stock approval requests found for testing',
                timestamp: new Date()
            });
        }
        
        console.log('Found pending request:', pendingRequest.id);
        console.log('Request data:', JSON.stringify(pendingRequest.requestData, null, 2));
        
        // Test 3: Simulate the exact approval process
        const requestData = pendingRequest.requestData;
        
        // Validate required fields (same as in approval function)
        if (!requestData) {
            throw new Error('Request data is null or undefined');
        }
        
        if (!requestData.itemId) {
            throw new Error('itemId is missing from request data');
        }
        if (!requestData.locationId) {
            throw new Error('locationId is missing from request data');
        }
        if (!requestData.quantity) {
            throw new Error('quantity is missing from request data');
        }
        if (!requestData.price) {
            throw new Error('price is missing from request data');
        }
        
        console.log('✅ All required fields present');
        
        // Test 4: Transform data (same as in approval function)
        const stockData = {
            itemId: parseInt(requestData.itemId),
            locationId: parseInt(requestData.locationId),
            quantity: parseInt(requestData.quantity),
            price: parseFloat(requestData.price),
            totalPrice: parseInt(requestData.quantity) * parseFloat(requestData.price),
            remarks: requestData.remarks || '',
            receiptAttachment: requestData.receiptAttachment || null,
            disposeId: requestData.disposeId ? parseInt(requestData.disposeId) : null,
            createdBy: pendingRequest.createdBy
        };
        
        console.log('Transformed stock data:', JSON.stringify(stockData, null, 2));
        
        // Test 5: Check if Stock model is available
        if (!db.Stock) {
            throw new Error('Stock model is not available in db object');
        }
        console.log('✅ Stock model is available');
        
        if (typeof db.Stock.create !== 'function') {
            throw new Error('Stock.create method is not available');
        }
        console.log('✅ Stock.create method is available');
        
        // Test 6: Try to create stock entry (without actually creating it)
        console.log('Testing stock creation validation...');
        
        // Check if the referenced items exist
        const itemExists = await db.Item.findByPk(stockData.itemId);
        if (!itemExists) {
            throw new Error(`Item with ID ${stockData.itemId} does not exist`);
        }
        console.log('✅ Item exists:', itemExists.name);
        
        const locationExists = await db.StorageLocation.findByPk(stockData.locationId);
        if (!locationExists) {
            throw new Error(`Storage location with ID ${stockData.locationId} does not exist`);
        }
        console.log('✅ Storage location exists:', locationExists.name);
        
        const userExists = await db.Account.findByPk(stockData.createdBy);
        if (!userExists) {
            throw new Error(`User with ID ${stockData.createdBy} does not exist`);
        }
        console.log('✅ User exists:', userExists.firstName, userExists.lastName);
        
        res.json({
            message: 'Approval process simulation successful!',
            approvalRequestId: pendingRequest.id,
            originalRequestData: requestData,
            transformedStockData: stockData,
            validationResults: {
                itemExists: true,
                locationExists: true,
                userExists: true,
                itemName: itemExists.name,
                locationName: locationExists.name,
                userName: `${userExists.firstName} ${userExists.lastName}`
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Approval process simulation failed:', error);
        res.status(500).json({
            message: 'Approval process simulation failed',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

// Test data flow endpoint - shows how data flows from approval to stock creation
exports.testDataFlow = async (req, res) => {
    try {
        console.log('Testing data flow from approval to stock creation...');
        
        // Test database connection
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Get the first pending stock approval request
        const pendingStockRequest = await db.ApprovalRequest.findOne({
            where: { 
                status: 'pending',
                type: 'stock'
            }
        });
        
        if (!pendingStockRequest) {
            return res.json({
                message: 'No pending stock approval requests found',
                timestamp: new Date()
            });
        }
        
        console.log('Found pending stock request:', pendingStockRequest.id);
        console.log('Request data:', JSON.stringify(pendingStockRequest.requestData, null, 2));
        
        // Simulate the data transformation that happens during approval
        const requestData = pendingStockRequest.requestData;
        const stockData = {
            itemId: parseInt(requestData.itemId),
            locationId: parseInt(requestData.locationId),
            quantity: parseInt(requestData.quantity),
            price: parseFloat(requestData.price),
            totalPrice: parseInt(requestData.quantity) * parseFloat(requestData.price),
            remarks: requestData.remarks || '',
            receiptAttachment: requestData.receiptAttachment || null,
            disposeId: requestData.disposeId ? parseInt(requestData.disposeId) : null,
            createdBy: pendingStockRequest.createdBy
        };
        
        console.log('Transformed stock data:', JSON.stringify(stockData, null, 2));
        
        // Test if we can create the stock entry (without actually creating it)
        console.log('Testing stock creation validation...');
        
        // Validate required fields
        const validationErrors = [];
        if (!stockData.itemId) validationErrors.push('itemId is missing');
        if (!stockData.locationId) validationErrors.push('locationId is missing');
        if (!stockData.quantity) validationErrors.push('quantity is missing');
        if (!stockData.price) validationErrors.push('price is missing');
        if (!stockData.createdBy) validationErrors.push('createdBy is missing');
        
        if (validationErrors.length > 0) {
            return res.json({
                message: 'Data validation failed',
                errors: validationErrors,
                requestData: requestData,
                stockData: stockData,
                timestamp: new Date()
            });
        }
        
        res.json({
            message: 'Data flow test successful!',
            approvalRequestId: pendingStockRequest.id,
            originalRequestData: requestData,
            transformedStockData: stockData,
            validationPassed: true,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Data flow test failed:', error);
        res.status(500).json({
            message: 'Data flow test failed',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

// Test stock creation endpoint
exports.testStockCreation = async (req, res) => {
    try {
        console.log('Testing stock creation...');
        
        // Test database connection
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test Stock model
        if (!db.Stock) {
            throw new Error('Stock model is not available');
        }
        console.log('✅ Stock model is available');
        
        // Test creating a simple stock entry
        const testStockData = {
            itemId: 1,
            locationId: 1,
            quantity: 1,
            price: 10.00,
            totalPrice: 10.00,
            remarks: 'Test stock entry',
            receiptAttachment: null,
            disposeId: null,
            createdBy: 1
        };
        
        console.log('Creating test stock with data:', testStockData);
        const testStock = await db.Stock.create(testStockData);
        console.log('✅ Test stock created successfully with ID:', testStock.id);
        
        // Clean up test stock
        await db.Stock.destroy({ where: { id: testStock.id } });
        console.log('✅ Test stock cleaned up');
        
        res.json({
            message: 'Stock creation test successful!',
            testStockId: testStock.id,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Stock creation test failed:', error);
        res.status(500).json({
            message: 'Stock creation test failed',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

exports.testApprovalProcess = async (req, res) => {
    try {
        console.log('Testing approval process...');
        
        // Test database connection
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test models
        console.log('Available models:', Object.keys(db));
        console.log('Stock model available:', !!db.Stock);
        console.log('ApprovalRequest model available:', !!db.ApprovalRequest);
        console.log('Dispose model available:', !!db.Dispose);
        
        // Test Stock model methods
        if (db.Stock) {
            console.log('Stock model methods:', Object.getOwnPropertyNames(db.Stock));
            console.log('Stock.create method:', typeof db.Stock.create);
        }
        
        // Get the first pending approval request
        const pendingRequest = await db.ApprovalRequest.findOne({
            where: { status: 'pending' }
        });
        
        if (!pendingRequest) {
            return res.json({
                message: 'No pending approval requests found',
                models: Object.keys(db),
                stockModel: !!db.Stock,
                approvalModel: !!db.ApprovalRequest,
                disposeModel: !!db.Dispose,
                timestamp: new Date()
            });
        }
        
        console.log('Found pending request:', pendingRequest.id);
        console.log('Request data:', JSON.stringify(pendingRequest.requestData, null, 2));
        
        res.json({
            message: 'Approval process test successful',
            pendingRequestId: pendingRequest.id,
            requestData: pendingRequest.requestData,
            models: Object.keys(db),
            stockModel: !!db.Stock,
            approvalModel: !!db.ApprovalRequest,
            disposeModel: !!db.Dispose,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Approval process test failed:', error);
        res.status(500).json({
            message: 'Approval process test failed!',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

// GET /api/approval-requests - Get all approval requests (SuperAdmin/Admin only)
exports.getAll = async (req, res, next) => {
    try {
        const approvalRequests = await approvalRequestService.getAll();
        res.json(approvalRequests);
    } catch (error) {
        next(error);
    }
};

// GET /api/approval-requests/my - Get current user's approval requests (Staff)
exports.getMyRequests = async (req, res, next) => {
    try {
        const approvalRequests = await approvalRequestService.getByCreator(req.user.id);
        res.json(approvalRequests);
    } catch (error) {
        next(error);
    }
};

// GET /api/approval-requests/:id - Get approval request by ID
exports.getById = async (req, res, next) => {
    try {
        const approvalRequest = await approvalRequestService.getById(req.params.id);
        if (!approvalRequest) {
            return res.status(404).json({ message: 'Approval request not found' });
        }
        res.json(approvalRequest);
    } catch (error) {
        next(error);
    }
};

// POST /api/approval-requests - Create new approval request
exports.create = async (req, res, next) => {
    try {
        const requestData = {
            type: req.body.type,
            requestData: req.body.requestData,
            createdBy: req.user.id
        };

        const approvalRequest = await approvalRequestService.create(requestData);
        res.status(201).json(approvalRequest);
    } catch (error) {
        next(error);
    }
};

// PUT /api/approval-requests/:id/approve - Approve request
exports.approve = async (req, res, next) => {
    const transaction = await db.sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        console.log('=== BULLETPROOF APPROVAL WORKFLOW ===');
        console.log('Step 1: Starting approval process for ID:', id);
        console.log('Approving user:', req.user?.id, 'Role:', req.user?.role);
        console.log('Remarks:', remarks);

        // Step 1: Validate database connection
        console.log('Step 2: Testing database connection...');
        await db.sequelize.authenticate();
        console.log('✅ Database connection verified');

        // Step 2: Get approval request
        console.log('Step 3: Fetching approval request...');
        const approvalRequest = await db.ApprovalRequest.findByPk(id, { transaction });
        
        if (!approvalRequest) {
            await transaction.rollback();
            console.error('❌ Approval request not found');
            return res.status(404).json({ message: 'Approval request not found' });
        }

        if (approvalRequest.status !== 'pending') {
            await transaction.rollback();
            console.error('❌ Request is not pending, status:', approvalRequest.status);
            return res.status(400).json({ message: 'Request is not pending' });
        }

        console.log('✅ Found pending approval request');
        console.log('Request type:', approvalRequest.type);
        console.log('Request data:', JSON.stringify(approvalRequest.requestData, null, 2));
        console.log('Created by:', approvalRequest.createdBy);

        // Step 3: Execute based on type
        if (approvalRequest.type === 'stock') {
            console.log('Step 4: Processing STOCK approval...');
            
            const requestData = approvalRequest.requestData;
            
            // Validate all required fields
            if (!requestData?.itemId || !requestData?.locationId || !requestData?.quantity || !requestData?.price) {
                await transaction.rollback();
                const missing = [];
                if (!requestData?.itemId) missing.push('itemId');
                if (!requestData?.locationId) missing.push('locationId');
                if (!requestData?.quantity) missing.push('quantity');
                if (!requestData?.price) missing.push('price');
                
                console.error('❌ Missing required fields:', missing);
                return res.status(400).json({ 
                    message: 'Missing required fields', 
                    missingFields: missing 
                });
            }

            // Validate foreign key references exist
            console.log('Step 5: Validating foreign key references...');
            
            const [itemExists, locationExists, userExists] = await Promise.all([
                db.Item.findByPk(parseInt(requestData.itemId), { transaction }),
                db.StorageLocation.findByPk(parseInt(requestData.locationId), { transaction }),
                db.Account.findByPk(approvalRequest.createdBy, { transaction })
            ]);

            if (!itemExists) {
                await transaction.rollback();
                console.error('❌ Item not found:', requestData.itemId);
                return res.status(400).json({ message: `Item with ID ${requestData.itemId} not found` });
            }

            if (!locationExists) {
                await transaction.rollback();
                console.error('❌ Location not found:', requestData.locationId);
                return res.status(400).json({ message: `Location with ID ${requestData.locationId} not found` });
            }

            if (!userExists) {
                await transaction.rollback();
                console.error('❌ User not found:', approvalRequest.createdBy);
                return res.status(400).json({ message: `User with ID ${approvalRequest.createdBy} not found` });
            }

            console.log('✅ All foreign key references valid');
            console.log('Item:', itemExists.name);
            console.log('Location:', locationExists.name);
            console.log('User:', userExists.firstName, userExists.lastName);

            // Step 6: Create stock entry
            console.log('Step 6: Creating stock entry...');
            
            const stockData = {
                itemId: parseInt(requestData.itemId),
                locationId: parseInt(requestData.locationId),
                quantity: parseInt(requestData.quantity),
                price: parseFloat(requestData.price),
                totalPrice: parseInt(requestData.quantity) * parseFloat(requestData.price),
                remarks: requestData.remarks || '',
                receiptAttachment: requestData.receiptAttachment || null,
                disposeId: requestData.disposeId ? parseInt(requestData.disposeId) : null,
                createdBy: approvalRequest.createdBy,
                createdAt: new Date()
            };

            console.log('Creating stock with data:', JSON.stringify(stockData, null, 2));
            
            const newStock = await db.Stock.create(stockData, { transaction });
            console.log('✅ Stock created successfully with ID:', newStock.id);

            // Step 7: Update approval status
            console.log('Step 7: Updating approval status...');
            
            await db.ApprovalRequest.update({
                status: 'approved',
                approvedBy: req.user.id,
                approvedAt: new Date(),
                remarks: remarks || null
            }, {
                where: { id: id },
                transaction
            });

            console.log('✅ Approval status updated successfully');

            // Step 8: Commit transaction
            await transaction.commit();
            console.log('✅ Transaction committed successfully');

            // Step 9: Return success response
            const response = {
                id: approvalRequest.id,
                type: approvalRequest.type,
                status: 'approved',
                message: 'Stock entry created successfully',
                stockId: newStock.id,
                stockData: {
                    id: newStock.id,
                    itemId: newStock.itemId,
                    itemName: itemExists.name,
                    locationId: newStock.locationId,
                    locationName: locationExists.name,
                    quantity: newStock.quantity,
                    price: newStock.price,
                    totalPrice: newStock.totalPrice,
                    remarks: newStock.remarks,
                    createdBy: newStock.createdBy,
                    createdByName: `${userExists.firstName} ${userExists.lastName}`,
                    createdAt: newStock.createdAt
                },
                approvedBy: req.user.id,
                approvedAt: new Date(),
                remarks: remarks || null
            };

            console.log('✅ APPROVAL WORKFLOW COMPLETED SUCCESSFULLY');
            console.log('Response:', JSON.stringify(response, null, 2));
            
            return res.json(response);

        } else if (approvalRequest.type === 'dispose') {
            console.log('Step 4: Processing DISPOSE approval...');
            
            // Execute dispose request
            const disposeResult = await disposeService.create(approvalRequest.requestData, approvalRequest.createdBy);
            console.log('✅ Dispose request executed successfully');

            // Update approval status
            await db.ApprovalRequest.update({
                status: 'approved',
                approvedBy: req.user.id,
                approvedAt: new Date(),
                remarks: remarks || null
            }, {
                where: { id: id },
                transaction
            });

            await transaction.commit();
            console.log('✅ Dispose approval completed successfully');

            return res.json({
                id: approvalRequest.id,
                type: approvalRequest.type,
                status: 'approved',
                message: 'Dispose request executed successfully',
                disposeId: disposeResult.id,
                approvedBy: req.user.id,
                approvedAt: new Date(),
                remarks: remarks || null
            });

        } else {
            await transaction.rollback();
            console.error('❌ Unknown request type:', approvalRequest.type);
            return res.status(400).json({ message: 'Unknown request type' });
        }

    } catch (error) {
        await transaction.rollback();
        console.error('❌ APPROVAL WORKFLOW FAILED');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            console.error('❌ Foreign key constraint error');
            return res.status(400).json({
                message: 'Foreign key constraint error - referenced item, location, or user not found',
                error: error.message,
                type: 'FOREIGN_KEY_ERROR'
            });
        }
        
        if (error.name === 'SequelizeValidationError') {
            console.error('❌ Validation error');
            return res.status(400).json({
                message: 'Data validation error',
                errors: error.errors?.map(e => e.message) || [error.message],
                type: 'VALIDATION_ERROR'
            });
        }
        
        return res.status(500).json({
            message: 'Internal server error during approval',
            error: error.message,
            type: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString()
        });
    }
};

// PUT /api/approval-requests/:id/reject - Reject request
exports.reject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rejectionReason, remarks } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        // Get the approval request
        const approvalRequest = await approvalRequestService.getById(id);
        if (!approvalRequest) {
            return res.status(404).json({ message: 'Approval request not found' });
        }

        if (approvalRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Request is not pending' });
        }

        // Update status to rejected
        const updatedRequest = await approvalRequestService.updateStatus(id, 'rejected', req.user.id, rejectionReason, remarks);
        res.json(updatedRequest);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/approval-requests/:id - Delete approval request (Staff can delete their own pending requests)
exports._delete = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get the approval request
        const approvalRequest = await approvalRequestService.getById(id);
        if (!approvalRequest) {
            return res.status(404).json({ message: 'Approval request not found' });
        }

        // Check if user can delete this request
        if (approvalRequest.createdBy !== req.user.id && !['SuperAdmin', 'Admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to delete this request' });
        }

        // Only allow deletion of pending requests
        if (approvalRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending requests can be deleted' });
        }

        await approvalRequestService.delete(id);
        res.json({ message: 'Approval request deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// GET /api/approval-requests/stats/pending - Get pending requests count
exports.getPendingCount = async (req, res, next) => {
    try {
        const count = await approvalRequestService.getPendingCount();
        res.json({ count });
    } catch (error) {
        next(error);
    }
};

// Helper function to clean and validate stock data
function cleanStockData(data) {
    console.log('Cleaning stock data:', JSON.stringify(data, null, 2));
    
    const cleaned = {
        itemId: parseInt(data.itemId),
        locationId: parseInt(data.locationId),
        quantity: parseInt(data.quantity),
        price: parseFloat(data.price),
        remarks: data.remarks || '',
        receiptAttachment: data.receiptAttachment || null,
        disposeId: data.disposeId ? parseInt(data.disposeId) : null
    };
    
    console.log('Cleaned stock data:', JSON.stringify(cleaned, null, 2));
    return cleaned;
}

// Helper function to execute stock request
async function executeStockRequest(requestData, createdBy) {
    console.log('=== EXECUTE STOCK REQUEST DEBUG ===');
    console.log('Request Data:', JSON.stringify(requestData, null, 2));
    console.log('Created By:', createdBy);
    console.log('Is Array:', Array.isArray(requestData));
    
    try {
        // Handle multiple stock entries
        if (Array.isArray(requestData)) {
            console.log('Processing array of stock entries...');
            for (let i = 0; i < requestData.length; i++) {
                console.log(`Processing stock entry ${i + 1}:`, JSON.stringify(requestData[i], null, 2));
                const cleanedData = cleanStockData(requestData[i]);
                await stockService.create(cleanedData, createdBy);
                console.log(`✅ Stock entry ${i + 1} created successfully`);
            }
        } else {
            console.log('Processing single stock entry...');
            console.log('Stock data to create:', JSON.stringify(requestData, null, 2));
            console.log('User ID for creation:', createdBy);
            
            // Clean and validate the data
            const cleanedData = cleanStockData(requestData);
            
            // Validate required fields after cleaning
            if (!cleanedData.itemId || isNaN(cleanedData.itemId)) {
                throw new Error('Invalid or missing itemId in request data');
            }
            if (!cleanedData.locationId || isNaN(cleanedData.locationId)) {
                throw new Error('Invalid or missing locationId in request data');
            }
            if (!cleanedData.price || isNaN(cleanedData.price)) {
                throw new Error('Invalid or missing price in request data');
            }
            if (!cleanedData.quantity || isNaN(cleanedData.quantity)) {
                throw new Error('Invalid or missing quantity in request data');
            }
            
            const result = await stockService.create(cleanedData, createdBy);
            console.log('✅ Single stock entry created successfully:', result.id);
        }
        console.log('✅ All stock entries processed successfully');
    } catch (error) {
        console.error('❌ Error in executeStockRequest:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            requestData: requestData,
            createdBy: createdBy
        });
        throw error;
    }
}

// Helper function to execute dispose request
