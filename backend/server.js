import express from 'express';
import localtunnel from 'localtunnel';
import cors from 'cors';
import { exec } from 'child_process';

let currentTunnelUrl = null;
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 15299;

// Middleware
app.use(cors());
app.use(express.json());

// Directories setup
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DB_FILE = path.join(__dirname, 'metadata.json');
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Helper to read/write JSON database
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Helper to get available free space dynamically
const getFreeSpace = () => {
  return new Promise((resolve) => {
    try {
      const rootDir = path.parse(process.cwd()).root;
      const driveLetter = rootDir.charAt(0);
      
      if (process.platform === 'win32' && driveLetter) {
        const cmd = `powershell -Command "(Get-Volume -DriveLetter ${driveLetter}).SizeRemaining"`;
        exec(cmd, (err, stdout) => {
          if (err) {
            resolve(10 * 1024 * 1024 * 1024); // Fallback 10GB
            return;
          }
          const bytes = parseInt(stdout.trim());
          resolve(isNaN(bytes) ? 10 * 1024 * 1024 * 1024 : bytes);
        });
      } else {
        // Unix fallback
        exec(`df -Pk .`, (err, stdout) => {
          if (err) {
            resolve(10 * 1024 * 1024 * 1024);
            return;
          }
          const lines = stdout.trim().split('\n');
          if (lines.length >= 2) {
            const parts = lines[1].replace(/\s+/g, ' ').split(' ');
            const availableKB = parseInt(parts[3]);
            resolve(isNaN(availableKB) ? 10 * 1024 * 1024 * 1024 : availableKB * 1024);
          } else {
            resolve(10 * 1024 * 1024 * 1024);
          }
        });
      }
    } catch (e) {
      resolve(10 * 1024 * 1024 * 1024);
    }
  });
};

// Max size: 100GB (dynamic disk check on client side)
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 * 1024 }
});

// Heartbeat active client count
let activeClients = 0;
let shutdownTimeout = null;

// Heartbeat SSE endpoint to monitor browser tab active status
app.get('/api/heartbeat', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  activeClients++;
  console.log(`Uploader client connected. Active browser sessions: ${activeClients}`);
  
  if (shutdownTimeout) {
    clearTimeout(shutdownTimeout);
    shutdownTimeout = null;
    console.log('Auto-shutdown cancelled: Browser tab re-established connection.');
  }

  // Write a ping comment to keep connection alive
  res.write(': ping\n\n');

  req.on('close', () => {
    activeClients--;
    console.log(`Uploader client disconnected. Active browser sessions: ${activeClients}`);
    
    if (activeClients <= 0) {
      console.log('No active browser tabs connected. Initiating auto-shutdown in 5 seconds...');
      shutdownTimeout = setTimeout(() => {
        console.log('Auto-shutdown triggered: All active uploader tabs were closed.');
        process.exit(0);
      }, 5000);
    }
  });
});

// API Routes

// Health Check
app.get('/api/health', async (req, res) => {
  const freeSpace = await getFreeSpace();
  res.json({
    status: 'ok',
    port: PORT,
    tunnelUrl: currentTunnelUrl,
    freeSpaceBytes: freeSpace
  });
});

