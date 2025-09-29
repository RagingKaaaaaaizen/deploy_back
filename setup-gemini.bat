@echo off
echo Setting up Gemini AI for PC Parts Comparison...
echo.

REM Set the Gemini API key as environment variable
set GEMINI_API_KEY=AIzaSyB54vqGM8AdBLR5r7P9lDc_84abr072HpU

echo ✅ Gemini API key set successfully!
echo.
echo Starting server with Gemini AI enabled...
echo.

REM Start the development server
npm run start:dev

pause
