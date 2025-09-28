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
    generateReport
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
        const { startDate, endDate, includeStocks, includeDisposals, includePCs } = request;
        
        const reportData = {
            stocks: [],
            disposals: [],
            pcs: [],
            summary: {
                totalStocks: 0,
                totalDisposals: 0,
                totalPCs: 0,
                totalValue: 0
            }
        };

        // Get stocks data
        if (includeStocks) {
            const stocks = await db.Stock.findAll({
                include: [
                    { 
                        model: db.Item, 
                        as: 'item', 
                        attributes: ['id', 'name', 'description'],
                        include: [
                            { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                            { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                        ]
                    },
                    { model: db.StorageLocation, as: 'location', attributes: ['id', 'name', 'description'] }
                ],
                order: [['createdAt', 'DESC']]
            });

            reportData.stocks = stocks.map(stock => ({
                id: stock.id,
                itemName: stock.item?.name || 'Unknown Item',
                categoryName: stock.item?.category?.name || 'Unknown Category',
                brandName: stock.item?.brand?.name || 'Unknown Brand',
                quantity: stock.quantity,
                locationName: stock.location?.name || 'Unknown Location',
                totalPrice: stock.totalPrice,
                price: stock.price,
                createdAt: stock.createdAt
            }));

            reportData.summary.totalStocks = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
            reportData.summary.totalValue = stocks.reduce((sum, stock) => sum + (stock.totalPrice || 0), 0);
        }

        return reportData;
    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
}
