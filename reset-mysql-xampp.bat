@echo off
echo ========================================
echo MySQL XAMPP Reset Script
echo ========================================
echo.
echo This script will reset MySQL configuration
echo WARNING: This will delete existing databases
echo Press Ctrl+C to cancel, or any key to continue
pause

echo Stopping XAMPP services...
net stop apache2.4 2>nul
taskkill /f /im mysqld.exe 2>nul
taskkill /f /im httpd.exe 2>nul

echo.
echo Backing up current MySQL data...
if exist "C:\xampp\mysql\data_backup" rmdir /s /q "C:\xampp\mysql\data_backup"
mkdir "C:\xampp\mysql\data_backup"
xcopy "C:\xampp\mysql\data\*" "C:\xampp\mysql\data_backup\" /s /e /h /y

echo.
echo Resetting MySQL data directory...
cd /d "C:\xampp\mysql\data"
for /d %%D in (*) do (
    if /i not "%%D"=="mysql" (
        if /i not "%%D"=="performance_schema" (
            if /i not "%%D"=="phpmyadmin" (
                rmdir /s /q "%%D"
            )
        )
    )
)

echo.
echo Clearing log files...
del /q *.log 2>nul
del /q *.err 2>nul

echo.
echo Reset complete! 
echo 1. Start XAMPP as Administrator
echo 2. Try starting MySQL service
echo 3. If successful, recreate your database
echo.
echo Your old data is backed up in: C:\xampp\mysql\data_backup
echo ========================================
pause