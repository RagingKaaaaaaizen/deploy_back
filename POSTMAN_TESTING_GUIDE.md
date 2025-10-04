# Postman Testing Guide for PC Build Templates

## 🚀 Quick Setup

### 1. Import the Collection
1. Open Postman
2. Click "Import" button
3. Select the file: `PC_Build_Template_Postman_Collection.json`
4. The collection will be imported with all test endpoints

### 2. Set Environment Variables
1. In Postman, create a new environment called "Local Development"
2. Add these variables:
   - `baseUrl`: `http://localhost:4000`
   - `authToken`: (leave empty for now)

### 3. Start Your Backend
```bash
cd deploy_back
npm run start:dev
```

## 🧪 Testing Steps (Run in Order)

### Step 1: Basic Health Checks
1. **Health Check** - Should return `{"status": "OK"}`
2. **Test Endpoint** - Should return `{"message": "Server is working!"}`

### Step 2: Diagnostic Test
3. **PC Build Template Diagnostic** - This is the most important test!
   - Should return information about tables and models
   - Look for `"tablesExist": 2` and `"tables": ["PCBuildTemplates", "PCBuildTemplateComponents"]`

### Step 3: Get Data for Testing
4. **Get Categories** - Get category IDs for template creation
5. **Get Items** - Get item IDs for template creation

### Step 4: Authentication (Optional)
6. **Login** - Get auth token for protected endpoints
   - Copy the `jwtToken` from response
   - Update the `authToken` environment variable

### Step 5: Test PC Build Templates
7. **Get All PC Build Templates** - Should return `[]` (empty array)
8. **Create PC Build Template** - Create a test template
9. **Get Template by ID** - Retrieve the created template
10. **Update Template** - Modify the template
11. **Delete Template** - Clean up

## 🔍 What to Look For

### ✅ Success Indicators
- Diagnostic endpoint shows `"tablesExist": 2`
- PC Build Templates endpoint returns `[]` (empty array)
- Creating templates works without errors
- All CRUD operations work

### ❌ Error Indicators
- Diagnostic endpoint shows `"tablesExist": 0`
- PC Build Templates endpoint returns 500 error
- "Table doesn't exist" errors

## 🛠️ Troubleshooting

### If Tables Don't Exist
The auto-migration should create them automatically. If not:

1. Check your backend console for auto-migration messages
2. Look for error messages in the console
3. Try restarting the backend server

### If You Get 500 Errors
1. Check the Response tab in Postman for detailed error messages
2. Check your backend console for error logs
3. Verify your database connection

### If Authentication Fails
1. Make sure you have an admin account in your database
2. Try the default credentials: `admin@example.com` / `admin123`
3. Check if the accounts table has data

## 📝 Sample Test Data

### Categories (should exist in your database):
- ID 1: Central Processing Unit (CPU)
- ID 2: Graphics Processing Unit (GPU)
- ID 3: Random Access Memory (RAM)

### Items (should exist in your database):
- ID 1: Intel Core i7-12700K
- ID 3: NVIDIA GeForce RTX 3070
- ID 5: Samsung DDR4 16GB

## 🎯 Expected Results

### Diagnostic Endpoint Response:
```json
{
  "message": "PC Build Template test endpoint",
  "templateCount": 0,
  "tablesExist": 2,
  "tables": ["PCBuildTemplates", "PCBuildTemplateComponents"],
  "modelsAvailable": {
    "PCBuildTemplate": true,
    "PCBuildTemplateComponent": true
  },
  "timestamp": "2024-01-02T...",
  "status": "OK"
}
```

### Get All Templates Response:
```json
[]
```

### Create Template Response:
```json
{
  "id": 1,
  "name": "Gaming PC Template",
  "description": "High-performance gaming PC configuration",
  "createdBy": 1,
  "createdAt": "2024-01-02T...",
  "updatedAt": "2024-01-02T...",
  "components": [...]
}
```

## 🚀 Next Steps

Once local testing works:
1. Commit your changes
2. Push to repository
3. Deploy to Render
4. Test the same endpoints on production URLs