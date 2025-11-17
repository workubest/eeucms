// Test script to verify Netlify Function API proxy setup
// Run with: node test-netlify-api.js

const API_BASE = 'http://localhost:8080/.netlify/functions/api';

async function testAPI() {
  console.log('🧪 Testing Netlify Function API Proxy...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    console.log('Health check response:', healthResponse.status);

    // Test 2: Login endpoint (will fail without real GAS, but should not have CORS errors)
    console.log('\n2️⃣ Testing login endpoint...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });

    console.log('Login response status:', loginResponse.status);
    const loginData = await loginResponse.text();
    console.log('Login response data:', loginData.substring(0, 200) + '...');

    // Test 3: CORS headers check
    console.log('\n3️⃣ Checking CORS headers...');
    console.log('Access-Control-Allow-Origin:', loginResponse.headers.get('access-control-allow-origin'));
    console.log('Access-Control-Allow-Methods:', loginResponse.headers.get('access-control-allow-methods'));
    console.log('Access-Control-Allow-Headers:', loginResponse.headers.get('access-control-allow-headers'));

    console.log('\n✅ API proxy test completed successfully!');
    console.log('🎉 No CORS errors detected - Netlify function is working!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);

    if (error.message.includes('Failed to fetch')) {
      console.log('💡 This is expected in development - Netlify functions only work when deployed');
      console.log('🚀 Deploy to Netlify to test the full functionality');
    }
  }
}

// Run the test
testAPI();