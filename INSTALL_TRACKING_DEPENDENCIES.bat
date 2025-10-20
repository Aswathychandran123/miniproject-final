@echo off
echo ========================================
echo Installing Swiggy-Style Tracking Dependencies
echo ========================================
echo.

echo Step 1: Installing Frontend Dependencies...
cd disaster-resource-frontend
call npm install react-leaflet leaflet

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Restart backend: cd disaster-resource-backend && npm run dev
echo 2. Restart frontend: cd disaster-resource-frontend && npm start
echo 3. Test the live tracking feature!
echo.
echo See SWIGGY_STYLE_TRACKING_SETUP.md for testing guide
echo.
pause
