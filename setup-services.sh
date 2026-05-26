#!/bin/bash

# ============================================
# InsuranceIQ Services Setup & Launch Script
# ============================================
# This script sets up and starts all three services:
# 1. Notification Service (Node.js on port 5001)
# 2. Python ML Service (FastAPI on port 8000)
# 3. Spring Boot Backend (Java on port 8080)

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  InsuranceIQ Multi-Service Setup & Launch Script     ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  This script will prepare your environment for       ║"
echo "║  development with all three microservices.           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Node.js is not installed. Please install Node.js from https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Node.js is installed"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Python is not installed. Please install Python from https://www.python.org"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Python is installed"

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Maven is not installed. Please install Maven from https://maven.apache.org"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Maven is installed"

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}[WARNING]${NC} MySQL client is not available, but MySQL server should be running on localhost:3306"
else
    echo -e "${GREEN}[OK]${NC} MySQL client is available"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Step 1: Setting up Notification Service            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

cd notification-service

if [ -d "node_modules" ]; then
    echo -e "${YELLOW}[SKIP]${NC} Dependencies already installed"
else
    echo -e "${GREEN}[INSTALL]${NC} Installing Node dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${NC} Failed to install Node dependencies"
        exit 1
    fi
fi

echo -e "${GREEN}[OK]${NC} Notification Service ready"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Step 2: Setting up Python ML Service               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

cd ../ClaimsManagementApp-dev-python-ml-service/ClaimsManagementApp-dev-python-ml-service

echo -e "${GREEN}[CHECK]${NC} Checking Python virtual environment..."
if [ ! -d "venv" ]; then
    echo -e "${GREEN}[CREATE]${NC} Creating virtual environment..."
    python3 -m venv venv
fi

echo -e "${GREEN}[ACTIVATE]${NC} Activating virtual environment..."
source venv/bin/activate

echo -e "${GREEN}[INSTALL]${NC} Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Failed to install Python dependencies"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Python ML Service ready"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Step 3: Setting up Spring Boot Backend             ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

cd ../../ClaimsManagementApp-dev-spring-backend/ClaimsManagementApp-dev-spring-backend/server

echo -e "${GREEN}[CLEAN]${NC} Building Spring Boot project..."
mvn clean install -DskipTests
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Maven build failed"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Spring Boot Backend ready"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Setup Complete!                                     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "All services are ready to run. To start all services:"
echo ""
echo "1. Open a new terminal and run:"
echo "   cd notification-service"
echo "   npm start"
echo ""
echo "2. Open another terminal and run:"
echo "   cd ClaimsManagementApp-dev-python-ml-service/ClaimsManagementApp-dev-python-ml-service"
echo "   source venv/bin/activate"
echo "   uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "3. Open another terminal and run:"
echo "   cd ClaimsManagementApp-dev-spring-backend/ClaimsManagementApp-dev-spring-backend/server"
echo "   mvn spring-boot:run"
echo ""
echo "Services will be available at:"
echo "   - Notification Service:  http://localhost:5001"
echo "   - Python ML Service:     http://localhost:8000"
echo "   - Spring Boot Backend:   http://localhost:8080"
echo ""
echo "For more information, see:"
echo "   - NOTIFICATION_INTEGRATION_GUIDE.md"
echo "   - INTEGRATION_FIXES_SUMMARY.md"
echo ""
