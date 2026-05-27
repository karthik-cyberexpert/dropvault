#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

if (args.includes('--setup')) {
  console.log('Starting DropVault protocol handler setup...');
  // Dynamically load the registration script
  import('../register-protocol.js').catch(err => {
    console.error('Setup registration failed:', err);
  });
} else {
  console.log('Starting DropVault server directly...');
  // Dynamically load the Express server script
  import('../server.js').catch(err => {
    console.error('Server failed to start:', err);
  });
}
