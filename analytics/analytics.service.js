const db = require('../_helpers/db');
const { Op } = require('sequelize');

module.exports = {
    getDashboardAnalytics,
    getCategoryDistribution,
    getStockTimeline,
    getDisposalTimeline,
    getRecentActivity,
    getLowStockItems,
    getOutOfStockItems,
    getStockByLocation,
    getMonthlyStockAdditions,
    getMonthlyDisposals,
    generateReport,
    // Enhanced analytics
    getTopUsedCategories,
    getMostReplacedComponents,
    getAverageComponentLifespan,
    getComponentReplacementPatterns,
    getAdvancedAnalytics,
    getPendingRequests,
    getAutomatedReportSchedule,
    setAutomatedReportSchedule
};

// Get comprehensive dashboard analytics (FIXED VERSION)
async function getDashboardAnalytics() {
    try {
        console.log('=== DASHBOARD ANALYTICS DEBUG ===');
        console.log('Available models:', Object.keys(db));
        
        // Get counts for models that actually exist
        const [
            totalItems,
            totalStock,
            totalPCs,
            totalDisposals,
            lowStockItems,
            outOfStockItems,
            recentActivity
        ] = await Promise.all([
            db.Item.count(),
            db.Stock.sum('quantity') || 0,
            db.PC.count(),
            db.Dispose.sum('quantity') || 0,
            getLowStockItemsCount(),
            getOutOfStockItemsCount(),
            getRecentActivity(10)
        ]);

        console.log('Analytics data:', {
            totalItems,
            totalStock,
            totalPCs,
            totalDisposals,
            lowStockItems,
            outOfStockItems,
            recentActivityCount: recentActivity.length
        });

        return {
            totalItems,
            totalStock,
            totalPCs,
            totalDisposals,
            lowStockItems,
            outOfStockItems,
            recentActivity,
            // Add some calculated metrics
            totalValue: await getTotalInventoryValue(),
            averageStockPerItem: totalItems > 0 ? Math.round(totalStock / totalItems) : 0
        };
    } catch (error) {
        console.error('Error getting dashboard analytics:', error);
        throw error;
    }
}

// Get total inventory value
async function getTotalInventoryValue() {
    try {
        const result = await db.Stock.sum('totalPrice');
        return result || 0;
    } catch (error) {
        console.error('Error getting total inventory value:', error);
        return 0;
    }
}

// Get category distribution
async function getCategoryDistribution() {
    try {
        const stockData = await db.Stock.findAll({
            include: [
                {
                    model: db.Item,
                    as: 'item',
                    include: [
                        { model: db.Category, as: 'category', attributes: ['id', 'name'] }
                    ]
                }
            ]
        });

        const categoryMap = new Map();
        let totalStock = 0;

        stockData.forEach(stock => {
            if (stock.item && stock.item.category) {
                const categoryName = stock.item.category.name;
                const currentCount = categoryMap.get(categoryName) || 0;
                categoryMap.set(categoryName, currentCount + stock.quantity);
                totalStock += stock.quantity;
            }
        });

        const distribution = Array.from(categoryMap.entries()).map(([name, count]) => ({
            name,
            count,
            percentage: totalStock > 0 ? Math.round((count / totalStock) * 100) : 0
        }));

        return distribution.sort((a, b) => b.count - a.count);
    } catch (error) {
        console.error('Error getting category distribution:', error);
        throw error;
    }
}

// Get stock timeline data
async function getStockTimeline(days = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const stockData = await db.Stock.findAll({
            where: {
                createdAt: {
                    [Op.gte]: startDate
                }
            },
            attributes: [
                'createdAt',
                'quantity'
            ],
            order: [['createdAt', 'ASC']]
        });

        // Group by date
        const dailyData = new Map();
        stockData.forEach(stock => {
            const date = stock.createdAt.toISOString().split('T')[0];
            const currentCount = dailyData.get(date) || 0;
            dailyData.set(date, currentCount + stock.quantity);
        });

        return Array.from(dailyData.entries()).map(([date, stockCount]) => ({
            date,
            stockCount
        }));
    } catch (error) {
        console.error('Error getting stock timeline:', error);
        throw error;
    }
}

// Get disposal timeline data
async function getDisposalTimeline(days = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const disposalData = await db.Dispose.findAll({
            where: {
                disposalDate: {
                    [Op.gte]: startDate
                }
            },
            attributes: [
                'disposalDate',
                'quantity'
            ],
            order: [['disposalDate', 'ASC']]
        });

        // Group by date
        const dailyData = new Map();
        disposalData.forEach(disposal => {
            const date = disposal.disposalDate.toISOString().split('T')[0];
            const currentCount = dailyData.get(date) || 0;
            dailyData.set(date, currentCount + disposal.quantity);
        });

        return Array.from(dailyData.entries()).map(([date, disposalCount]) => ({
            date,
            disposalCount
        }));
    } catch (error) {
        console.error('Error getting disposal timeline:', error);
        throw error;
    }
}

