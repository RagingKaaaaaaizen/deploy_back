const { expressjwt: jwt } = require('express-jwt');

const config = require('../config.json'); 
const db = require('../_helpers/db');

module.exports = authorize;

function authorize(roles = []) {
    // Convert a single role string to an array
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        jwt({ secret: config.secret, algorithms: ['HS256'] }),

        async (req, res, next) => {
            try {
                console.log('Authorize middleware - req.auth:', req.auth);
                
                const account = await db.Account.findByPk(req.auth.id); 

                if (!account) {
                    console.log('Account not found for ID:', req.auth.id);
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                if (account.status !== 'Active') {
                    console.log('Account is inactive:', account.email);
                    return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
                }

                if (roles.length && !roles.some(role => role === account.role)) {
                    console.log('User role not authorized:', account.role, 'Required:', roles);
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                req.user = account;
                console.log('User authorized:', account.email, 'Role:', account.role);
                next();
            } catch (error) {
                console.error('Error in authorize middleware:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    ];
}

