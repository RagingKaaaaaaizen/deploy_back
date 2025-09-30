@echo off
echo Setting up DigiKey API and Gemini AI for PC Parts Comparison...
echo.

REM Set the Gemini API key as environment variable
set GEMINI_API_KEY=AIzaSyB54vqGM8AdBLR5r7P9lDc_84abr072HpU

REM Set the DigiKey API credentials as environment variables
set DIGIKEY_CLIENT_ID=QccsmyqM1PXUmNZDHiGdAfaUVGr0Piu7faXfUCQkpX0YM6KC
set DIGIKEY_CLIENT_SECRET=zRj3udVf5jisLp2J8o5MsU29rNduhOVvT1PrMtxjQNdeKODG1KbOGjGyQS3EfMCg

echo ✅ Gemini API key set successfully!
echo ✅ DigiKey API credentials set successfully!
echo.
echo Starting server with DigiKey API and Gemini AI enabled...
echo.

REM Start the development server with API credentials
npm run start:with-apis

pause
