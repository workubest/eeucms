// Netlify Function to proxy requests to Google Apps Script
// This solves CORS issues by handling requests server-side

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwWoZtW-PbJv0wCB6VQquETpPpbenpFjRlhioqJ1jR0_5ES689-S_X126R9IVNoBDe0/exec';

exports.handler = async (event, context) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-client-version',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Extract the path from the Netlify function path
    // event.path will be something like /.netlify/functions/api/complaints
    // We want to extract /complaints
    const pathParts = event.path.split('/.netlify/functions/api');
    const apiPath = pathParts[1] || '/';

    console.log('🔄 Netlify Proxy:', event.httpMethod, apiPath);

    // Prepare the request to GAS
    const gasUrl = new URL(GAS_URL);

    // Add query parameters if any
    if (event.queryStringParameters) {
      Object.keys(event.queryStringParameters).forEach(key => {
        gasUrl.searchParams.set(key, event.queryStringParameters[key]);
      });
    }

    // Prepare GAS data payload
    let gasData = {};

    if (event.httpMethod === 'GET') {
      // For GET requests, pass query params as data
      gasData = {
        path: apiPath,
        action: 'get',
        data: event.queryStringParameters || {}
      };
    } else {
      // For POST/PUT/DELETE, parse body
      try {
        const body = event.body ? JSON.parse(event.body) : {};
        gasData = {
          path: apiPath,
          action: event.httpMethod === 'POST' ? 'create' :
                  event.httpMethod === 'PUT' ? 'update' : 'delete',
          data: body
        };
      } catch (parseError) {
        console.error('❌ Error parsing request body:', parseError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid JSON in request body'
          })
        };
      }
    }

    console.log('📤 Proxying to GAS:', gasData);

    // Make request to Google Apps Script
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gasData),
      // Set timeout to prevent hanging
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      console.error('❌ GAS Response Error:', response.status, response.statusText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: `GAS API Error: ${response.status} ${response.statusText}`
        })
      };
    }

    // Get response from GAS
    const responseText = await response.text();
    console.log('📥 GAS Response received, length:', responseText.length);

    let gasResponse;
    try {
      gasResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Error parsing GAS response:', parseError);
      console.log('Raw GAS response:', responseText.substring(0, 500));
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid response from GAS API',
          details: responseText.substring(0, 200)
        })
      };
    }

    console.log('✅ Proxy successful for:', apiPath);

    // Return the GAS response with CORS headers
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(gasResponse)
    };

  } catch (error) {
    console.error('❌ Netlify Function Error:', error);

    // Handle different types of errors
    if (error.name === 'AbortError') {
      return {
        statusCode: 504,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Request timeout - GAS API took too long to respond'
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};