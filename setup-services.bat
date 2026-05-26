@echo off
REM ============================================
REM InsuranceIQ Services Setup & Launch Script
REM ============================================
REM This script sets up and starts all three services:
REM 1. Notification Service (Node.js on port 5001)
REM 2. Python ML Service (FastAPI on port 8000)
REM 3. Spring Boot Backend (Java on port 8080)

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  InsuranceIQ Multi-Service Setup & Launch Script     ║
echo ╠══════════════════════════════════════════════════════╣
echo ║  This script will prepare your environment for       ║
echo ║  development with all three microservices.           ║
echo ╚══════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js is installed

REM Check if Python is installed
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python from https://www.python.org
    pause
    exit /b 1
)
echo [OK] Python is installed

REM Check if Maven is installed
where mvn >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Maven is not installed. Please install Maven from https://maven.apache.org
    pause
    exit /b 1
)
echo [OK] Maven is installed

REM Check if MySQL is installed
where mysql >nul 2>nul
if errorlevel 1 (
    echo [WARNING] MySQL client is not in PATH, but MySQL server should be running on localhost:3306
) else (
    echo [OK] MySQL client is available
)

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  Step 1: Setting up Notification Service            ║
echo ╚══════════════════════════════════════════════════════╝
echo.

cd notification-service

if exist node_modules (
    echo [SKIP] Dependencies already installed
) else (
    echo [INSTALL] Installing Node dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install Node dependencies
        pause
        exit /b 1
    )
)

echo [OK] Notification Service ready

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  Step 2: Setting up Python ML Service               ║
echo ╚══════════════════════════════════════════════════════╝
echo.

cd ..\ClaimsManagementApp-dev-python-ml-service\ClaimsManagementApp-dev-python-ml-service

echo [CHECK] Checking Python virtual environment...
if not exist venv (
    echo [CREATE] Creating virtual environment...
    call python -m venv venv
)

echo [ACTIVATE] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INSTALL] Installing Python dependencies...
call pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python dependencies
    pause
    exit /b 1
)

echo [OK] Python ML Service ready

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  Step 3: Setting up Spring Boot Backend             ║
echo ╚══════════════════════════════════════════════════════╝
echo.

cd ..\..\..\ClaimsManagementApp-dev-spring-backend\ClaimsManagementApp-dev-spring-backend\server

echo [CLEAN] Building Spring Boot project...
call mvn clean install -DskipTests
if errorlevel 1 (
    echo [ERROR] Maven build failed
    pause
    exit /b 1
)

echo [OK] Spring Boot Backend ready

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  Setup Complete!                                     ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo All services are ready to run. To start all services:
echo.
echo 1. Open a new terminal and run:
echo    cd notification-service
echo    npm start
echo.
echo 2. Open another terminal and run:
echo    cd ClaimsManagementApp-dev-python-ml-service\ClaimsManagementApp-dev-python-ml-service
echo    venv\Scripts\activate.bat
echo    uvicorn main:app --reload --host 0.0.0.0 --port 8000
echo.
echo 3. Open another terminal and run:
echo    cd ClaimsManagementApp-dev-spring-backend\ClaimsManagementApp-dev-spring-backend\server
echo    mvn spring-boot:run
echo.
echo Services will be available at:
echo   - Notification Service:  http://localhost:5001
echo   - Python ML Service:     http://localhost:8000
echo   - Spring Boot Backend:   http://localhost:8080
echo.
echo For more information, see:
echo   - NOTIFICATION_INTEGRATION_GUIDE.md
echo   - INTEGRATION_FIXES_SUMMARY.md
echo.
pause
