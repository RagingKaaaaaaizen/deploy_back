-- Sample Data for Computer Lab Inventory Management System (Single User Version)
-- Insert sample data with only one admin account

USE amp;

-- 1. Insert only the admin account (matching add-required-data.js)
INSERT INTO accounts (id, title, firstName, lastName, email, passwordHash, acceptTerms, role, verified, status) VALUES
(1, 'Mr.', 'Admin', 'User', 'admin@example.com', '$2a$10$rQZ8vK8vK8vK8vK8vK8vK8vK8vK8vK8vK8vK8vK8vK8vK8vK8vK8', TRUE, 'SuperAdmin', NOW(), 'Active');

-- 2. Insert sample brands
INSERT INTO brands (id, name, description) VALUES
(1, 'Intel', 'Intel Corporation - CPU and chipset manufacturer'),
(2, 'AMD', 'Advanced Micro Devices - CPU and GPU manufacturer'),
(3, 'NVIDIA', 'NVIDIA Corporation - GPU manufacturer'),
(4, 'Samsung', 'Samsung Electronics - Memory and storage manufacturer'),
(5, 'Western Digital', 'Western Digital - Storage device manufacturer'),
(6, 'Seagate', 'Seagate Technology - Storage device manufacturer'),
(7, 'ASUS', 'ASUS - Motherboard and computer hardware manufacturer'),
(8, 'MSI', 'MSI - Motherboard and graphics card manufacturer'),
(9, 'Gigabyte', 'Gigabyte Technology - Motherboard and graphics card manufacturer'),
(10, 'Corsair', 'Corsair - Memory, power supply, and cooling manufacturer'),
(11, 'Kingston', 'Kingston Technology - Memory and storage manufacturer'),
(12, 'Crucial', 'Crucial - Memory and storage manufacturer'),
(13, 'Logitech', 'Logitech - Computer peripherals manufacturer'),
(14, 'Razer', 'Razer - Gaming peripherals manufacturer'),
(15, 'Other', 'Other manufacturers');

-- 3. Insert sample categories
INSERT INTO categories (id, name, description) VALUES
(1, 'Central Processing Unit (CPU)', 'Computer processors'),
(2, 'Graphics Processing Unit (GPU)', 'Graphics cards and video processors'),
(3, 'Random Access Memory (RAM)', 'Computer memory modules'),
(4, 'Storage Device', 'Hard drives, SSDs, and storage devices'),
(5, 'Motherboard', 'Main computer circuit boards'),
(6, 'Power Supply Unit (PSU)', 'Computer power supplies'),
(7, 'Computer Case', 'Computer chassis and cases'),
(8, 'Monitor', 'Computer displays and monitors'),
(9, 'Keyboard', 'Computer keyboards'),
(10, 'Mouse', 'Computer mice and pointing devices'),
(11, 'Network Card', 'Network interface cards'),
(12, 'Sound Card', 'Audio interface cards'),
(13, 'Cooling System', 'CPU coolers, fans, and cooling systems'),
(14, 'Other', 'Other computer components');

-- 4. Insert sample storage locations
INSERT INTO storage_locations (id, name, description) VALUES
(1, 'Storage Room 1', 'Main storage room for computer components'),
(2, 'Storage Room 2', 'Secondary storage room for accessories'),
(3, 'Warehouse', 'Main warehouse for bulk storage'),
(4, 'Office Storage', 'Office storage area for small items'),
(5, 'Lab Storage', 'Computer lab storage cabinet');

-- 5. Insert sample room locations
INSERT INTO room_locations (id, name, description, createdBy) VALUES
(1, 'Computer Lab Front', 'Front area of the computer lab', 1),
(2, 'Computer Lab Back', 'Back area of the computer lab', 1),
(3, 'Server Room', 'Server and networking equipment room', 1),
(4, 'Training Room', 'Training and presentation room', 1),
(5, 'Office Area', 'Administrative office area', 1);