// 1. Upload files
app.post('/api/upload', upload.array('files'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { expiryHours, password, oneTime } = req.body;
    const hours = parseInt(expiryHours) || 24;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + hours * 60 * 60 * 1000);

    const shareId = uuidv4();
    const filesMetadata = req.files.map(file => ({
      filename: file.originalname,
      savedName: file.filename,
      mimetype: file.mimetype,
      size: file.size
    }));

    const newShare = {
      id: shareId,
      files: filesMetadata,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      password: password || null,
      oneTime: oneTime === 'true' || oneTime === true,
      downloadCount: 0
    };

    const db = readDB();
    db.push(newShare);
    writeDB(db);

    res.json({
      success: true,
      shareId,
      downloadUrl: `http://localhost:5173/download/${shareId}`,
      tunnelUrl: currentTunnelUrl,
      expiresAt: newShare.expiresAt
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// 2. Get share link metadata (without sensitive details)
app.post('/api/file/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  const db = readDB();
  const share = db.find(item => item.id === id);

  if (!share) {
    return res.status(404).json({ error: 'Link not found or expired' });
  }

  // Check expiration
  if (new Date() > new Date(share.expiresAt)) {
    return res.status(410).json({ error: 'Link has expired' });
  }

  // Check password if configured
  if (share.password && share.password !== password) {
    return res.status(401).json({
      error: 'Invalid password',
      passwordRequired: true
    });
  }

  // Success: Return metadata (excluding saved filenames and passwords)
  const safeFiles = share.files.map(f => ({
    filename: f.filename,
    mimetype: f.mimetype,
    size: f.size
  }));

  res.json({
    id: share.id,
    files: safeFiles,
    createdAt: share.createdAt,
    expiresAt: share.expiresAt,
    oneTime: share.oneTime,
    downloadCount: share.downloadCount,
    passwordRequired: !!share.password
  });
});

// 3. Download a specific file from a share link
app.post('/api/download/:id/:fileIndex', (req, res) => {
  const { id, fileIndex } = req.params;
  const { password } = req.body;

  const db = readDB();
  const shareIndex = db.findIndex(item => item.id === id);

  if (shareIndex === -1) {
    return res.status(404).json({ error: 'Link not found or expired' });
  }

  const share = db[shareIndex];

  // Check expiration
  if (new Date() > new Date(share.expiresAt)) {
    return res.status(410).json({ error: 'Link has expired' });
  }

  // Check password
  if (share.password && share.password !== password) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const idx = parseInt(fileIndex);
  if (isNaN(idx) || idx < 0 || idx >= share.files.length) {
    return res.status(400).json({ error: 'Invalid file index' });
  }

  const fileInfo = share.files[idx];
  const filePath = path.join(UPLOADS_DIR, fileInfo.savedName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on server' });
  }

  // Increment download count
  share.downloadCount += 1;
  writeDB(db);

  // Send file download
  res.download(filePath, fileInfo.filename, (err) => {
    if (err) {
      console.error('File transfer failed:', err);
    }

    // If one-time download and it has been requested, delete after a brief delay
    if (share.oneTime) {
      setTimeout(() => {
        cleanupShare(share.id);
      }, 5000);
    }
  });
});

// 4. Admin: Get all shares
app.get('/api/admin/shares', (req, res) => {
  try {
    const db = readDB();
    // Return all shares (filtering out passwords for security)
    const safeShares = db.map(share => ({
      id: share.id,
      files: share.files.map(f => ({ filename: f.filename, size: f.size, mimetype: f.mimetype })),
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      downloadCount: share.downloadCount,
      password: !!share.password,
      oneTime: share.oneTime
    }));
    res.json({ shares: safeShares });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve active shares' });
  }
});

// 5. Admin: Revoke and purge a share
app.delete('/api/admin/share/:id', (req, res) => {
  try {
    const { id } = req.params;
    cleanupShare(id);
    res.json({ success: true, message: `Share ${id} deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete share' });
  }
});

// Helper function to clean up a share
const cleanupShare = (id) => {
  const db = readDB();
  const index = db.findIndex(item => item.id === id);
  if (index !== -1) {
    const share = db[index];
    share.files.forEach(file => {
      const filePath = path.join(UPLOADS_DIR, file.savedName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Failed to delete file:', filePath, e);
        }
      }
    });
    db.splice(index, 1);
    writeDB(db);
    console.log(`Cleaned up share link: ${id}`);
  }
};

// Cron Job for cleanup (runs every minute)
setInterval(() => {
  const db = readDB();
  const now = new Date();
  const expiredShares = db.filter(share => now > new Date(share.expiresAt));

  if (expiredShares.length > 0) {
    expiredShares.forEach(share => {
      cleanupShare(share.id);
    });
    console.log(`Cron Cleaned up ${expiredShares.length} expired link(s)`);
  }
}, 60000);

app.listen(PORT, async () => {
  console.log(`DropVault backend server running on port ${PORT}`);
  try {
    const tunnel = await localtunnel({ port: PORT });
    currentTunnelUrl = tunnel.url;
    console.log(`DropVault public secure tunnel active at: ${tunnel.url}`);
    
    tunnel.on('close', () => {
      console.log('Tunnel closed.');
      currentTunnelUrl = null;
    });
  } catch (err) {
    console.error('Failed to open localtunnel:', err);
  }
});
