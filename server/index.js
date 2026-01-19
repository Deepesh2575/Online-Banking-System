const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const transactionRoutes = require('./routes/transaction');

dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set in environment variables. Using default (NOT SECURE FOR PRODUCTION)');
    process.env.JWT_SECRET = 'default-secret-change-in-production';
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/transaction', transactionRoutes);

app.get('/', (req, res) => {
    res.send('Banking System API is running');
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
        console.error(`Please stop the other process using port ${PORT} or change the PORT in .env file\n`);
        console.error('To find and kill the process:');
        console.error(`  Windows: netstat -ano | findstr :${PORT}`);
        console.error(`  Then: taskkill /PID <PID> /F`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});