// Get recent activity
async function getRecentActivity(limit = 10) {
    try {
        const activities = await db.ActivityLog.findAll({
            limit,
            order: [['createdAt', 'DESC']],
            include: [
                { model: db.Account, as: 'user', attributes: ['firstName', 'lastName'] }
            ]
        });

        return activities.map(activity => ({
            id: activity.id,
            message: activity.entityName,
            timestamp: activity.createdAt,
            action: activity.action,
            user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System',
            icon: getActivityIcon(activity.action)
        }));
    } catch (error) {
        console.error('Error getting recent activity:', error);
        throw error;
    }
}

// Get low stock items count
async function getLowStockItemsCount(threshold = 10) {
    try {
        const stockData = await db.Stock.findAll({
            include: [
                { model: db.Item, as: 'item', attributes: ['id', 'name'] }
            ]
        });

        const itemStockMap = new Map();
        stockData.forEach(stock => {
            const currentStock = itemStockMap.get(stock.itemId) || 0;
            itemStockMap.set(stock.itemId, currentStock + stock.quantity);
        });

        return Array.from(itemStockMap.values()).filter(stock => stock <= threshold).length;
    } catch (error) {
        console.error('Error getting low stock items count:', error);
        return 0;
    }
}

// Get low stock items with details
async function getLowStockItems(threshold = 10) {
    try {
        const stockData = await db.Stock.findAll({
            include: [
                { 
                    model: db.Item, 
                    as: 'item', 
                    attributes: ['id', 'name'],
                    include: [
                        { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                        { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                    ]
                }
            ]
        });

        const itemStockMap = new Map();
        const itemDetailsMap = new Map();

        stockData.forEach(stock => {
            const currentStock = itemStockMap.get(stock.itemId) || 0;
            itemStockMap.set(stock.itemId, currentStock + stock.quantity);
            
            if (!itemDetailsMap.has(stock.itemId) && stock.item) {
                itemDetailsMap.set(stock.itemId, stock.item);
            }
        });

        const lowStockItems = [];
        for (const [itemId, totalStock] of itemStockMap.entries()) {
            if (totalStock <= threshold) {
                const item = itemDetailsMap.get(itemId);
                if (item) {
                    lowStockItems.push({
                        id: itemId,
                        name: item.name,
                        category: item.category?.name || 'No Category',
                        brand: item.brand?.name || 'No Brand',
                        currentStock: totalStock,
                        threshold: threshold
                    });
                }
            }
        }

        return lowStockItems.sort((a, b) => a.currentStock - b.currentStock);
    } catch (error) {
        console.error('Error getting low stock items:', error);
        return [];
    }
}

// Get out of stock items count
async function getOutOfStockItemsCount() {
    try {
        const stockData = await db.Stock.findAll({
            include: [
                { model: db.Item, as: 'item', attributes: ['id', 'name'] }
            ]
        });

        const itemStockMap = new Map();
        stockData.forEach(stock => {
            const currentStock = itemStockMap.get(stock.itemId) || 0;
            itemStockMap.set(stock.itemId, currentStock + stock.quantity);
        });

        return Array.from(itemStockMap.values()).filter(stock => stock === 0).length;
    } catch (error) {
        console.error('Error getting out of stock items count:', error);
        return 0;
    }
}

// Get out of stock items with details
async function getOutOfStockItems() {
    try {
        const stockData = await db.Stock.findAll({
            include: [
                { 
                    model: db.Item, 
                    as: 'item', 
                    attributes: ['id', 'name'],
                    include: [
                        { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                        { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                    ]
                }
            ]
        });

        const itemStockMap = new Map();
        const itemDetailsMap = new Map();

        stockData.forEach(stock => {
            const currentStock = itemStockMap.get(stock.itemId) || 0;
            itemStockMap.set(stock.itemId, currentStock + stock.quantity);
            
            if (!itemDetailsMap.has(stock.itemId) && stock.item) {
                itemDetailsMap.set(stock.itemId, stock.item);
            }
        });

        const outOfStockItems = [];
        for (const [itemId, totalStock] of itemStockMap.entries()) {
            if (totalStock === 0) {
                const item = itemDetailsMap.get(itemId);
                if (item) {
                    outOfStockItems.push({
                        id: itemId,
                        name: item.name,
                        category: item.category?.name || 'No Category',
                        brand: item.brand?.name || 'No Brand',
                        currentStock: totalStock
                    });
                }
            }
        }

        return outOfStockItems.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('Error getting out of stock items:', error);
        return [];
    }
}

// Get stock by location
async function getStockByLocation() {
    try {
        const stockData = await db.Stock.findAll({
            include: [
                { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] }
            ]
        });

        const locationMap = new Map();
        stockData.forEach(stock => {
            if (stock.location) {
                const currentStock = locationMap.get(stock.location.name) || 0;
                locationMap.set(stock.location.name, currentStock + stock.quantity);
            }
        });

        return Array.from(locationMap.entries()).map(([name, count]) => ({
            name,
            count
        }));
    } catch (error) {
        console.error('Error getting stock by location:', error);
        throw error;
    }
}

// Get monthly stock additions
async function getMonthlyStockAdditions(months = 12) {
    try {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const stockData = await db.Stock.findAll({
            where: {
                createdAt: {
                    [Op.gte]: startDate
                }
            },
            attributes: [
                'createdAt',
                'quantity'
            ],
            order: [['createdAt', 'ASC']]
        });

        // Group by month
        const monthlyData = new Map();
        stockData.forEach(stock => {
            const monthKey = `${stock.createdAt.getFullYear()}-${String(stock.createdAt.getMonth() + 1).padStart(2, '0')}`;
            const currentCount = monthlyData.get(monthKey) || 0;
            monthlyData.set(monthKey, currentCount + stock.quantity);
        });

        return Array.from(monthlyData.entries()).map(([month, count]) => ({
            month,
            count
        }));
    } catch (error) {
        console.error('Error getting monthly stock additions:', error);
        throw error;
    }
}

// Get monthly disposals
async function getMonthlyDisposals(months = 12) {
    try {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const disposalData = await db.Dispose.findAll({
            where: {
                disposalDate: {
                    [Op.gte]: startDate
                }
            },
            attributes: [
                'disposalDate',
                'quantity'
            ],
            order: [['disposalDate', 'ASC']]
        });

        // Group by month
        const monthlyData = new Map();
        disposalData.forEach(disposal => {
            const monthKey = `${disposal.disposalDate.getFullYear()}-${String(disposal.disposalDate.getMonth() + 1).padStart(2, '0')}`;
            const currentCount = monthlyData.get(monthKey) || 0;
            monthlyData.set(monthKey, currentCount + disposal.quantity);
        });

        return Array.from(monthlyData.entries()).map(([month, count]) => ({
            month,
            count
        }));
    } catch (error) {
        console.error('Error getting monthly disposals:', error);
        throw error;
    }
}

// Helper function to get activity icon
function getActivityIcon(action) {
    const iconMap = {
        'CREATE_ITEM': 'fas fa-plus-circle',
        'UPDATE_ITEM': 'fas fa-edit',
        'DELETE_ITEM': 'fas fa-trash',
        'ADD_STOCK': 'fas fa-boxes',
        'UPDATE_STOCK': 'fas fa-edit',
        'DELETE_STOCK': 'fas fa-trash',
        'CREATE_PC': 'fas fa-desktop',
        'UPDATE_PC': 'fas fa-edit',
        'DELETE_PC': 'fas fa-trash',
        'DISPOSE_ITEM': 'fas fa-trash-alt'
    };
    return iconMap[action] || 'fas fa-info-circle';
}

// Generate comprehensive report (simplified version)
async function generateReport(request) {
    try {
        console.log('=== GENERATE REPORT DEBUG ===');
        console.log('Request:', request);
        console.log('Available models:', Object.keys(db));
        console.log('db.Stock exists:', !!db.Stock);
        console.log('db.Dispose exists:', !!db.Dispose);
        console.log('db.PC exists:', !!db.PC);
        
        const { startDate, endDate, includeStocks, includeDisposals, includePCs } = request;
        
        // Initialize report data with defaults
        const reportData = {
            stocks: [],
            disposals: [],
            pcs: [],
            summary: {
                totalStocks: 0,
                totalDisposals: 0,
                totalPCs: 0,
                totalValue: 0,
                stockValue: 0,
                disposalValue: 0,
                pcValue: 0
            }
        };
        
        // Get stocks data with simple approach
        if (includeStocks && db.Stock) {
            try {
                console.log('Fetching stocks data...');
            const stocks = await db.Stock.findAll({
                    attributes: ['id', 'itemId', 'quantity', 'locationId', 'price', 'totalPrice', 'createdAt'],
                    order: [['createdAt', 'DESC']]
                });
                
                // Get related data separately to avoid association issues
                const itemIds = [...new Set(stocks.map(s => s.itemId))];
                const locationIds = [...new Set(stocks.map(s => s.locationId))];
                
                let items = [];
                let locations = [];
                
                if (itemIds.length > 0 && db.Item) {
                    items = await db.Item.findAll({
                        where: { id: itemIds },
                        attributes: ['id', 'name', 'description'],
                        include: [
                            { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                            { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                        ]
                    });
                }
                
                if (locationIds.length > 0 && db.StorageLocation) {
                    locations = await db.StorageLocation.findAll({
                        where: { id: locationIds },
                        attributes: ['id', 'name', 'description']
                    });
                }
                
                reportData.stocks = stocks.map(stock => {
                    const item = items.find(i => i.id === stock.itemId);
                    const location = locations.find(l => l.id === stock.locationId);
                    
                    return {
                id: stock.id,
                        itemName: item?.name || 'Unknown Item',
                        categoryName: item?.category?.name || 'Unknown Category',
                        brandName: item?.brand?.name || 'Unknown Brand',
                quantity: stock.quantity,
                        locationName: location?.name || 'Unknown Location',
                totalPrice: stock.totalPrice,
                price: stock.price,
                createdAt: stock.createdAt
                    };
                });

            reportData.summary.totalStocks = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
                reportData.summary.stockValue = stocks.reduce((sum, stock) => sum + (stock.totalPrice || 0), 0);
                
            } catch (error) {
                console.error('Error fetching stocks:', error);
                reportData.stocks = [];
            }
        }
        
        // Get disposals data with simple approach
        if (includeDisposals && db.Dispose) {
            try {
                console.log('Fetching disposals data...');
                const disposals = await db.Dispose.findAll({
                    attributes: ['id', 'itemId', 'quantity', 'locationId', 'disposalValue', 'totalValue', 'reason', 'disposalDate', 'createdBy', 'createdAt', 'sourceStockId'],
                    order: [['disposalDate', 'DESC']]
                });
                
                console.log('=== DISPOSAL DATA DEBUG ===');
                console.log(`Total disposals fetched: ${disposals.length}`);
                if (disposals.length > 0) {
                    console.log('First disposal:', {
                        id: disposals[0].id,
                        itemId: disposals[0].itemId,
                        quantity: disposals[0].quantity,
                        disposalValue: disposals[0].disposalValue,
                        totalValue: disposals[0].totalValue,
                        sourceStockId: disposals[0].sourceStockId
                    });
                    
                    // Count how many have 0 values
                    const withZeroValue = disposals.filter(d => d.disposalValue === 0 || d.disposalValue === null).length;
                    const withoutSourceStock = disposals.filter(d => !d.sourceStockId).length;
                    console.log(`Disposals with disposalValue=0: ${withZeroValue}`);
                    console.log(`Disposals without sourceStockId: ${withoutSourceStock}`);
                }
                
                // Get related data separately
                const itemIds = [...new Set(disposals.map(d => d.itemId))];
                const locationIds = [...new Set(disposals.map(d => d.locationId))];
                const userIds = [...new Set(disposals.map(d => d.createdBy))];
                const sourceStockIds = [...new Set(disposals.map(d => d.sourceStockId).filter(id => id))];
                
                let items = [];
                let locations = [];
                let users = [];
                let sourceStocks = [];
                
                if (itemIds.length > 0 && db.Item) {
                    items = await db.Item.findAll({
                        where: { id: itemIds },
                        attributes: ['id', 'name', 'description'],
                        include: [
                            { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                            { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                        ]
                    });
                }
                
                if (locationIds.length > 0 && db.StorageLocation) {
                    locations = await db.StorageLocation.findAll({
                        where: { id: locationIds },
                        attributes: ['id', 'name', 'description']
                    });
                }
                
                if (userIds.length > 0 && db.Account) {
                    users = await db.Account.findAll({
                        where: { id: userIds },
                        attributes: ['id', 'firstName', 'lastName']
                    });
                }
                
                // Fetch source stock entries to get prices for disposals with 0 value
                if (sourceStockIds.length > 0 && db.Stock) {
                    sourceStocks = await db.Stock.findAll({
                        where: { id: sourceStockIds },
                        attributes: ['id', 'itemId', 'price']
                    });
                }
                
                // Fallback: get ANY stock prices for items (including deleted stocks)
                let currentStockPrices = [];
                if (itemIds.length > 0 && db.Stock) {
                    currentStockPrices = await db.Stock.findAll({
                        where: { itemId: itemIds },
                        attributes: ['itemId', 'price'],
                        order: [['price', 'DESC']] // Get highest price as fallback
                    });
                    console.log('Found stock prices for', currentStockPrices.length, 'items');
                    console.log('Sample stock price:', currentStockPrices.length > 0 ? {
                        itemId: currentStockPrices[0].itemId,
                        price: currentStockPrices[0].price
                    } : 'No stock prices found');
                }
                
                reportData.disposals = disposals.map(disposal => {
                    const item = items.find(i => i.id === disposal.itemId);
                    const location = locations.find(l => l.id === disposal.locationId);
                    const user = users.find(u => u.id === disposal.createdBy);
                    
                    // Get price from multiple sources (for old records with 0 values)
                    // NOTE: DECIMAL fields from Sequelize come back as strings. Always coerce to numbers.
                    let unitPrice = disposal.disposalValue != null ? parseFloat(disposal.disposalValue) : 0;
                    let totalValue = disposal.totalValue != null ? parseFloat(disposal.totalValue) : 0;
                    
                    console.log(`\n--- Processing Disposal ID ${disposal.id} (${item?.name || 'Unknown'}) ---`);
                    console.log(`  DB Values: disposalValue=${disposal.disposalValue}, totalValue=${disposal.totalValue}`);
                    console.log(`  IDs: itemId=${disposal.itemId}, sourceStockId=${disposal.sourceStockId}`);
                    console.log(`  Quantity: ${disposal.quantity}`);
                    
                    // If disposalValue is 0, try to get price from source stock
                    if (unitPrice === 0 && disposal.sourceStockId) {
                        console.log(`  Trying source stock lookup for sourceStockId=${disposal.sourceStockId}...`);
                        const sourceStock = sourceStocks.find(s => s.id === disposal.sourceStockId);
                        if (sourceStock) {
                            unitPrice = sourceStock.price != null ? parseFloat(sourceStock.price) : 0;
                            console.log(`  ✅ Found source stock price: PHP ${unitPrice}`);
                        } else {
                            console.log(`  ❌ Source stock not found in ${sourceStocks.length} stocks`);
                        }
                    } else if (unitPrice === 0) {
                        console.log(`  ⚠️  No sourceStockId - skipping source stock lookup`);
                    }
                    
                    // If still 0, try to get current stock price for this item
                    if (unitPrice === 0 && disposal.itemId) {
                        console.log(`  Trying current stock lookup for itemId=${disposal.itemId}...`);
                        const currentStock = currentStockPrices.find(s => s.itemId === disposal.itemId);
                        if (currentStock) {
                            unitPrice = currentStock.price != null ? parseFloat(currentStock.price) : 0;
                            console.log(`  ✅ Found current stock price: PHP ${unitPrice}`);
                        } else {
                            console.log(`  ❌ No stock price found (checked ${currentStockPrices.length} stocks)`);
                        }
                    }
                    
                    // Calculate total if not in database
                    if (totalValue === 0 && unitPrice > 0) {
                        totalValue = unitPrice * (disposal.quantity || 0);
                        console.log(`  ✅ Calculated total: PHP ${totalValue} = ${unitPrice} × ${disposal.quantity}`);
                    } else if (totalValue === 0) {
                        console.log(`  ❌ FINAL: price=0, total=0 - NO PRICE SOURCE FOUND`);
                    } else {
                        console.log(`  ✅ Using DB totalValue: PHP ${totalValue}`);
                    }
                    
                    return {
                        id: disposal.id,
                        itemName: item?.name || 'Unknown Item',
                        categoryName: item?.category?.name || 'Unknown Category',
                        brandName: item?.brand?.name || 'Unknown Brand',
                        quantity: disposal.quantity,
                        locationName: location?.name || 'Unknown Location',
                        price: Number(unitPrice) || 0, // Ensure number type
                        disposalValue: Number(unitPrice) || 0, // Ensure number type for compatibility
                        totalValue: Number(totalValue) || 0, // Ensure number type
                        reason: disposal.reason,
                        disposalDate: disposal.disposalDate,
                        disposedByName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                        createdAt: disposal.createdAt
                    };
                });
                
                // Calculate summary from mapped disposal data (with calculated values)
                reportData.summary.totalDisposals = reportData.disposals.reduce((sum, disposal) => sum + (Number(disposal.quantity) || 0), 0);
                reportData.summary.disposalValue = reportData.disposals.reduce((sum, disposal) => sum + (Number(disposal.totalValue) || 0), 0);
                
            } catch (error) {
                console.error('Error fetching disposals:', error);
                reportData.disposals = [];
            }
        }
        
        // Get PC data with simple approach (ALWAYS include PCs; PDF toggles control rendering)
        if (db.PC) {
            try {
                console.log('🔍 === FETCHING PC DATA ===');
                console.log('DB.PC model available:', !!db.PC);
                
                const pcCount = await db.PC.count();
                console.log(`Database has ${pcCount} total PCs`);
                
                if (pcCount === 0) {
                    console.log('⚠️  NO PCs found in database - skipping PC report');
                    reportData.pcs = [];
                    reportData.summary.totalPCs = 0;
                    reportData.summary.pcValue = 0;
                } else {
                    console.log(`Fetching ${pcCount} PCs with components...`);
                    const pcs = await db.PC.findAll({
                    attributes: ['id', 'name', 'roomLocationId', 'status', 'totalValue', 'value', 'createdAt', 'updatedAt'],
                    include: [
                        {
                            model: db.PCComponent,
                            as: 'components',
                            attributes: ['id', 'itemId', 'quantity', 'status'],
                            required: false
                        }
                    ],
                    order: [['createdAt', 'DESC']]
                });
                
                // Get related data separately
                const locationIds = [...new Set(pcs.map(pc => pc.roomLocationId))];
                let locations = [];
                
                if (locationIds.length > 0 && db.RoomLocation) {
                    locations = await db.RoomLocation.findAll({
                        where: { id: locationIds },
                        attributes: ['id', 'name', 'description']
                    });
                }
                
                // Get all component item IDs to fetch item details
                const allComponentItemIds = [];
                pcs.forEach(pc => {
                    if (pc.components) {
                        pc.components.forEach(comp => {
                            if (comp.itemId) allComponentItemIds.push(comp.itemId);
                        });
                    }
                });
                
                // Fetch component items
                let componentItems = [];
                if (allComponentItemIds.length > 0 && db.Item) {
                    componentItems = await db.Item.findAll({
                        where: { id: [...new Set(allComponentItemIds)] },
                        attributes: ['id', 'name', 'description'],
                        include: [
                            { model: db.Category, as: 'category', attributes: ['id', 'name'] }
                        ]
                    });
                }
                
                // Fetch stock data for component prices
                let componentStocks = [];
                if (allComponentItemIds.length > 0 && db.Stock) {
                    componentStocks = await db.Stock.findAll({
                        where: { itemId: [...new Set(allComponentItemIds)] },
                        attributes: ['itemId', 'price']
                    });
                }
                
                reportData.pcs = pcs.map(pc => {
                    const location = locations.find(l => l.id === pc.roomLocationId);
                    
                    // Map components with item details
                    const mappedComponents = pc.components ? pc.components.map(comp => {
                        const item = componentItems.find(i => i.id === comp.itemId);
                        const stock = componentStocks.find(s => s.itemId === comp.itemId);
                        const price = stock?.price || 0;
                        
                        return {
                            id: comp.id,
                            itemId: comp.itemId,
                            itemName: item?.name || 'Unknown Item',
                            quantity: comp.quantity || 1,
                            price: price,
                            totalValue: price * (comp.quantity || 1),
                            status: comp.status || 'Active'
                        };
                    }) : [];
                    
                    return {
                        id: pc.id,
                        name: pc.name,
                        roomLocationName: location?.name || 'Unknown Location',
                        status: pc.status,
                        components: mappedComponents,
                        componentsCount: mappedComponents.length,
                        totalValue: pc.totalValue || 0,
                        value: pc.value || 0,
                        createdAt: pc.createdAt,
                        updatedAt: pc.updatedAt
                    };
                });
                
                    reportData.summary.totalPCs = pcs.length;
                    reportData.summary.pcValue = pcs.reduce((sum, pc) => sum + (pc.totalValue || pc.value || 0), 0);
                    
                    console.log(`✅ Successfully mapped ${reportData.pcs.length} PCs for report`);
                    console.log(`Total PC Value: PHP ${reportData.summary.pcValue.toFixed(2)}`);
                }
                
            } catch (error) {
                console.error('❌ Error fetching PCs:', error);
                console.error('Error details:', error.message);
                console.error('Stack trace:', error.stack);
                reportData.pcs = [];
                reportData.summary.totalPCs = 0;
                reportData.summary.pcValue = 0;
            }
        } else {
            console.log('ℹ️  PC data not requested or PC model not available');
            console.log('includePCs:', includePCs);
            console.log('db.PC available:', !!db.PC);
        }
        
        // Calculate total value
        reportData.summary.totalValue = (reportData.summary.stockValue || 0) + 
                                      (reportData.summary.disposalValue || 0) + 
                                      (reportData.summary.pcValue || 0);
        
        console.log('Report generated successfully:', {
            stocks: reportData.stocks.length,
            disposals: reportData.disposals.length,
            pcs: reportData.pcs.length,
            summary: reportData.summary
        });

        return reportData;
        
    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
}

// Enhanced Analytics Functions

// Get top-used categories with usage statistics
async function getTopUsedCategories(limit = 10) {
    try {
        const stockData = await db.Stock.findAll({
            include: [
                {
                    model: db.Item,
                    as: 'item',
                    include: [
                        { model: db.Category, as: 'category', attributes: ['id', 'name'] }
                    ]
                }
            ]
        });

        const categoryUsage = new Map();
        let totalUsage = 0;

        stockData.forEach(stock => {
            if (stock.item && stock.item.category) {
                const categoryName = stock.item.category.name;
                const currentUsage = categoryUsage.get(categoryName) || 0;
                categoryUsage.set(categoryName, currentUsage + stock.quantity);
                totalUsage += stock.quantity;
            }
        });

        const topCategories = Array.from(categoryUsage.entries())
            .map(([name, usage]) => ({
                category: name,
                usage: usage,
                percentage: totalUsage > 0 ? Math.round((usage / totalUsage) * 100) : 0
            }))
            .sort((a, b) => b.usage - a.usage)
            .slice(0, limit);

        return topCategories;
    } catch (error) {
        console.error('Error getting top-used categories:', error);
        return [];
    }
}

// Get most replaced components based on disposal patterns
async function getMostReplacedComponents(limit = 10) {
    try {
        const disposalData = await db.Dispose.findAll({
            include: [
                {
                    model: db.Item,
                    as: 'item',
                    attributes: ['id', 'name'],
                    include: [
                        { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                        { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                    ]
                }
            ],
            order: [['disposalDate', 'DESC']]
        });

        const componentReplacements = new Map();

        disposalData.forEach(disposal => {
            if (disposal.item) {
                const key = `${disposal.item.name}_${disposal.item.category?.name || 'Unknown'}`;
                const current = componentReplacements.get(key) || {
                    name: disposal.item.name,
                    category: disposal.item.category?.name || 'Unknown',
                    brand: disposal.item.brand?.name || 'Unknown',
                    replacementCount: 0,
                    totalQuantity: 0,
                    lastReplaced: disposal.disposalDate
                };
                
                current.replacementCount += 1;
                current.totalQuantity += disposal.quantity;
                if (disposal.disposalDate > current.lastReplaced) {
                    current.lastReplaced = disposal.disposalDate;
                }
                
                componentReplacements.set(key, current);
            }
        });

        return Array.from(componentReplacements.values())
            .sort((a, b) => b.replacementCount - a.replacementCount)
            .slice(0, limit);
    } catch (error) {
        console.error('Error getting most replaced components:', error);
        return [];
    }
}

// Calculate average component lifespan
async function getAverageComponentLifespan() {
    try {
        const disposalData = await db.Dispose.findAll({
            include: [
                {
                    model: db.Item,
                    as: 'item',
                    attributes: ['id', 'name'],
                    include: [
                        { model: db.Category, as: 'category', attributes: ['id', 'name'] }
                    ]
                }
            ]
        });

        const lifespanData = new Map();

        disposalData.forEach(disposal => {
            if (disposal.item) {
                const categoryName = disposal.item.category?.name || 'Unknown';
                const lifespan = disposal.lifespan || 0; // Assuming lifespan is stored in disposal record
                
                if (!lifespanData.has(categoryName)) {
                    lifespanData.set(categoryName, {
                        category: categoryName,
                        totalLifespan: 0,
                        count: 0,
                        averageLifespan: 0
                    });
                }
                
                const data = lifespanData.get(categoryName);
                data.totalLifespan += lifespan;
                data.count += 1;
                data.averageLifespan = data.totalLifespan / data.count;
            }
        });

        return Array.from(lifespanData.values())
            .sort((a, b) => b.averageLifespan - a.averageLifespan);
    } catch (error) {
        console.error('Error calculating average component lifespan:', error);
        return [];
    }
}

// Get component replacement patterns
async function getComponentReplacementPatterns() {
    try {
        const disposalData = await db.Dispose.findAll({
            include: [
                {
                    model: db.Item,
                    as: 'item',
                    attributes: ['id', 'name'],
                    include: [
                        { model: db.Category, as: 'category', attributes: ['id', 'name'] }
                    ]
                }
            ],
            order: [['disposalDate', 'ASC']]
        });

        const patterns = {
            monthlyPatterns: new Map(),
            seasonalPatterns: new Map(),
            reasonPatterns: new Map()
        };

        disposalData.forEach(disposal => {
            if (disposal.item) {
                const category = disposal.item.category?.name || 'Unknown';
                const disposalDate = new Date(disposal.disposalDate);
                const month = disposalDate.getMonth();
                const season = Math.floor(month / 3);
                
                // Monthly patterns
                if (!patterns.monthlyPatterns.has(category)) {
                    patterns.monthlyPatterns.set(category, new Array(12).fill(0));
                }
                patterns.monthlyPatterns.get(category)[month] += disposal.quantity;
                
                // Seasonal patterns
                if (!patterns.seasonalPatterns.has(category)) {
                    patterns.seasonalPatterns.set(category, new Array(4).fill(0));
                }
                patterns.seasonalPatterns.get(category)[season] += disposal.quantity;
                
                // Reason patterns
                const reason = disposal.reason || 'Unknown';
                if (!patterns.reasonPatterns.has(category)) {
                    patterns.reasonPatterns.set(category, new Map());
                }
                const reasonMap = patterns.reasonPatterns.get(category);
                reasonMap.set(reason, (reasonMap.get(reason) || 0) + disposal.quantity);
            }
        });

        return {
            monthlyPatterns: Object.fromEntries(patterns.monthlyPatterns),
            seasonalPatterns: Object.fromEntries(patterns.seasonalPatterns),
            reasonPatterns: Object.fromEntries(
                Array.from(patterns.reasonPatterns.entries()).map(([category, reasons]) => [
                    category,
                    Object.fromEntries(reasons)
                ])
            )
        };
    } catch (error) {
        console.error('Error getting component replacement patterns:', error);
        return { monthlyPatterns: {}, seasonalPatterns: {}, reasonPatterns: {} };
    }
}

// Get comprehensive advanced analytics
async function getAdvancedAnalytics() {
    try {
        // Use Promise.allSettled to handle individual failures gracefully
        const results = await Promise.allSettled([
            getTopUsedCategories(10),
            getMostReplacedComponents(10),
            getAverageComponentLifespan(),
            getComponentReplacementPatterns(),
            getLowStockItems(5),
            getOutOfStockItems(),
            getPendingRequests()
        ]);

        // Extract successful results, use empty arrays for failed ones
        const [
            topCategories,
            mostReplacedComponents,
            averageLifespan,
            replacementPatterns,
            lowStockItems,
            outOfStockItems,
            pendingRequests
        ] = results.map(result => 
            result.status === 'fulfilled' ? result.value : []
        );

        return {
            topCategories,
            mostReplacedComponents,
            averageLifespan,
            replacementPatterns,
            lowStockItems,
            outOfStockItems,
            pendingRequests,
            generatedAt: new Date()
        };
    } catch (error) {
        console.error('Error getting advanced analytics:', error);
        // Return a basic structure even if there's an error
        return {
            topCategories: [],
            mostReplacedComponents: [],
            averageLifespan: [],
            replacementPatterns: { monthlyPatterns: {}, seasonalPatterns: {}, reasonPatterns: {} },
            lowStockItems: [],
            outOfStockItems: [],
            pendingRequests: [],
            generatedAt: new Date()
        };
    }
}

// Get pending requests (approval requests)
async function getPendingRequests() {
    try {
        // First, let's check if ApprovalRequest model exists and has the expected associations
        if (!db.ApprovalRequest) {
            console.log('ApprovalRequest model not found, returning empty array');
            return [];
        }

        // Try to get pending requests without includes first to see the basic structure
        const pendingRequests = await db.ApprovalRequest.findAll({
            where: {
                status: 'pending'
            },
            order: [['createdAt', 'DESC']]
        });

        // Map the results with basic information
        return pendingRequests.map(request => ({
            id: request.id,
            itemName: request.itemName || request.itemName || 'Unknown Item',
            category: request.category || 'Unknown Category',
            quantity: request.quantity || 0,
            reason: request.reason || 'No reason provided',
            requestedBy: request.requestedBy || 'Unknown User',
            requestedAt: request.createdAt,
            priority: request.priority || 'normal'
        }));
    } catch (error) {
        console.error('Error getting pending requests:', error);
        // Return empty array instead of throwing error
        return [];
    }
}

// Automated report scheduling functions
async function getAutomatedReportSchedule() {
    try {
        // This would typically be stored in a database table
        // For now, return a default configuration
        return {
            enabled: false,
            weeklyReports: {
                enabled: false,
                dayOfWeek: 1, // Monday
                time: '09:00',
                recipients: []
            },
            monthlyReports: {
                enabled: false,
                dayOfMonth: 1,
                time: '09:00',
                recipients: []
            },
            lowStockAlerts: {
                enabled: false,
                threshold: 10,
                recipients: []
            },
            outOfStockAlerts: {
                enabled: false,
                recipients: []
            }
        };
    } catch (error) {
        console.error('Error getting automated report schedule:', error);
        throw error;
    }
}

async function setAutomatedReportSchedule(schedule) {
    try {
        // This would typically save to a database table
        // For now, we'll just return success
        console.log('Automated report schedule updated:', schedule);
        return { success: true, message: 'Schedule updated successfully' };
    } catch (error) {
        console.error('Error setting automated report schedule:', error);
        throw error;
    }
}
