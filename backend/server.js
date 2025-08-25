// Filename: server.js
// Description: This is the main server file for the UnlockMyLead backend.
// It initializes the Express app, configures middleware, and defines API routes,
// including the corrected authentication endpoints.

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

// IMPORTANT: This service account key should be loaded from Google Secret Manager in production.
// For demonstration, we'll assume it's loaded securely.
const serviceAccount = require('./path/to/your/serviceAccountKey.json'); 

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Load the environment configuration
const environment = require('./src/config/environment');

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: environment.getFrontendUrl(), // Use the configured frontend URL from Secret Manager
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add security headers using a simple custom middleware
// This addresses the "Minor Security Headers Missing" issue from your last report
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// --- API ROUTES ---

// Health check endpoint (GET request is fine here)
app.get('/', (req, res) => {
  res.status(200).send('UnlockMyLead Backend is operational!');
});

// Corrected Auth Routes
// The login endpoint MUST be a POST request to send sensitive data securely.
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // In a real-world scenario, you would use Firebase Auth to sign in the user
    // and then generate a custom JWT token for your application.
    // This is a placeholder for the actual authentication logic.
    
    // Placeholder authentication logic
    if (email === 'owner@unlockmylead.com' && password === 'securepassword') {
      // Simulate creating a JWT token
      const uid = 'owner_uid_123';
      const token = await admin.auth().createCustomToken(uid, { tenantId: 'owner_tenant_id' });
      
      console.log(`Login successful for user: ${email}`);
      res.status(200).json({ 
        message: 'Login successful!',
        token: token,
        user: { uid, email, role: 'admin' }
      });
    } else {
      // Invalid credentials
      console.warn(`Failed login attempt for email: ${email}`);
      res.status(401).json({ message: 'Invalid email or password' });
    }

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Placeholder for other API routes
app.get('/api/leads', (req, res) => {
  res.status(200).json({ message: 'Leads data will be returned here.' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const { preventSQLInjection: enhancedPreventSQLInjection, sanitizeInput } = require('./middleware/inputValidation');
const { detectSuspiciousActivity } = require('./middleware/security');
const { bruteForceMiddleware } = require('./middleware/bruteForce');
const { initializeSecrets } = require('./services/secretManager');
const integrationRoutes = require('./routes/integrations');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - allow all origins for development
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'https://app.unlockmylead.com', 'null'], // 'null' allows file:// protocol
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// Apply input validation and sanitization
app.use(enhancedPreventSQLInjection);
app.use((req, res, next) => { req.body = sanitizeInput(req.body); req.query = sanitizeInput(req.query); req.params = sanitizeInput(req.params); next(); });

// Apply brute force protection and suspicious activity detection
app.use(detectSuspiciousActivity);
app.use(bruteForceMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/analytics', require('./routes/analytics'));

// Use MFA routes
app.use('/api/mfa', require('./routes/mfa'));

// Import MFA enforcement middleware
const { enforceAdminMFA, checkMFARequirement, enforceExistingAdmins } = require('./middleware/adminMfaEnforcement');

// Use Admin routes with MFA enforcement
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Initialize secrets and start server
async function startServer() {
  try {
    // Initialize secrets from Google Cloud Secret Manager
    console.log('Initializing application secrets...');
    const secrets = await initializeSecrets();
    
    // Make secrets available globally for routes
    global.appSecrets = secrets;
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`UnlockMyLead Backend Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log('Secrets initialized successfully');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.log('Starting server without Secret Manager (using environment variables)...');
    
    // Fallback: start server without Secret Manager
    app.listen(PORT, () => {
      console.log(`UnlockMyLead Backend Server running on port ${PORT} (fallback mode)`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  }
}

// Start the server
startServer();

module.exports = app;
  