-- 6. Insert sample items
INSERT INTO items (id, categoryId, brandId, brandName, name, description) VALUES
(1, 1, 1, 'Intel', 'Intel Core i7-12700K', '12th Gen Intel Core i7 processor'),
(2, 1, 2, 'AMD', 'AMD Ryzen 7 5800X', 'AMD Ryzen 7 processor'),
(3, 2, 3, 'NVIDIA', 'NVIDIA GeForce RTX 3070', 'NVIDIA RTX 3070 graphics card'),
(4, 2, 3, 'NVIDIA', 'NVIDIA GeForce RTX 3080', 'NVIDIA RTX 3080 graphics card'),
(5, 3, 4, 'Samsung', 'Samsung DDR4 16GB', '16GB DDR4 memory module'),
(6, 3, 10, 'Corsair', 'Corsair Vengeance 32GB', '32GB DDR4 memory kit'),
(7, 4, 4, 'Samsung', 'Samsung 980 PRO 1TB', '1TB NVMe SSD'),
(8, 4, 5, 'Western Digital', 'WD Blue 2TB HDD', '2TB SATA hard drive'),
(9, 5, 7, 'ASUS', 'ASUS ROG Strix B550-F', 'AMD B550 motherboard'),
(10, 5, 8, 'MSI', 'MSI MPG Z590', 'Intel Z590 motherboard'),
(11, 6, 10, 'Corsair', 'Corsair RM750x', '750W 80+ Gold power supply'),
(12, 7, 7, 'ASUS', 'ASUS TUF Gaming Case', 'Mid-tower gaming case'),
(13, 8, 7, 'ASUS', 'ASUS VG248QE', '24-inch 144Hz gaming monitor'),
(14, 9, 13, 'Logitech', 'Logitech G Pro Keyboard', 'Mechanical gaming keyboard'),
(15, 10, 13, 'Logitech', 'Logitech G Pro Mouse', 'Gaming mouse');

-- 7. Insert sample stocks
INSERT INTO stocks (id, itemId, quantity, locationId, price, totalPrice, remarks, createdBy) VALUES
(1, 1, 5, 1, 399.99, 1999.95, 'New Intel processors', 1),
(2, 2, 3, 1, 349.99, 1049.97, 'AMD processors for workstations', 1),
(3, 3, 8, 1, 599.99, 4799.92, 'RTX 3070 for gaming PCs', 1),
(4, 4, 4, 1, 799.99, 3199.96, 'RTX 3080 for high-end builds', 1),
(5, 5, 20, 2, 89.99, 1799.80, 'Samsung memory modules', 1),
(6, 6, 10, 2, 199.99, 1999.90, 'Corsair memory kits', 1),
(7, 7, 15, 2, 149.99, 2249.85, 'Samsung SSDs for fast storage', 1),
(8, 8, 12, 3, 69.99, 839.88, 'WD hard drives for bulk storage', 1),
(9, 9, 6, 1, 179.99, 1079.94, 'ASUS motherboards', 1),
(10, 10, 4, 1, 199.99, 799.96, 'MSI motherboards', 1),
(11, 11, 8, 1, 129.99, 1039.92, 'Corsair power supplies', 1),
(12, 12, 10, 3, 89.99, 899.90, 'ASUS computer cases', 1),
(13, 13, 15, 4, 249.99, 3749.85, 'ASUS gaming monitors', 1),
(14, 14, 25, 4, 129.99, 3249.75, 'Logitech keyboards', 1),
(15, 15, 30, 4, 79.99, 2399.70, 'Logitech mice', 1);

-- 8. Insert sample PCs
INSERT INTO pcs (id, name, serialNumber, roomLocationId, status, assignedTo, notes, createdBy) VALUES
(1, 'Gaming PC 1', 'PC001', 1, 'Active', 'Student Lab', 'High-end gaming PC', 1),
(2, 'Workstation 1', 'PC002', 1, 'Active', 'Faculty Office', 'Professional workstation', 1),
(3, 'Training PC 1', 'PC003', 4, 'Active', 'Training Room', 'PC for training sessions', 1),
(4, 'Server PC 1', 'PC004', 3, 'Active', 'IT Department', 'Server for lab management', 1),
(5, 'Backup PC 1', 'PC005', 2, 'Inactive', 'Storage', 'Backup PC for emergencies', 1);

-- 9. Insert sample PC components
INSERT INTO pc_components (id, pcId, itemId, stockId, quantity, createdBy) VALUES
(1, 1, 1, 1, 1, 1), -- Gaming PC 1 has Intel i7
(2, 1, 3, 3, 1, 1), -- Gaming PC 1 has RTX 3070
(3, 1, 5, 5, 2, 1), -- Gaming PC 1 has 2x 16GB RAM
(4, 1, 7, 7, 1, 1), -- Gaming PC 1 has 1TB SSD
(5, 1, 9, 9, 1, 1), -- Gaming PC 1 has ASUS motherboard
(6, 1, 11, 11, 1, 1), -- Gaming PC 1 has Corsair PSU
(7, 1, 12, 12, 1, 1), -- Gaming PC 1 has ASUS case
(8, 2, 2, 2, 1, 1), -- Workstation 1 has AMD Ryzen
(9, 2, 4, 4, 1, 1), -- Workstation 1 has RTX 3080
(10, 2, 6, 6, 1, 1), -- Workstation 1 has 32GB RAM
(11, 2, 7, 7, 2, 1), -- Workstation 1 has 2x 1TB SSD
(12, 2, 10, 10, 1, 1), -- Workstation 1 has MSI motherboard
(13, 2, 11, 11, 1, 1), -- Workstation 1 has Corsair PSU
(14, 2, 12, 12, 1, 1); -- Workstation 1 has ASUS case

