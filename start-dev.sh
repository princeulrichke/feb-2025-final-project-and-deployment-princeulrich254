#!/bin/bash

echo "🚀 Starting ERP Business Suite Development Servers"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Kill existing processes on ports 3000 and 5000
echo -e "${YELLOW}🔍 Checking for existing processes...${NC}"

if check_port 3000; then
    echo -e "${YELLOW}📦 Stopping process on port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

if check_port 5000; then
    echo -e "${YELLOW}🖥️  Stopping process on port 5000...${NC}"
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
fi

sleep 2

# Start backend server
echo -e "${BLUE}🖥️  Starting Backend Server (Port 5000)...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend server
echo -e "${GREEN}📦 Starting Frontend Server (Port 3000)...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo -e "\n${RED}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Trap cleanup function on script exit
trap cleanup SIGINT SIGTERM

echo -e "\n${GREEN}✅ Development servers started!${NC}"
echo -e "${BLUE}🖥️  Backend:  http://localhost:5000${NC}"
echo -e "${GREEN}📦 Frontend: http://localhost:3000${NC}"
echo -e "\n${YELLOW}💡 Press Ctrl+C to stop all servers${NC}"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
