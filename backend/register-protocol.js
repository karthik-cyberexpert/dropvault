import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handlerPath = path.join(__dirname, 'protocol-handler.js');
const key = 'HKCU\\Software\\Classes\\dropvault';

console.log('Registering DropVault protocol handler...');
console.log(`Handler script path: ${handlerPath}`);

// Run reg commands to create the custom protocol
exec(`reg add "${key}" /ve /d "URL:DropVault Protocol" /f`, (err, stdout, stderr) => {
  if (err) {
    console.error('Error creating base protocol key:', stderr);
    return;
  }
  
  exec(`reg add "${key}" /v "URL Protocol" /d "" /f`, (err, stdout, stderr) => {
    if (err) {
      console.error('Error setting URL Protocol flag:', stderr);
      return;
    }

    // Command to launch Node in a separate window running our protocol-handler.js
    // We escape quotes around the path to protocol-handler.js and the %1 argument
    const cmdStr = `cmd.exe /c start /min \\"DropVault Node Launcher\\" cmd.exe /c node \\"${handlerPath}\\" \\"%1\\"`;
    exec(`reg add "${key}\\shell\\open\\command" /ve /d "${cmdStr}" /f`, (err, stdout, stderr) => {
      if (err) {
        console.error('Error setting launcher command:', stderr);
        return;
      }
      console.log('SUCCESS: DropVault custom protocol handler registered successfully!');
      console.log('You can now open dropvault:// URL links from your browser to launch the node.');
    });
  });
});
