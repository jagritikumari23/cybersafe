const { Pool } = require('pg');
const mongoose = require('mongoose');

// PostgreSQL configuration
const pgPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cybersafe',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// MongoDB configuration
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cybersafe';

// Connect to MongoDB
const connectMongo = async () => {
    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.warn('MongoDB connection warning:', error.message);
        console.log('Continuing without MongoDB...');
    }
};

// Test PostgreSQL connection
const testPgConnection = async () => {
    try {
        const client = await pgPool.connect();
        console.log('Connected to PostgreSQL');
        client.release();
    } catch (error) {
        console.error('PostgreSQL connection error:', error);
        process.exit(1);
    }
};

// Initialize database connections
const initializeDatabases = async () => {
    await connectMongo();
    await testPgConnection();
};

module.exports = {
    pgPool,
    mongoose,
    initializeDatabases
}; 