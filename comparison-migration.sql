-- =============================================
-- PC Parts Comparison Feature Database Migration
-- =============================================

-- Create database if it doesn't exist (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS your_database_name;
-- USE your_database_name;

-- =============================================
-- NEW TABLES FOR COMPARISON FEATURE
-- =============================================

-- 1. Part Specifications Table
-- Stores detailed technical specifications for PC components
CREATE TABLE IF NOT EXISTS part_specifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    itemId INT NOT NULL,
    specName VARCHAR(100) NOT NULL,
    specValue TEXT,
    specUnit VARCHAR(50),
    source ENUM('manual', 'pcpartpicker', 'amazon', 'newegg', 'scraped') DEFAULT 'pcpartpicker',
    confidence DECIMAL(3,2) DEFAULT 1.0 COMMENT 'AI confidence score for this specification',
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_item_spec (itemId, specName),
    INDEX idx_source (source),
    INDEX idx_last_updated (lastUpdated)
);

-- 2. API Cache Table
-- Caches external API responses to reduce API calls and improve performance
CREATE TABLE IF NOT EXISTS api_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partIdentifier VARCHAR(200) NOT NULL COMMENT 'Unique identifier for the part (model number, UPC, etc.)',
    apiProvider VARCHAR(50) NOT NULL COMMENT 'Which API provided this data',
    cachedData JSON NOT NULL COMMENT 'The cached API response data',
    expiresAt DATETIME NOT NULL COMMENT 'When this cache entry expires',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cache (partIdentifier, apiProvider),
    INDEX idx_expires (expiresAt),
    INDEX idx_provider (apiProvider)
);

-- 3. Comparison History Table
-- Stores comparison results and AI-generated summaries
CREATE TABLE IF NOT EXISTS comparison_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    part1Id INT NOT NULL COMMENT 'First part being compared',
    part2Id INT NOT NULL COMMENT 'Second part being compared',
    comparisonType ENUM('inventory_vs_inventory', 'inventory_vs_pc', 'inventory_vs_online') NOT NULL,
    comparisonResult JSON COMMENT 'Detailed comparison results',
    aiSummary TEXT COMMENT 'AI-generated user-friendly summary',
    aiRecommendation ENUM('part1_better', 'part2_better', 'similar', 'incompatible') COMMENT 'AI recommendation',
    confidence DECIMAL(3,2) DEFAULT 0.0 COMMENT 'AI confidence in the comparison',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (part1Id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (part2Id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_user_history (userId, createdAt),
    INDEX idx_comparison_type (comparisonType),
    INDEX idx_created_at (createdAt)
);

-- 4. Part Categories Extended Table
-- Extended categories for better part matching and comparison
CREATE TABLE IF NOT EXISTS part_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoryId INT NOT NULL COMMENT 'References existing categories table',
    subcategory VARCHAR(100) COMMENT 'More specific category (e.g., Gaming Mouse, Mechanical Keyboard)',
    comparisonGroup VARCHAR(100) COMMENT 'Group for comparison purposes',
    specTemplate JSON COMMENT 'Template of specifications for this category',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category (categoryId),
    INDEX idx_comparison_group (comparisonGroup)
);

-- 5. AI Service Configuration Table
-- Configuration for AI services and prompts
CREATE TABLE IF NOT EXISTS ai_service_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serviceName VARCHAR(50) NOT NULL UNIQUE,
    apiKey VARCHAR(500) COMMENT 'Encrypted API key',
    baseUrl VARCHAR(200),
    model VARCHAR(100),
    maxTokens INT DEFAULT 1000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    promptTemplate TEXT,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_service_name (serviceName),
    INDEX idx_is_active (isActive)
);

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample part specifications
INSERT INTO part_specifications (itemId, specName, specValue, specUnit, source, confidence) VALUES
(1, 'Processor Cores', '6', 'cores', 'pcpartpicker', 0.95),
(1, 'Base Clock', '2.5', 'GHz', 'pcpartpicker', 0.90),
(1, 'TDP', '65', 'W', 'pcpartpicker', 0.85),
(2, 'Screen Size', '15.6', 'inches', 'pcpartpicker', 0.95),
(2, 'Resolution', '1920x1080', 'pixels', 'pcpartpicker', 0.90),
(3, 'Connection Type', 'USB', 'wired', 'manual', 1.0),
(3, 'Key Type', 'Membrane', 'type', 'manual', 1.0);

-- Insert sample AI service configuration
INSERT INTO ai_service_config (serviceName, baseUrl, model, promptTemplate, isActive) VALUES
('openai_gpt4', 'https://api.openai.com/v1', 'gpt-4', 'You are a helpful assistant that compares PC hardware components. Provide clear, non-technical explanations...', TRUE),
('openai_gpt35', 'https://api.openai.com/v1', 'gpt-3.5-turbo', 'You are a helpful assistant that compares PC hardware components. Provide clear, non-technical explanations...', TRUE);

