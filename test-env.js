require('dotenv').config();

console.log('Environment variables check:');
console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? 'SET' : 'NOT SET');
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? 'SET' : 'NOT SET');
console.log('GOOGLE_AI_API_KEY value:', process.env.GOOGLE_AI_API_KEY);
console.log('DEEPSEEK_API_KEY value:', process.env.DEEPSEEK_API_KEY);

// Test the LLM service initialization
const llmService = require('./src/services/llmService');
console.log('\nLLM Service provider status:');
console.log(JSON.stringify(llmService.getProviderStatus(), null, 2));