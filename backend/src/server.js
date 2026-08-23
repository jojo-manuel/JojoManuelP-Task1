const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const seedDatabase = require('./config/seed');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Joineazy API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER UNHANDLED ERROR]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Ensure DB schema and seed is initialized
let isSeeded = false;
async function ensureDbInitialized() {
  if (!isSeeded) {
    await seedDatabase();
    isSeeded = true;
  }
}

app.use(async (req, res, next) => {
  try {
    await ensureDbInitialized();
  } catch (e) {
    console.error('[DB INIT ERROR]', e);
  }
  next();
});

// Start Server
async function startServer() {
  try {
    await ensureDbInitialized();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Joineazy Server running on http://localhost:${PORT}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[SERVER START FAILURE]', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