-- Insert sample part categories
INSERT INTO part_categories (categoryId, subcategory, comparisonGroup, specTemplate) VALUES
(1, 'Desktop CPU', 'Processors', '{"cores": "number", "threads": "number", "base_clock": "frequency", "boost_clock": "frequency", "tdp": "power"}'),
(1, 'Laptop CPU', 'Processors', '{"cores": "number", "threads": "number", "base_clock": "frequency", "boost_clock": "frequency", "tdp": "power"}'),
(2, 'Gaming Mouse', 'Mice', '{"dpi": "number", "connection": "text", "buttons": "number", "weight": "weight"}'),
(2, 'Office Mouse', 'Mice', '{"dpi": "number", "connection": "text", "buttons": "number", "weight": "weight"}');

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Additional indexes for better query performance
CREATE INDEX idx_part_specs_item_spec ON part_specifications(itemId, specName, source);
CREATE INDEX idx_api_cache_expires_provider ON api_cache(expiresAt, apiProvider);
CREATE INDEX idx_comparison_history_type_created ON comparison_history(comparisonType, createdAt);

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for parts with specifications
CREATE VIEW parts_with_specs AS
SELECT 
    i.id,
    i.name,
    i.description,
    c.name as categoryName,
    b.name as brandName,
    COUNT(ps.id) as specCount,
    MAX(ps.lastUpdated) as lastSpecUpdate
FROM items i
JOIN categories c ON i.categoryId = c.id
JOIN brands b ON i.brandId = b.id
LEFT JOIN part_specifications ps ON i.id = ps.itemId
GROUP BY i.id, i.name, i.description, c.name, b.name;

-- View for comparison history with user details
CREATE VIEW comparison_history_details AS
SELECT 
    ch.id,
    ch.comparisonType,
    ch.aiSummary,
    ch.aiRecommendation,
    ch.confidence,
    ch.createdAt,
    u.firstName,
    u.lastName,
    p1.name as part1Name,
    p2.name as part2Name
FROM comparison_history ch
JOIN accounts u ON ch.userId = u.id
JOIN items p1 ON ch.part1Id = p1.id
JOIN items p2 ON ch.part2Id = p2.id;

-- =============================================
-- STORED PROCEDURES
-- =============================================

DELIMITER //

-- Procedure to get part specifications
CREATE PROCEDURE GetPartSpecifications(IN item_id INT)
BEGIN
    SELECT 
        specName,
        specValue,
        specUnit,
        source,
        confidence,
        lastUpdated
    FROM part_specifications
    WHERE itemId = item_id
    ORDER BY confidence DESC, specName;
END //

-- Procedure to clean expired cache
CREATE PROCEDURE CleanExpiredCache()
BEGIN
    DELETE FROM api_cache WHERE expiresAt < NOW();
    SELECT ROW_COUNT() as deleted_rows;
END //

-- Procedure to get comparison suggestions
CREATE PROCEDURE GetComparisonSuggestions(IN item_id INT)
BEGIN
    SELECT 
        i.id,
        i.name,
        b.name as brandName,
        c.name as categoryName,
        COUNT(ch.id) as comparisonCount
    FROM items i
    JOIN brands b ON i.brandId = b.id
    JOIN categories c ON i.categoryId = c.id
    LEFT JOIN comparison_history ch ON (ch.part1Id = item_id AND ch.part2Id = i.id) 
                                   OR (ch.part1Id = i.id AND ch.part2Id = item_id)
    WHERE i.id != item_id 
      AND i.categoryId = (SELECT categoryId FROM items WHERE id = item_id)
    GROUP BY i.id, i.name, b.name, c.name
    ORDER BY comparisonCount DESC, i.name
    LIMIT 10;
END //

DELIMITER ;

-- =============================================
-- TRIGGERS FOR DATA INTEGRITY
-- =============================================

DELIMITER //

-- Trigger to update lastUpdated when specifications change
CREATE TRIGGER update_spec_timestamp
BEFORE UPDATE ON part_specifications
FOR EACH ROW
BEGIN
    SET NEW.lastUpdated = CURRENT_TIMESTAMP;
END //

-- Trigger to clean old comparison history (keep only last 1000 per user)
CREATE TRIGGER cleanup_old_comparisons
AFTER INSERT ON comparison_history
FOR EACH ROW
BEGIN
    DELETE FROM comparison_history 
    WHERE userId = NEW.userId 
      AND id NOT IN (
          SELECT id FROM (
              SELECT id FROM comparison_history 
              WHERE userId = NEW.userId 
              ORDER BY createdAt DESC 
              LIMIT 1000
          ) as keep_records
      );
END //

DELIMITER ;

-- =============================================
-- SAMPLE QUERIES FOR TESTING
-- =============================================

-- Query 1: Get all specifications for a part
-- SELECT * FROM parts_with_specs WHERE id = 1;

-- Query 2: Get comparison history for a user
-- SELECT * FROM comparison_history_details WHERE firstName = 'John' ORDER BY createdAt DESC;

-- Query 3: Get expired cache entries
-- SELECT COUNT(*) as expired_entries FROM api_cache WHERE expiresAt < NOW();

-- Query 4: Get parts that need specification updates
-- SELECT DISTINCT itemId FROM part_specifications WHERE lastUpdated < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT 'PC Parts Comparison feature database migration completed successfully!' as message;
