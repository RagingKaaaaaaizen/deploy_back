Write-Host "Setting up DigiKey API and Gemini AI for PC Parts Comparison..." -ForegroundColor Green
Write-Host ""

# Set the Gemini API key as environment variable
$env:GEMINI_API_KEY = "AIzaSyB54vqGM8AdBLR5r7P9lDc_84abr072HpU"

# Set the DigiKey API credentials as environment variables
$env:DIGIKEY_CLIENT_ID = "QccsmyqM1PXUmNZDHiGdAfaUVGr0Piu7faXfUCQkpX0YM6KC"
$env:DIGIKEY_CLIENT_SECRET = "zRj3udVf5jisLp2J8o5MsU29rNduhOVvT1PrMtxjQNdeKODG1KbOGjGyQS3EfMCg"

Write-Host "✅ Gemini API key set successfully!" -ForegroundColor Green
Write-Host "✅ DigiKey API credentials set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting server with DigiKey API and Gemini AI enabled..." -ForegroundColor Yellow
Write-Host ""

# Start the development server with API credentials
npm run start:with-apis
