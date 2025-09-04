const fs = require('fs');
const path = require('path');

// Ensure uploads directory structure exists
function ensureUploadsDirectory() {
    const uploadsDir = path.join(__dirname, 'uploads');
    const receiptsDir = path.join(uploadsDir, 'receipts');
    
    try {
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('✅ Created uploads directory');
        }
        
        // Create receipts subdirectory if it doesn't exist
        if (!fs.existsSync(receiptsDir)) {
            fs.mkdirSync(receiptsDir, { recursive: true });
            console.log('✅ Created uploads/receipts directory');
        }
        
        console.log('✅ Upload directories are ready');
        return true;
    } catch (error) {
        console.error('❌ Failed to create upload directories:', error);
        return false;
    }
}

module.exports = ensureUploadsDirectory;
