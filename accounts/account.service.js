const db = require('../_helpers/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// Use environment variables for production, fallback to config.json for development
const JWT_CONFIG = require('../jwt-config');
const config = {
    secret: JWT_CONFIG.SECRET,
    emailFrom: process.env.EMAIL_FROM || "info@node-mysql-signup-verification-api.com",
    smtpOptions: {
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: process.env.SMTP_PORT || 587,
        auth: {
            user: process.env.SMTP_USER || "annie.parker0@ethereal.email",
            pass: process.env.SMTP_PASS || "fnyCSJGPbHW1hHaPGQ"
        }
    }
};
const { Op } = require('sequelize');
const sendEmail = require('../_helpers/send-email');
const Role = require('../_helpers/role');

module.exports = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    activateAccount,
    deactivateAccount
};

async function authenticate({ email, password, ipAddress, userAgent }) {
    // Always lowercase emails for consistency
    email = email.toLowerCase();

    const account = await db.Account.scope('withHash').findOne({ where: { email } });

    if (!account) {
        throw { message: 'No account found with this email' };
    }

    // Check if account is verified (use actual verified field, not virtual)
    if (!account.verified && account.verificationToken) {
        throw { message: 'Email is not verified. Please check your inbox.' };
    }

    if (account.status !== 'Active') {
        throw { message: 'Account is inactive. Please contact support or admin.' };
    }

    const passwordMatch = await bcrypt.compare(password, account.passwordHash);
    if (!passwordMatch) {
        throw { message: 'Password is incorrect' };
    }

    // Update last login time
    account.lastLogin = new Date();
    await account.save();

    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, ipAddress);
    await refreshToken.save();

    // Log LOGIN event
    const activityLogService = require('../activity-log/activity-log.service');
    await activityLogService.logActivity({
        userId: account.id,
        action: 'LOGIN',
        entityType: 'ACCOUNT',
        entityId: account.id,
        entityName: `${account.firstName} ${account.lastName}`,
        details: { email: account.email },
        ipAddress,
        userAgent: userAgent || ''
    });

    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token, ipAddress }) {
    // Check if token is provided
    if (!token) {
        throw { message: 'Token is required' };
    }
    
    try {
        const refreshToken = await getRefreshToken(token);
        const account = await refreshToken.getAccount();

        const newRefreshToken = generateRefreshToken(account, ipAddress);
        refreshToken.revoked = Date.now();
        refreshToken.revokedByIp = ipAddress;
        refreshToken.replacedByToken = newRefreshToken.token;
        await refreshToken.save();
        await newRefreshToken.save();

        const jwtToken = generateJwtToken(account);

        return {
            ...basicDetails(account),
            jwtToken,
            refreshToken: newRefreshToken.token
        };
    } catch (error) {
        console.error('Refresh token error:', error);
        throw { message: 'Invalid or expired token' };
    }
}

async function revokeToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
}

