import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Argument looks like "dropvault://launch?port=5000" or "dropvault://launch/?port=5000"
const urlArg = process.argv[2] || '';
console.log('----------------------------------------------------');
console.log('DropVault Protocol Handler triggered.');
console.log(`Payload: ${urlArg}`);

let port = 15299;
try {
  // Simple extraction via URL or regex fallback
  const match = urlArg.match(/port=(\d+)/);
  if (match && match[1]) {
    port = parseInt(match[1]);
  }
} catch (e) {
  console.log('Error parsing port argument, defaulting to 15299.');
}

console.log(`Starting DropVault local node on port: ${port}`);
console.log('Keep this window open to maintain your node database and connection.');
console.log('----------------------------------------------------');

// Set directory context to backend folder
process.chdir(__dirname);

// Set environment variables for the server instance
process.env.PORT = port.toString();

// Load the server module directly in this process
import('./server.js').catch(err => {
  console.error('Failed to run server.js in protocol context:', err);
  // Prevent immediate window closure on error
  setTimeout(() => {}, 30000);
});
