const db = require('./_helpers/db');

async function checkReceiptData() {
    try {
        console.log('=== CHECKING RECEIPT DATA ===');
        
        // Wait for database to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check approval requests with receipt attachments
        const approvalRequests = await db.ApprovalRequest.findAll({
            where: {
                requestData: {
                    [db.Sequelize.Op.like]: '%receiptAttachment%'
                }
            },
            attributes: ['id', 'requestData', 'createdAt']
        });
        
        console.log('Approval requests with receipt attachments:', approvalRequests.length);
        approvalRequests.forEach(req => {
            const requestData = typeof req.requestData === 'string' ? JSON.parse(req.requestData) : req.requestData;
            console.log(`ID: ${req.id}, Receipt: ${requestData.receiptAttachment}, Created: ${req.createdAt}`);
        });
        
        // Check stock entries with receipt attachments
        const stocks = await db.Stock.findAll({
            where: {
                receiptAttachment: {
                    [db.Sequelize.Op.ne]: null
                }
            },
            attributes: ['id', 'receiptAttachment', 'createdAt']
        });
        
        console.log('\nStock entries with receipt attachments:', stocks.length);
        stocks.forEach(stock => {
            console.log(`ID: ${stock.id}, Receipt: ${stock.receiptAttachment}, Created: ${stock.createdAt}`);
        });
        
        console.log('\n=== END RECEIPT DATA CHECK ===');
        process.exit(0);
    } catch (error) {
        console.error('Error checking receipt data:', error);
        process.exit(1);
    }
}

checkReceiptData();
