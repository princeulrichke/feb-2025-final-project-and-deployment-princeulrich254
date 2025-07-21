#!/bin/bash

echo "🧪 Testing API connectivity..."

# Test 1: Health endpoint
echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -X GET http://localhost:5000/health -H "Origin: http://localhost:3000")
if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    echo "✅ Health endpoint working"
else
    echo "❌ Health endpoint failed"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test 2: CORS preflight for auth endpoints
echo "2. Testing CORS preflight for auth endpoints..."
CORS_RESPONSE=$(curl -s -X OPTIONS http://localhost:5000/api/auth/signup \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -i)

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS preflight working"
else
    echo "❌ CORS preflight failed"
    echo "Response: $CORS_RESPONSE"
fi

# Test 3: Check if both servers are running
echo "3. Checking server status..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend server running on port 3000"
else
    echo "❌ Frontend server not accessible"
fi

if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend server running on port 5000"
else
    echo "❌ Backend server not accessible"
fi

echo "🎉 API connectivity test completed!"
