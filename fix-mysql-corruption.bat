@echo off
echo ========================================
echo XAMPP MySQL Corruption Fix Script
echo ========================================
echo.
echo WARNING: This will delete all existing databases!
echo Your databases will be lost, but can be recreated.
echo.
echo Press Ctrl+C to cancel, or any key to continue...
pause
echo.

echo Step 1: Stopping all XAMPP services...
taskkill /f /im mysqld.exe 2>nul
taskkill /f /im httpd.exe 2>nul
net stop apache2.4 2>nul

echo.
echo Step 2: Backing up MySQL configuration...
if not exist "C:\xampp\mysql\backup" mkdir "C:\xampp\mysql\backup"
copy "C:\xampp\mysql\bin\my.ini" "C:\xampp\mysql\backup\my.ini.backup" 2>nul

echo.
echo Step 3: Cleaning corrupted data directory...
cd /d "C:\xampp\mysql\data"

echo Removing corrupted master info files...
del /q master-*.info 2>nul
del /q relay-log*.info 2>nul
del /q mysql-relay-bin* 2>nul

echo Removing corrupted log files...
del /q *.log 2>nul
del /q *.err 2>nul
del /q aria_log* 2>nul
del /q ib_logfile* 2>nul
del /q auto.cnf 2>nul

echo Removing user databases (keeping system databases)...
for /d %%D in (*) do (
    if /i not "%%D"=="mysql" (
        if /i not "%%D"=="performance_schema" (
            if /i not "%%D"=="phpmyadmin" (
                if /i not "%%D"=="information_schema" (
                    echo Removing database: %%D
                    rmdir /s /q "%%D"
                )
            )
        )
    )
)

echo.
echo Step 4: Creating fresh my.ini configuration...
(
echo [mysqld]
echo port=3307
echo socket="C:/xampp/mysql/mysql.sock"
echo basedir="C:/xampp/mysql"
echo tmpdir="C:/xampp/tmp"
echo datadir="C:/xampp/mysql/data"
echo pid_file="mysql.pid"
echo skip-external-locking
echo default-table-type=myisam
echo thread_handling=one-thread-per-connection
echo max_connections=100
echo table_open_cache=64
echo sort_buffer_size=512K
echo net_buffer_length=8K
echo read_buffer_size=256K
echo read_rnd_buffer_size=512K
echo myisam_sort_buffer_size=8M
echo log_error="mysql_error.log"
echo.
echo [client]
echo port=3307
echo socket="C:/xampp/mysql/mysql.sock"
echo.
echo [mysql]
echo default-character-set=utf8
) > "C:\xampp\mysql\bin\my.ini"

echo.
echo ========================================
echo Reset Complete!
echo.
echo NEXT STEPS:
echo 1. Start XAMPP Control Panel as Administrator
echo 2. Start Apache service
echo 3. Start MySQL service ^(should work now^)
echo 4. Access phpMyAdmin at: http://localhost/phpmyadmin
echo 5. Create travel_booking database
echo 6. Run your table creation and seed scripts
echo.
echo MySQL is now configured for port 3307
echo Update your .env file: DB_PORT=3307
echo ========================================
pause