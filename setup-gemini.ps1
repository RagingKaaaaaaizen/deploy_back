Write-Host "Setting up Gemini AI for PC Parts Comparison..." -ForegroundColor Green
Write-Host ""

# Set the Gemini API key as environment variable
$env:GEMINI_API_KEY = "AIzaSyB54vqGM8AdBLR5r7P9lDc_84abr072HpU"

Write-Host "✅ Gemini API key set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting server with Gemini AI enabled..." -ForegroundColor Yellow
Write-Host ""

# Start the development server
npm run start:dev