-- 10. Insert sample specification fields
INSERT INTO specification_fields (id, categoryId, fieldName, fieldType, isRequired, options) VALUES
(1, 1, 'Cores', 'number', TRUE, NULL),
(2, 1, 'Threads', 'number', TRUE, NULL),
(3, 1, 'Base Clock', 'number', TRUE, NULL),
(4, 1, 'Socket Type', 'select', TRUE, '["LGA1700", "AM4", "LGA1200", "AM5"]'),
(5, 2, 'VRAM', 'number', TRUE, NULL),
(6, 2, 'Memory Type', 'select', TRUE, '["GDDR6", "GDDR6X", "GDDR5"]'),
(7, 2, 'Memory Bus', 'number', TRUE, NULL),
(8, 3, 'Capacity', 'number', TRUE, NULL),
(9, 3, 'Speed', 'number', TRUE, NULL),
(10, 3, 'Type', 'select', TRUE, '["DDR4", "DDR5"]'),
(11, 4, 'Capacity', 'number', TRUE, NULL),
(12, 4, 'Interface', 'select', TRUE, '["SATA", "NVMe", "M.2"]'),
(13, 4, 'Form Factor', 'select', TRUE, '["2.5 inch", "3.5 inch", "M.2"]');

-- 11. Insert sample disposes
INSERT INTO disposes (id, itemId, quantity, disposalValue, totalValue, locationId, reason, disposalDate, createdBy, returnedToStock) VALUES
(1, 8, 2, 20.00, 40.00, 3, 'Old hard drives no longer needed', '2024-01-15 10:30:00', 1, FALSE),
(2, 5, 1, 30.00, 30.00, 2, 'Faulty memory module', '2024-01-20 14:15:00', 1, FALSE),
(3, 15, 3, 15.00, 45.00, 4, 'Worn out mice', '2024-02-01 09:45:00', 1, FALSE);

-- 12. Insert sample activity logs
INSERT INTO activity_logs (id, userId, action, entityType, entityId, details, ipAddress, userAgent) VALUES
(1, 1, 'CREATE', 'Stock', 1, '{"itemName": "Intel Core i7-12700K", "quantity": 5}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(2, 1, 'CREATE', 'PC', 1, '{"pcName": "Gaming PC 1", "serialNumber": "PC001"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(3, 1, 'UPDATE', 'Stock', 1, '{"oldQuantity": 5, "newQuantity": 4}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
(4, 1, 'CREATE', 'Dispose', 1, '{"itemName": "WD Blue 2TB HDD", "quantity": 2}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- 13. Insert sample approval requests
INSERT INTO approval_requests (id, type, status, requestData, createdBy, approvedBy, approvedAt, remarks) VALUES
(1, 'stock', 'approved', '{"itemId": 1, "quantity": 10, "locationId": 1, "price": 399.99}', 1, 1, '2024-01-10 15:30:00', 'Approved for lab expansion'),
(2, 'dispose', 'pending', '{"itemId": 8, "quantity": 5, "reason": "Old hard drives", "locationId": 3}', 1, NULL, NULL, NULL),
(3, 'stock', 'rejected', '{"itemId": 3, "quantity": 20, "locationId": 1, "price": 599.99}', 1, 1, '2024-01-12 10:15:00', 'Budget constraints');

-- Update stock quantities to reflect PC component usage
UPDATE stocks SET quantity = quantity - 1 WHERE id IN (1, 3, 5, 7, 9, 11, 12); -- Gaming PC 1 components
UPDATE stocks SET quantity = quantity - 1 WHERE id IN (2, 4, 6, 7, 10, 11, 12); -- Workstation 1 components

-- Reset auto increment values
ALTER TABLE accounts AUTO_INCREMENT = 2;
ALTER TABLE brands AUTO_INCREMENT = 16;
ALTER TABLE categories AUTO_INCREMENT = 15;
ALTER TABLE storage_locations AUTO_INCREMENT = 6;
ALTER TABLE room_locations AUTO_INCREMENT = 6;
ALTER TABLE items AUTO_INCREMENT = 16;
ALTER TABLE stocks AUTO_INCREMENT = 16;
ALTER TABLE pcs AUTO_INCREMENT = 6;
ALTER TABLE pc_components AUTO_INCREMENT = 15;
ALTER TABLE specification_fields AUTO_INCREMENT = 14;
ALTER TABLE disposes AUTO_INCREMENT = 4;
ALTER TABLE activity_logs AUTO_INCREMENT = 5;
ALTER TABLE approval_requests AUTO_INCREMENT = 4;
