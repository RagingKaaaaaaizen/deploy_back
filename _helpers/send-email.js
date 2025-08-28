const nodemailer = require('nodemailer');
// Use environment variables for production, fallback to config.json for development
const config = {
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

module.exports = sendEmail;

async function sendEmail({ to, subject, html, from = config.emailFrom }) {
    const transporter = nodemailer.createTransport(config.smtpOptions);
    await transporter.sendMail({ from, to, subject, html });
}

//hi