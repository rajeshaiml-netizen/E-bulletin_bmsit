// db.js - Database connection and setup
const { Pool } = require('pg');

// Parse the connection string
// Use DATABASE_URL from environment or fallback to provided connection string
const connectionString = process.env.DATABASE_URL || 'postgresql://ebulletin_user:b7svwTO4asPyGBbdpQLa0KtNT75hfdVB@dpg-d4ej9pbe5dus73fh8i70-a.oregon-postgres.render.com:5432/ebulletin';

const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('render.com') || process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false
});

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create notices table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notices (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                author VARCHAR(100) DEFAULT 'Admin',
                date VARCHAR(20) NOT NULL,
                deadline DATE,
                section VARCHAR(50) NOT NULL,
                image_url TEXT,
                image_filename VARCHAR(255),
                pdf_filename VARCHAR(255),
                is_static BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert default users if they don't exist
        const userCheck = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCheck.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO users (username, password, role) VALUES
                ('admin', 'password123', 'admin'),
                ('hod', 'password123', 'hod'),
                ('principal', 'password123', 'principal')
            `);
        }

        // Insert vision-mission notice if it doesn't exist
        const noticeCheck = await pool.query("SELECT COUNT(*) FROM notices WHERE section = 'vision-mission'");
        if (parseInt(noticeCheck.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO notices (title, content, author, date, section, is_static) VALUES
                ('Vision & Mission',
                'Vision\nTo emerge as one of the finest technical institutions of higher learning, to develop engineering professionals who are technically competent, ethical and environment friendly for betterment of the society.\n\nMission\nAccomplish stimulating learning environment through high quality academic instruction, innovation and industry-institute interface.',
                'BMSIT&M',
                '01/01/2025',
                'vision-mission',
                TRUE)
            `);
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

module.exports = { pool, initializeDatabase };

