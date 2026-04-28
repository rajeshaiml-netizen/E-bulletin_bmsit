// test-db.js - Test database connection and initialization
const { pool, initializeDatabase } = require('./db');

async function testDatabase() {
    try {
        console.log('Initializing database...');
        await initializeDatabase();

        console.log('Testing user login...');
        const result = await pool.query(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            ['hod', 'password123']
        );

        if (result.rows.length > 0) {
            console.log('Login successful! User found:', result.rows[0]);
        } else {
            console.log('Login failed: User not found');
        }

        console.log('Database test completed successfully');
    } catch (error) {
        console.error('Database test failed:', error);
    }
}

testDatabase();