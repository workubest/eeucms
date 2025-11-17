import 'dotenv/config';

console.log('🚀 Testing environment variables...');
console.log('📝 Environment variables loaded:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  GAS_URL: process.env.GAS_URL ? 'Set (' + process.env.GAS_URL.substring(0, 50) + '...)' : 'Not set'
});

if (!process.env.GAS_URL) {
  console.error('❌ GAS_URL environment variable is required');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log('🔗 GAS_URL:', process.env.GAS_URL);