const express = require('express');
const cors = require('cors');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const { MongoStore } = require('wwebjs-mongo');
const fs = require('fs');
const path = require('path');

// Helper to remove stale Puppeteer lock files to prevent startup hangs
function removePuppeteerLocks(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.lstatSync(filePath); // Use lstatSync to handle symlinks safely without crashing
      if (stat.isDirectory()) {
        removePuppeteerLocks(filePath);
      } else if (file === 'SingletonLock') {
        try {
          fs.unlinkSync(filePath);
          console.log(`🧹 Cleared stale Puppeteer SingletonLock at: ${filePath}`);
        } catch (err) {
          console.error(`Could not delete lock file ${filePath}: ${err.message}`);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir} for lock files:`, err.message);
  }
}

// WhatsApp Log Schema for capped collections & 3-month TTL
const whatsappLogSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  recipientName: { type: String },
  type: { type: String, required: true }, // 'broadcast' | 'order_msg' | 'ready_msg' | 'balance_msg' | 'single_msg'
  status: { type: String, required: true }, // 'success' | 'failed'
  error: { type: String },
  createdAt: { type: Date, default: Date.now, index: { expires: '90d' } }
}, {
  capped: { size: 10 * 1024 * 1024, max: 50000 },
  timestamps: true
});

const WhatsAppLog = mongoose.models.WhatsAppLog || mongoose.model('WhatsAppLog', whatsappLogSchema);

// Uncaught exception guards to prevent whatsapp-web.js zip race condition from crashing the process
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception thrown:', err);
  if (err.code === 'ENOENT' && err.path === 'RemoteAuth.zip') {
    console.log('ℹ️ Safely ignored RemoteAuth.zip race condition warning.');
  }
});

// Load Next.js environment variables
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

let clientStatus = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_READY, CONNECTED
let latestQrText = '';
let latestQrImage = '';
let client;

// Campaign Status
let currentCampaign = {
  active: false,
  total: 0,
  sent: 0,
  successCount: 0,
  failedCount: 0,
  failures: [],
  statusText: 'Idle'
};

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI or MONGODB_URL is not defined in environment variables!');
  process.exit(1);
}

// Global variables for WhatsApp initialization
let store;
let dataPath;
let puppeteerOpts;

function initializeWhatsAppClient() {
  console.log('🧹 Scanning and clearing any stale Puppeteer lock files...');
  if (dataPath) {
    removePuppeteerLocks(dataPath);
  }

  client = new Client({
    authStrategy: new RemoteAuth({
      store: store,
      backupSyncIntervalMs: 60000, // backup session to database every 60 seconds
      dataPath: dataPath
    }),
    webVersion: '2.3000.1043030358-alpha',
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html',
      strict: false
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    puppeteer: puppeteerOpts
  });

  client.on('qr', async (qr) => {
    latestQrText = qr;
    clientStatus = 'QR_READY';
    try {
      latestQrImage = await QRCode.toDataURL(qr);
    } catch (err) {
      console.error('Error generating QR Image:', err);
    }
    console.log('👉 WhatsApp QR Code generated. Scan in the web application.');
  });

  client.on('ready', () => {
    clientStatus = 'CONNECTED';
    latestQrText = '';
    latestQrImage = '';
    console.log('✅ WhatsApp Web Client is ready (session loaded from MongoDB RemoteAuth)!');
  });

  client.on('remote_session_saved', () => {
    console.log('💾 WhatsApp session successfully backed up to MongoDB.');
  });

  client.on('authenticated', () => {
    console.log('🔓 Authenticated successfully.');
  });

  client.on('auth_failure', (msg) => {
    clientStatus = 'DISCONNECTED';
    latestQrText = '';
    latestQrImage = '';
    console.error('❌ Authentication failed:', msg);
  });

  client.on('disconnected', (reason) => {
    clientStatus = 'DISCONNECTED';
    latestQrText = '';
    latestQrImage = '';
    console.log('🔌 Client disconnected, re-initializing...', reason);
    initializeWhatsAppClient();
  });

  client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Loading Screen: ${percent}% - ${message}`);
  });

  client.on('change_state', (state) => {
    console.log('🔄 Connection state changed to:', state);
  });

  console.log('🚀 Initializing WhatsApp Web Client with RemoteAuth...');
  clientStatus = 'INITIALIZING';
  client.initialize().catch(err => {
    console.error('WhatsApp initialization failed:', err);
    clientStatus = 'DISCONNECTED';
  });
}

