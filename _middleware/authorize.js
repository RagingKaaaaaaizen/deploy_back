const { expressjwt } = require('express-jwt'); 
const config = require('../config.json'); 
const db = require('../_helpers/db');

module.exports = authorize;

function authorize(roles = []) {
    // Convert a single role string to an array
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        expressjwt({ secret: config.secret, algorithms: ['HS256'] }),

        async (req, res, next) => {
    try {
        console.log("req.auth:", req.auth); // Log the decoded token
        const account = await db.Account.findByPk(req.auth.id); 
        console.log("account:", account);

        if (!account) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (account.status !== 'Active') {
            return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
        }

        if (roles.length && !roles.includes(account.role)) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = account;
        next();
    } catch (error) {
        console.error("Authorization error:", error); // Log error details
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

    ];
}

