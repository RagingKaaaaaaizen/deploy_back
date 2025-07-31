require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./_middleware/error-handler');

// Import route indexes (not controllers)
const categoryRoutes = require('./category');
const itemRoutes = require('./items');
const stockRoutes = require('./stock');
const brandController = require('./brand/brand.controller');
const storageLocationRoutes = require('./storage-location');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Allow CORS
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

// API routes
app.use('/accounts', require('./accounts/account.controller'));
app.use('/departments', require('./departments/department.controller'));
app.use('/employees', require('./employees/employee.controller'));
app.use('/requests', require('./requests/request.controller'));
app.use('/workflows', require('./workflows/workflow.controller'));

app.use('/storage-locations', storageLocationRoutes);
app.use('/brand', brandController);

// Inventory management routes (use index.js)
app.use('/category', categoryRoutes);
app.use('/items', itemRoutes);
app.use('/stock', stockRoutes);

// Swagger docs
app.use('/api-docs', require('./_helpers/swagger'));

// Global error handler
app.use(errorHandler);

// Start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => console.log('Server listening on port ' + port));