// Connect to MongoDB for session backup/restore
console.log('🔌 Connecting to MongoDB for WhatsApp session directory storage...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');

    store = new MongoStore({ mongoose: mongoose });
    const userHome = require('os').homedir();
    dataPath = path.join(userHome, '.saas-opticals-wwebjs-auth');

    puppeteerOpts = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Prevent shared memory issues in Docker
        '--disable-gpu',           // Disable GPU acceleration
        '--no-first-run',
        '--no-zygote',
        '--single-process',        // Optimize memory usage in containers
        '--disable-features=IsolateOrigins,site-per-process', // Prevent detached frame errors
        '--disable-site-isolation-trials',                    // Prevent detached frame errors
        '--js-flags=--max-old-space-size=512',                // Prevent container memory OOM crashes
        '--disable-extensions',
        '--disable-blink-features=AutomationControlled', // Bypass automated navigator.webdriver detection
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' // Standard Chrome User-Agent
      ],
      protocolTimeout: 300000      // 5 minutes timeout to absorb spikes
    };

    // Locate system Chromium dynamically on production containers
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      puppeteerOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else if (fs.existsSync('/usr/bin/chromium')) {
      puppeteerOpts.executablePath = '/usr/bin/chromium';
    } else if (fs.existsSync('/usr/bin/chromium-browser')) {
      puppeteerOpts.executablePath = '/usr/bin/chromium-browser';
    }

    // Start WhatsApp client
    initializeWhatsAppClient();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed for WhatsApp service:', err);
    process.exit(1);
  });

// REST API Endpoints

// GET /api/whatsapp/status: Check status and get QR code image
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: clientStatus,
    qrImage: latestQrImage,
    campaign: currentCampaign
  });
});

// POST /api/whatsapp/logout: Disconnect and reset authentication session
app.post('/api/whatsapp/logout', async (req, res) => {
  console.log('🔄 Logout requested. Initiating session cleanup...');
  try {
    if (client) {
      // Remove disconnected listener to prevent double initialization during cleanup
      client.removeAllListeners('disconnected');

      try {
        await client.logout();
        console.log('✅ client.logout() succeeded.');
      } catch (err) {
        console.warn('⚠️ client.logout() failed (likely already disconnected):', err.message);
        // Fallback to manual strategy logout if client.logout fails
        if (client.authStrategy) {
          try {
            await client.authStrategy.logout();
            console.log('✅ client.authStrategy.logout() succeeded.');
          } catch (strategyErr) {
            console.error('❌ client.authStrategy.logout() failed:', strategyErr.message);
          }
        }
      }

      try {
        await client.destroy();
        console.log('✅ client.destroy() succeeded.');
      } catch (destroyErr) {
        console.error('❌ client.destroy() failed:', destroyErr.message);
      }
    }

    // Explicitly delete local directory to be 100% sure we wipe corrupted state/locks
    if (dataPath) {
      const sessionDir = path.join(dataPath, 'RemoteAuth');
      if (fs.existsSync(sessionDir)) {
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
          console.log('🧹 Explicitly deleted local session directory:', sessionDir);
        } catch (e) {
          console.error('❌ Failed to explicitly delete local session directory:', e.message);
        }
      }
    }

    // Reset status variables
    clientStatus = 'DISCONNECTED';
    latestQrText = '';
    latestQrImage = '';

    // Reconstruct and re-initialize a fresh client
    console.log('🔄 Re-initializing WhatsApp Web Client after logout...');
    initializeWhatsAppClient();

    res.json({ message: 'Logged out and reset successfully' });
  } catch (error) {
    console.error('Logout handler error:', error);
    res.status(500).json({ error: error.message || 'Failed to logout' });
  }
});

// POST /api/whatsapp/broadcast: Trigger asynchronous broadcast campaign
app.post('/api/whatsapp/broadcast', async (req, res) => {
  const { recipients, message } = req.body;
  const shopId = req.headers['x-shop-id'];

  if (!shopId) {
    return res.status(400).json({ error: 'Shop ID is required in headers.' });
  }

  if (clientStatus !== 'CONNECTED') {
    return res.status(400).json({ error: 'WhatsApp client is not authenticated / connected.' });
  }

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'Recipients list is required.' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Broadcast message is required.' });
  }

  if (currentCampaign.active) {
    return res.status(400).json({ error: 'Another campaign is currently running.' });
  }

  // Reset campaign status
  currentCampaign = {
    active: true,
    total: recipients.length,
    sent: 0,
    successCount: 0,
    failedCount: 0,
    failures: [],
    statusText: 'Sending messages...'
  };

  // Run in background
  runBroadcastCampaign(recipients, message, shopId);

  res.json({ message: 'Broadcast campaign started in background.', total: recipients.length });
});