async function register(params, origin) {
    try {
        console.log('Starting registration for:', params.email);
        
        // Normalize email to lowercase
        params.email = params.email.toLowerCase();

        // Check if database is connected
        if (!db.Account) {
            throw new Error('Database not initialized');
        }

        if (await db.Account.findOne({ where: { email: params.email } })) {
            console.log('Email already registered:', params.email);
            return await sendAlreadyRegisteredEmail(params.email, origin);
        }

    const account = new db.Account(params);
    const isFirstAccount = (await db.Account.count()) === 0;
    account.role = isFirstAccount ? Role.SuperAdmin : Role.Viewer;
    account.passwordHash = await hash(params.password);

    if (isFirstAccount) {
        // First user: bypass verification, set as verified and active
        account.verified = new Date();
        account.status = 'Active';
        account.verificationToken = null;
        account.acceptTerms = true;
    } else {
        // For testing purposes, make all new accounts active without email verification
        // In production, you would want email verification
        account.verified = new Date();
        account.status = 'Active';
        account.verificationToken = null;
        account.acceptTerms = true;
    }

    await account.save();
    
    if (isFirstAccount) {
        // First user: no email verification needed, but return authentication tokens
        console.log('First account created as SuperAdmin');
        
        // Generate authentication tokens for immediate login
        const jwtToken = generateJwtToken(account);
        const refreshToken = generateRefreshToken(account, '127.0.0.1'); // Default IP for first user
        await refreshToken.save();
        
        return { 
            message: "Registration successful! You are now logged in as SuperAdmin.",
            jwtToken,
            refreshToken: refreshToken.token,
            account: basicDetails(account)
        };
    } else {
        // For testing: return authentication tokens for all new accounts
        console.log('New account created and activated');
        
        // Generate authentication tokens for immediate login
        const jwtToken = generateJwtToken(account);
        const refreshToken = generateRefreshToken(account, '127.0.0.1'); // Default IP
        await refreshToken.save();
        
        return { 
            message: "Registration successful! You are now logged in.",
            jwtToken,
            refreshToken: refreshToken.token,
            account: basicDetails(account)
        };
    }
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function verifyEmail({ token }) {
    const account = await db.Account.findOne({ where: { verificationToken: token } });
    if (!account) throw 'Verification failed';

    // Set verified date and clear token
    account.verified = new Date();
    account.verificationToken = null;
    await account.save();
}

async function forgotPassword({ email }, origin) {
    email = email.toLowerCase();
    const account = await db.Account.findOne({ where: { email } });
    if (!account) return;

    account.resetToken = randomTokenString();
    account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await account.save();
    await sendPasswordResetEmail(account, origin);
}

async function validateResetToken({ token }) {
    const account = await db.Account.findOne({
        where: {
            resetToken: token,
            resetTokenExpires: { [Op.gt]: Date.now() }
        }
    });

    if (!account) throw 'Invalid token';
    return account;
}

async function resetPassword({ token, password }) {
    const account = await validateResetToken({ token });
    account.passwordHash = await hash(password);
    account.passwordReset = new Date();
    account.resetToken = null;
    await account.save();
}

async function getAll() {
    const accounts = await db.Account.findAll();
    return accounts.map(x => basicDetails(x));
}

async function getById(id) {
    const account = await getAccount(id);
    return basicDetails(account);
}

async function create(params) {
    params.email = params.email.toLowerCase();

    if (await db.Account.findOne({ where: { email: params.email } })) {
        throw { message: 'Email "' + params.email + '" is already registered' };
    }

    const account = new db.Account(params);
    account.verified = new Date();
    account.status = 'Active';
    account.passwordHash = await hash(params.password);
    await account.save();

    return basicDetails(account);
}

async function update(id, params) {
    const account = await getAccount(id);

    if (params.email) params.email = params.email.toLowerCase();

    if (params.email && account.email !== params.email && await db.Account.findOne({ where: { email: params.email } })) {
        throw { message: 'Email "' + params.email + '" is already taken' };
    }

    if (params.password) {
        params.passwordHash = await hash(params.password);
    }

    if (typeof params.status !== 'undefined') {
        if (params.status !== 'Active' && params.status !== 'Inactive') {
            throw { message: 'Invalid status value. Must be either Active or Inactive' };
        }
        account.status = params.status;
    }

    Object.assign(account, params);
    account.updated = new Date();
    await account.save();

    return basicDetails(account);
}

async function _delete(id) {
    const account = await getAccount(id);
    await account.destroy();
}

async function activateAccount(id) {
    const account = await getAccount(id);
    account.status = 'Active';
    account.updated = new Date();
    await account.save();
    return basicDetails(account);
}

async function deactivateAccount(id) {
    const account = await getAccount(id);
    account.status = 'Inactive';
    account.updated = new Date();
    await account.save();
    return basicDetails(account);
}

// Helper functions

async function getAccount(id) {
    const account = await db.Account.findByPk(id);
    if (!account) throw 'Account not found';
    return account;
}

async function getRefreshToken(token) {
    if (!token) {
        throw { message: 'Token is required' };
    }
    
    const refreshToken = await db.RefreshToken.findOne({ where: { token } });
    if (!refreshToken || !refreshToken.isActive) {
        throw { message: 'Invalid or expired token' };
    }
    return refreshToken;
}

async function hash(password) {
    return await bcrypt.hash(password, 10);
}

function generateJwtToken(account) {
    // include role in JWT payload for quick checks
    return jwt.sign({ sub: account.id, id: account.id, role: account.role }, config.secret, { expiresIn: '15m' });
}

function generateRefreshToken(account, ipAddress) {
    return new db.RefreshToken({
        accountId: account.id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress
    });
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

function basicDetails(account) {
    const { id, title, firstName, lastName, email, role, created, updated, isVerified, status, lastLogin } = account;
    return { id, title, firstName, lastName, email, role, created, updated, isVerified, status, lastLogin };
}

async function sendVerificationEmail(account, origin) {
    let message;
    if (origin) {
        const verifyUrl = `${origin}/account/verify-email?token=${account.verificationToken}`;
        message = `<p>Please click the below link to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to verify your email address with the <code>/account/verify-email</code> API route:</p><p><code>${account.verificationToken}</code></p>`;
    }

    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification API - Verify Email',
        html: `<h4>Verify Email</h4><p>Thanks for registering!</p>${message}`
    });
}

async function sendAlreadyRegisteredEmail(email, origin) {
    let message;
    if (origin) {
        message = `<p>If you don't know your password please visit the <a href="${origin}/account/forgot-password">forgot password</a> page.</p>`;
    } else {
        message = `<p>If you don't know your password you can reset it via the <code>/account/forgot-password</code> API route.</p>`;
    }

    await sendEmail({
        to: email,
        subject: 'Sign-up Verification API - Email Already Registered',
        html: `<h4>Email Already Registered</h4><p>Your email <strong>${email}</strong> is already registered.</p>${message}`
    });
}

async function sendPasswordResetEmail(account, origin) {
    let message;
    if (origin) {
        const resetUrl = `${origin}/account/reset-password?token=${account.resetToken}`;
        message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to reset your password with the <code>/account/reset-password</code> API route:</p><p><code>${account.resetToken}</code></p>`;
    }

    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification API - Reset Password',
        html: `<h4>Reset Password Email</h4>${message}`
    });
}
