const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function setup() {
    let connection;
    try {
        // Create connection without database selected to create it if needed
        // Handle empty password string
        const dbPassword = process.env.DB_PASSWORD === '' 
            ? '' 
            : (process.env.DB_PASSWORD || 'password');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: dbPassword
        });

        const schemaPath = path.join(__dirname, '../database/schema.sql');
        
        // Check if schema file exists
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at: ${schemaPath}`);
        }

        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split queries by semicolon to execute them one by one
        // Note: This is a simple split, might break on complex stored procedures but fine for this schema
        const queries = schema.split(';').filter(query => query.trim().length > 0);

        console.log('Running schema...');

        for (const query of queries) {
            if (query.trim()) {
                await connection.query(query);
            }
        }

        console.log('Database setup completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up database:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    } finally {
        // Close connection if it was created
        if (connection) {
            try {
                await connection.end();
            } catch (closeError) {
                console.error('Error closing connection:', closeError.message);
            }
        }
    }
}

setup();