async function runBroadcastCampaign(recipients, message, shopId) {
  console.log(`Starting campaign to send ${recipients.length} messages for shop: ${shopId}`);
  
  for (let i = 0; i < recipients.length; i++) {
    if (!currentCampaign.active) break; // Campaign cancelled

    // Safeguard: After every 100 messages, cool-off for 5 minutes (300 seconds)
    if (i > 0 && i % 100 === 0) {
      console.log(`⏳ Reached chunk limit (100). Cooling off for 5 minutes to prevent spam banning...`);
      for (let t = 300; t > 0; t--) {
        if (!currentCampaign.active) break;
        currentCampaign.statusText = `Cooling off... (${t}s left)`;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (!currentCampaign.active) break;
      currentCampaign.statusText = 'Sending messages...';
    }

    const recipient = recipients[i];
    let phone = recipient.phone.replace(/[^0-9]/g, '');
    
    // Ensure correct format (for India, prepend 91 if it's a 10 digit number)
    if (phone.length === 10) {
      phone = '91' + phone;
    }

    const chatId = `${phone}@c.us`;
    const personalizedMessage = message
      .replace(/{name}/g, recipient.name)
      .replace(/{shopName}/g, recipient.shopName || 'Optics Store');

    try {
      if (client) {
        await client.sendMessage(chatId, personalizedMessage);
        currentCampaign.successCount++;
        console.log(`✅ Successfully sent broadcast message to ${recipient.name} (${phone})`);
        
        await WhatsAppLog.create({
          shopId: shopId,
          phone: phone,
          message: personalizedMessage,
          recipientName: recipient.name,
          type: 'broadcast',
          status: 'success'
        }).catch(err => console.error('Failed to save success log:', err));
      } else {
        throw new Error('Client not initialized');
      }
    } catch (err) {
      console.error(`❌ Failed to send message to ${recipient.name} (${phone}):`, err);
      currentCampaign.failedCount++;
      currentCampaign.failures.push({
        name: recipient.name,
        phone: recipient.phone,
        error: err.message || String(err)
      });

      await WhatsAppLog.create({
        shopId: shopId,
        phone: phone,
        message: personalizedMessage,
        recipientName: recipient.name,
        type: 'broadcast',
        status: 'failed',
        error: err.message || String(err)
      }).catch(logErr => console.error('Failed to save fail log:', logErr));
    }

    currentCampaign.sent++;

    // Safeguard: Random delay between messages (3 to 6 seconds) to prevent spam banning
    if (i < recipients.length - 1) {
      const delay = Math.floor(Math.random() * 3000) + 3000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  currentCampaign.active = false;
  currentCampaign.statusText = 'Campaign completed!';
  console.log('Campaign completed. Total sent:', currentCampaign.sent);
}

// POST /api/whatsapp/send-single: Send a single message to a phone number
app.post('/api/whatsapp/send-single', async (req, res) => {
  const { phone, message, recipientName, type } = req.body;
  const shopId = req.headers['x-shop-id'];

  if (!shopId) {
    return res.status(400).json({ error: 'Shop ID is required in headers.' });
  }

  if (clientStatus !== 'CONNECTED') {
    return res.status(400).json({ error: 'WhatsApp client is not authenticated / connected.' });
  }

  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone number and message are required.' });
  }

  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  const chatId = `${cleanPhone}@c.us`;

  try {
    if (client) {
      await client.sendMessage(chatId, message);
      console.log(`✅ Successfully sent single message to ${cleanPhone}`);
      
      await WhatsAppLog.create({
        shopId: shopId,
        phone: cleanPhone,
        message: message,
        recipientName: recipientName || '',
        type: type || 'single_msg',
        status: 'success'
      }).catch(err => console.error('Failed to save single success log:', err));

      res.json({ success: true, message: 'Message sent successfully.' });
    } else {
      throw new Error('Client not initialized');
    }
  } catch (err) {
    console.error(`❌ Failed to send single message to ${cleanPhone}:`, err);

    await WhatsAppLog.create({
      shopId: shopId,
      phone: cleanPhone,
      message: message,
      recipientName: recipientName || '',
      type: type || 'single_msg',
      status: 'failed',
      error: err.message || String(err)
    }).catch(logErr => console.error('Failed to save single fail log:', logErr));

    res.status(500).json({ error: err.message || 'Failed to send message.' });
  }
});

// POST /api/whatsapp/cancel: Terminate a running campaign
app.post('/api/whatsapp/cancel', (req, res) => {
  currentCampaign.active = false;
  res.json({ message: 'Campaign cancelled successfully.' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`📡 WhatsApp Web Service listening on 127.0.0.1:${PORT}`);
});
