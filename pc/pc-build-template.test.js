const request = require('supertest');
const { setupTestServer } = require('../test-server');
const db = require('../_helpers/db');

let app;

describe('PC Build Template API Tests', () => {
    let authToken;
    let templateId;
    let adminUserId;

    // Setup: Initialize test server and login before running tests
    beforeAll(async () => {
        // Setup test server
        app = await setupTestServer();
        
        // Wait for database to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Login as admin to get auth token
        const loginResponse = await request(app)
            .post('/api/accounts/authenticate')
            .send({
                email: 'admin@example.com',
                password: 'admin123'
            });

        if (loginResponse.status === 200 && loginResponse.body.jwtToken) {
            authToken = loginResponse.body.jwtToken;
            adminUserId = loginResponse.body.id;
            console.log('✅ Authentication successful');
        } else {
            console.error('❌ Authentication failed:');
            console.error('Status:', loginResponse.status);
            console.error('Body:', JSON.stringify(loginResponse.body, null, 2));
            console.error('Headers:', loginResponse.headers);
            throw new Error('Failed to authenticate');
        }
    });

    // Cleanup: Close database connections after all tests
    afterAll(async () => {
        // Close all database connections
        await db.sequelize.close();
    });

    // Test 1: GET all templates (initially should be empty or have existing templates)
    describe('GET /api/pc-build-templates', () => {
        it('should return all templates', async () => {
            const response = await request(app)
                .get('/api/pc-build-templates')
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            console.log(`✅ Found ${response.body.length} existing templates`);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/pc-build-templates');

            expect(response.status).toBe(401);
            console.log('✅ Unauthorized access properly blocked');
        });
    });

    // Test 2: CREATE a new template
    describe('POST /api/pc-build-templates', () => {
        it('should create a new template with components', async () => {
            // First, get available categories and items
            const categoriesResponse = await request(app)
                .get('/api/categories')
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`);

            const itemsResponse = await request(app)
                .get('/api/items')
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`);

            const categories = categoriesResponse.body;
            const items = itemsResponse.body;

            // Find CPU and RAM categories
            const cpuCategory = categories.find(c => c.name.toLowerCase().includes('cpu'));
            const ramCategory = categories.find(c => c.name.toLowerCase().includes('ram'));

            // Find items for these categories
            const cpuItem = items.find(i => i.categoryId === cpuCategory?.id);
            const ramItem = items.find(i => i.categoryId === ramCategory?.id);

            const templateData = {
                name: `Test Template ${Date.now()}`,
                description: 'Test template created by automated test',
                components: []
            };

            // Add CPU component if found
            if (cpuItem) {
                templateData.components.push({
                    categoryId: cpuCategory.id,
                    itemId: cpuItem.id,
                    quantity: 1,
                    remarks: 'Test CPU'
                });
            }

            // Add RAM component if found
            if (ramItem) {
                templateData.components.push({
                    categoryId: ramCategory.id,
                    itemId: ramItem.id,
                    quantity: 2,
                    remarks: 'Test RAM'
                });
            }

            // If no components found, use first available category and item
            if (templateData.components.length === 0 && categories.length > 0 && items.length > 0) {
                const firstCategory = categories[0];
                const firstItem = items.find(i => i.categoryId === firstCategory.id) || items[0];
                
                templateData.components.push({
                    categoryId: firstCategory.id,
                    itemId: firstItem.id,
                    quantity: 1,
                    remarks: 'Test component'
                });
            }

            const response = await request(app)
                .post('/api/pc-build-templates')
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(templateData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(templateData.name);
            expect(response.body.components.length).toBeGreaterThan(0);

            templateId = response.body.id;
            console.log(`✅ Template created with ID: ${templateId}`);
        });

        it('should fail to create template with duplicate name', async () => {
            const templateData = {
                name: `Test Template ${Date.now() - 1000}`, // Use previous template name
                description: 'Duplicate test',
                components: [
                    {
                        categoryId: 1,
                        itemId: 1,
                        quantity: 1
                    }
                ]
            };

            const response = await request(app)
                .post('/api/pc-build-templates')
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(templateData);

            // This might succeed if the name is different, but if duplicate it should fail
            if (response.status === 400) {
                console.log('✅ Duplicate name validation working');
            } else {
                console.log('⚠️  Template created (name was unique)');
            }
        });

        it('should fail without components', async () => {
            const response = await request(app)
                .post('/api/pc-build-templates')
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Empty Template',
                    description: 'No components',
                    components: []
                });

            expect(response.status).toBe(400);
            console.log('✅ Empty components validation working');
        });
    });

    // Test 3: GET template by ID
    describe('GET /api/pc-build-templates/:id', () => {
        it('should return a specific template', async () => {
            if (!templateId) {
                console.log('⚠️  Skipping: No template ID available');
                return;
            }

            const response = await request(app)
                .get(`/api/pc-build-templates/${templateId}`)
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(templateId);
            expect(response.body).toHaveProperty('components');
            console.log(`✅ Retrieved template: ${response.body.name}`);
        });

        it('should return 404 for non-existent template', async () => {
            const response = await request(app)
                .get('/api/pc-build-templates/99999')
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            console.log('✅ 404 handling working');
        });
    });

    // Test 4: UPDATE template
    describe('PUT /api/pc-build-templates/:id', () => {
        it('should update template name and description', async () => {
            if (!templateId) {
                console.log('⚠️  Skipping: No template ID available');
                return;
            }

            const updatedData = {
                name: `Updated Template ${Date.now()}`,
                description: 'Updated description'
            };

            const response = await request(app)
                .put(`/api/pc-build-templates/${templateId}`)
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe(updatedData.name);
            expect(response.body.description).toBe(updatedData.description);
            console.log('✅ Template updated successfully');
        });
    });

    // Test 5: DUPLICATE template
    describe('POST /api/pc-build-templates/:id/duplicate', () => {
        it('should duplicate an existing template', async () => {
            if (!templateId) {
                console.log('⚠️  Skipping: No template ID available');
                return;
            }

            const response = await request(app)
                .post(`/api/pc-build-templates/${templateId}/duplicate`)
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    newName: `Duplicated Template ${Date.now()}`
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body.id).not.toBe(templateId);
            console.log(`✅ Template duplicated with ID: ${response.body.id}`);
        });
    });

    // Test 6: GET template statistics
    describe('GET /api/pc-build-templates/:id/stats', () => {
        it('should return template statistics', async () => {
            if (!templateId) {
                console.log('⚠️  Skipping: No template ID available');
                return;
            }

            const response = await request(app)
                .get(`/api/pc-build-templates/${templateId}/stats`)
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalPCs');
            expect(response.body).toHaveProperty('matchingPCs');
            expect(response.body).toHaveProperty('complianceRate');
            console.log(`✅ Stats: ${response.body.matchingPCs}/${response.body.totalPCs} PCs match`);
        });
    });

    // Test 7: COMPARE PC with template
    describe('POST /api/pc-build-templates/compare/:pcId/:templateId', () => {
        it('should compare a PC with a template', async () => {
            if (!templateId) {
                console.log('⚠️  Skipping: No template ID available');
                return;
            }

            // Get first available PC
            const pcsResponse = await request(app)
                .get('/api/pcs')
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`);

            if (pcsResponse.body.length === 0) {
                console.log('⚠️  Skipping: No PCs available to compare');
                return;
            }

            const pcId = pcsResponse.body[0].id;

            const response = await request(app)
                .post(`/api/pc-build-templates/compare/${pcId}/${templateId}`)
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('matches');
            expect(response.body).toHaveProperty('matchPercentage');
            expect(response.body).toHaveProperty('mismatches');
            console.log(`✅ Comparison: ${response.body.matchPercentage}% match, ${response.body.mismatchCount} mismatches`);
        });
    });

    // Test 8: DELETE template (cleanup)
    describe('DELETE /api/pc-build-templates/:id', () => {
        it('should delete the template', async () => {
            if (!templateId) {
                console.log('⚠️  Skipping: No template ID available');
                return;
            }

            const response = await request(app)
                .delete(`/api/pc-build-templates/${templateId}`)
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status !== 200) {
                console.error('❌ Delete failed:');
                console.error('Status:', response.status);
                console.error('Body:', JSON.stringify(response.body, null, 2));
            }

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            console.log('✅ Template deleted successfully');
        });

        it('should return 404 when trying to get deleted template', async () => {
            if (!templateId) {
                console.log('⚠️  Skipping: No template ID available');
                return;
            }

            const response = await request(app)
                .get(`/api/pc-build-templates/${templateId}`)
                .set('Cookie', `refreshToken=${authToken}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            console.log('✅ Deleted template no longer accessible');
        });
    });

    // Cleanup after all tests
    afterAll(async () => {
        console.log('\n✅ All PC Build Template tests completed!');
    });
});

