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
        // ✅ Correct function name
        expressjwt({ secret: config.secret, algorithms: ['HS256'] }),

        async (req, res, next) => {
            try {
                const account = await db.Account.findByPk(req.auth.id); 

                if (!account || (roles.length && !roles.includes(account.role))) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                req.user = account; // Attach user info
                next();
            } catch (error) {
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    ];
}
