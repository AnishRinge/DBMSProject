@echo off
echo Starting XAMPP MySQL Service...
echo.

REM Stop any existing MySQL processes
taskkill /F /IM mysqld.exe 2>nul

REM Start MySQL using XAMPP
echo Starting MySQL via XAMPP...
cd /d "C:\xampp"
start /min xampp_start.exe

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Check if MySQL is running on common ports
echo Checking MySQL status...
netstat -an | findstr :3306
if %errorlevel%==0 (
    echo MySQL is running on port 3306
) else (
    netstat -an | findstr :3307
    if %errorlevel%==0 (
        echo MySQL is running on port 3307
    ) else (
        echo MySQL is not running on ports 3306 or 3307
        echo Please start MySQL manually from XAMPP Control Panel
    )
)

echo.
echo Press any key to continue...
pause >nul