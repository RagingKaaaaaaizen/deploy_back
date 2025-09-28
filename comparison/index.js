const express = require('express');
const comparisonRoutes = require('./comparison.routes');

const router = express.Router();

// Mount comparison routes
router.use('/comparison', comparisonRoutes);

module.exports = router;
