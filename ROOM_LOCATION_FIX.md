# Room Location Fix Instructions

## Problem
The PC creation is failing with a foreign key constraint error because the `roomLocationId` being sent from the frontend doesn't exist in the backend database.

## Error Details
```
Error creating PC: Cannot add or update a child row: a foreign key constraint fails 
('u875409848_vilar'.'PCs', CONSTRAINT 'PCs_ibfk_55' FOREIGN KEY ('roomLocationId') REFERENCES 'RoomLocations' ('id') ON DELETE CASCADE ON UPDATE CASCADE)
```

## Solution Steps

### Step 1: Check Current Database State
```bash
cd "Computer-Lab-Inventor-Backend"
node check-database.js
```

This will show you:
- What room locations currently exist in your database
- What PCs exist (if any)
- Foreign key constraint information

### Step 2: Fix Room Locations (if needed)
If the check shows no room locations, run:
```bash
node fix-room-locations.js
```

This will:
- Create the roomLocations table if it doesn't exist
- Add default room locations with IDs 1, 2, 3, 4, 5
- Verify the setup

### Step 3: Verify the Fix
```bash
node check-database.js
```

Should now show room locations like:
```
ID: 1 | Name: "Computer Lab Front" | Description: "Front area of the computer lab"
ID: 2 | Name: "Computer Lab Back" | Description: "Back area of the computer lab"
ID: 3 | Name: "Server Room" | Description: "Server and networking equipment room"
ID: 4 | Name: "Training Room" | Description: "Training and presentation room"
ID: 5 | Name: "Storage Area" | Description: "Equipment storage area"
```

### Step 4: Test PC Creation
Go back to your frontend and try creating a PC again. The room location dropdown should now work with the available room locations.

## Alternative: Quick Database Fix
If you have database access, you can manually run:
```sql
INSERT INTO roomLocations (name, description, createdBy) VALUES
('Computer Lab Front', 'Front area of the computer lab', 1),
('Computer Lab Back', 'Back area of the computer lab', 1),
('Server Room', 'Server and networking equipment room', 1),
('Training Room', 'Training and presentation room', 1),
('Storage Area', 'Equipment storage area', 1);
```

## Expected Result
After fixing, PC creation should work without foreign key constraint errors.
