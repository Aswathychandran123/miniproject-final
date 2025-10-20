@echo off
echo ═══════════════════════════════════════════════════════════
echo 🧠 SMART MATCHING SYSTEM - COMPLETE DEMO
echo ═══════════════════════════════════════════════════════════
echo.
echo This will run a complete demonstration of the Smart Matching Algorithm
echo.
pause
echo.
echo ═══════════════════════════════════════════════════════════
echo STEP 1: Setting up test data...
echo ═══════════════════════════════════════════════════════════
echo.
node setupSmartMatchingTest.js
echo.
pause
echo.
echo ═══════════════════════════════════════════════════════════
echo STEP 2: Running smart matching tests...
echo ═══════════════════════════════════════════════════════════
echo.
node testSmartMatching.js
echo.
pause
echo.
echo ═══════════════════════════════════════════════════════════
echo STEP 3: Verifying analytics...
echo ═══════════════════════════════════════════════════════════
echo.
node verifyMatchingAnalytics.js
echo.
echo ═══════════════════════════════════════════════════════════
echo ✅ DEMO COMPLETE!
echo ═══════════════════════════════════════════════════════════
echo.
echo Next steps:
echo 1. Start backend: npm run dev
echo 2. Start frontend: cd ../disaster-resource-frontend ^&^& npm start
echo 3. Login and test via web interface
echo.
pause
