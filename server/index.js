const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be provided through the environment and be at least 32 characters long.');
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user; // { userId }
    next();
  });
};

// --- SYNC ENGINE --- //

// Pull data (Download from cloud to device)
app.get('/api/sync/pull', authenticateToken, async (req, res) => {
  try {
    const records = await prisma.syncRecord.findMany({
      where: { userId: req.user.userId }
    });
    res.json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to pull sync records' });
  }
});

// Push data (Upload from device to cloud)
app.post('/api/sync/push', authenticateToken, async (req, res) => {
  const { records } = req.body; // Array of { key, value }
  if (!Array.isArray(records)) return res.status(400).json({ error: 'Invalid records format' });

  try {
    // Upsert each record
    for (const record of records) {
      if (!record.key || record.value === undefined) continue;
      
      await prisma.syncRecord.upsert({
        where: {
          userId_key: { userId: req.user.userId, key: record.key }
        },
        update: { value: String(record.value) },
        create: {
          userId: req.user.userId,
          key: record.key,
          value: String(record.value)
        }
      });
    }
    res.json({ status: 'ok', message: `${records.length} records synced successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to push sync records' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Atlas Server running on http://localhost:${PORT}`);
});
