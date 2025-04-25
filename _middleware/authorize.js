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
                const account = await db.Account.findByPk(req.auth.id); 

                if (!account) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                // Check if account is active
                if (account.status !== 'active') {
                    return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
                }

                // Check for role authorization
                if (roles.length && !roles.includes(account.role)) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                req.user = account; // Attach user info
                next();
            } catch (error) {
                console.error(error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    ];
}

