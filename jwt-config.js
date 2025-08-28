// JWT Configuration for Computer Lab Inventory System
// This file centralizes JWT settings for security and consistency

const JWT_CONFIG = {
    // Production JWT Secret (128-character hex string)
    SECRET: process.env.JWT_SECRET || "4b7d938d321573661743c5483f476143b2593e938d2b76e97ef7b12041f80c772d00b021455836bbd7e0bf740b50bc074af4e7ffdc3a3e83487a07e79e7f722b",
    
    // JWT Token Options
    TOKEN_OPTIONS: {
        expiresIn: '7d', // Token expires in 7 days
        issuer: 'computer-lab-inventory-system',
        audience: 'computer-lab-inventory-users'
    },
    
    // Refresh Token Options
    REFRESH_TOKEN_OPTIONS: {
        expiresIn: '30d', // Refresh token expires in 30 days
        issuer: 'computer-lab-inventory-system',
        audience: 'computer-lab-inventory-refresh'
    },
    
    // Cookie Options
    COOKIE_OPTIONS: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    }
};

module.exports = JWT_CONFIG;
