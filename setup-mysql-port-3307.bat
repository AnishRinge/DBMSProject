@echo off
echo ========================================
echo MySQL Port 3307 Setup Script
echo ========================================
echo.

echo Step 1: Killing any running MySQL processes...
taskkill /f /im mysqld.exe 2>nul
if %errorlevel% equ 0 (
    echo MySQL process killed successfully.
) else (
    echo No MySQL process found running.
)

echo.
echo Step 2: Stopping MySQL services...
net stop MySQL 2>nul
net stop MySQL80 2>nul
echo Services stopped (or were not running).

echo.
echo Step 3: Checking if port 3307 is available...
netstat -ano | findstr :3307
if %errorlevel% equ 0 (
    echo WARNING: Port 3307 is already in use!
) else (
    echo Port 3307 is available for MySQL.
)

echo.
echo ========================================
echo NEXT STEPS:
echo 1. Configure MySQL port 3307 in XAMPP my.ini
echo 2. Update phpMyAdmin config for port 3307  
echo 3. Start XAMPP as Administrator
echo 4. Test: http://localhost/phpmyadmin
echo ========================================
pause