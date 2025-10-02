-- SQL Script to Create PC Build Template Tables
-- This script adds the missing PCBuildTemplates and PCBuildTemplateComponents tables
-- to your existing database

-- ==============================================
-- PC BUILD TEMPLATE TABLES CREATION
-- ==============================================

-- 1. Create PCBuildTemplates table
CREATE TABLE IF NOT EXISTS PCBuildTemplates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    createdBy INT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_name (name),
    INDEX idx_createdBy (createdBy),
    INDEX idx_createdAt (createdAt),
    
    -- Foreign key constraint (optional - can be added later if needed)
    -- FOREIGN KEY (createdBy) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create PCBuildTemplateComponents table
CREATE TABLE IF NOT EXISTS PCBuildTemplateComponents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    templateId INT NOT NULL,
    categoryId INT NOT NULL,
    itemId INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    remarks TEXT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_templateId (templateId),
    INDEX idx_categoryId (categoryId),
    INDEX idx_itemId (itemId),
    
    -- Unique constraint to prevent duplicate category per template
    UNIQUE KEY unique_template_category (templateId, categoryId),
    
    -- Foreign key constraints (optional - can be added later if needed)
    -- FOREIGN KEY (templateId) REFERENCES PCBuildTemplates(id) ON DELETE CASCADE,
    -- FOREIGN KEY (categoryId) REFERENCES categories(id),
    -- FOREIGN KEY (itemId) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check if tables were created successfully
SELECT 'PCBuildTemplates' as table_name, COUNT(*) as record_count FROM PCBuildTemplates
UNION ALL
SELECT 'PCBuildTemplateComponents', COUNT(*) FROM PCBuildTemplateComponents;

-- Show table structure
DESCRIBE PCBuildTemplates;
DESCRIBE PCBuildTemplateComponents;

-- ==============================================
-- SETUP COMPLETE
-- ==============================================

SELECT 'PC Build Template tables created successfully!' as status;
SELECT 'You can now create PC build templates in your application.' as next_step;
