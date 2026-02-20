/**
 * Root Entry Point
 * This file proxies the execution to the actual application logic in N-Corp/main.js.
 */

// Set environment variables if needed (matching .replit configuration)
process.env.PORT = process.env.PORT || '5000';

// Import the actual main file
console.log('\x1b[36m%s\x1b[0m', '🚀 Starting N-Corp Panel...');
console.log('\x1b[33m%s\x1b[0m', `Local Access: http://localhost:${process.env.PORT}`);
require('./N-Corp/main.js');
