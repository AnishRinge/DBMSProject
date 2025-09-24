@echo off
echo ========================================
echo MySQL XAMPP Troubleshoot Script
echo ========================================
echo.

echo 1. Checking port 3306 usage...
netstat -ano | findstr :3306
if %errorlevel% equ 0 (
    echo WARNING: Port 3306 is in use!
) else (
    echo Port 3306 is available.
)
echo.

echo 2. Checking for MySQL processes...
tasklist | findstr /i mysql
echo.

echo 3. Checking for MySQL services...
sc query type= service | findstr /i MySQL
echo.

echo 4. Checking XAMPP MySQL error log...
if exist "C:\xampp\mysql\data\mysql_error.log" (
    echo Last 10 lines of MySQL error log:
    powershell "Get-Content 'C:\xampp\mysql\data\mysql_error.log' | Select-Object -Last 10"
) else (
    echo MySQL error log not found at default location.
)
echo.

echo ========================================
echo SOLUTIONS:
echo 1. Run XAMPP as Administrator
echo 2. Stop conflicting services: net stop MySQL
echo 3. Change port in my.ini to 3307
echo 4. Reset MySQL data directory
echo ========================================
pause