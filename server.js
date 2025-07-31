require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./_middleware/error-handler');

// Initialize database
const db = require('./_helpers/db');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Allow CORS
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

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
app.use('/api/specifications', require('./specifications/specification.controller'));
app.use('/api/dispose', require('./dispose'));

// Swagger docs
app.use('/api-docs', require('./_helpers/swagger'));

// Global error handler
app.use(errorHandler);

// Start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => console.log('Server listening on port ' + port));
