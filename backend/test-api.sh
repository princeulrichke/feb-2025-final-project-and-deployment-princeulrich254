#!/bin/bash
echo "🧪 Testing API connectivity..."

echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -X GET http://localhost:5000/health -H "Origin: http://localhost:3000")
if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    echo "✅ Health endpoint working"
else
    echo "❌ Health endpoint failed"
fi

echo "2. Testing CORS preflight..."
CORS_RESPONSE=$(curl -s -X OPTIONS http://localhost:5000/api/auth/signup -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" -i)
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS preflight working"
else
    echo "❌ CORS preflight failed"
fi

echo "🎉 Test completed!"
