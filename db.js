// db.js - Database connection and setup
const Database = require('better-sqlite3');
const path = require('path');

// Use SQLite for local development
const dbPath = path.join(__dirname, 'ebulletin.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT DEFAULT 'Admin',
        date TEXT NOT NULL,
        deadline DATE,
        section TEXT NOT NULL,
        image_url TEXT,
        image_filename TEXT,
        pdf_filename TEXT,
        is_static BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Prepare statements for better performance
const statements = {
    getUser: db.prepare('SELECT * FROM users WHERE username = ? AND password = ?'),
    getVisionMission: db.prepare("SELECT * FROM notices WHERE section = 'vision-mission' LIMIT 1"),
    getNoticesBySection: db.prepare(`
        SELECT * FROM notices 
        WHERE section = ? AND is_static = 0 
        AND (deadline IS NULL OR deadline >= ?)
        ORDER BY deadline ASC, created_at DESC
    `),
    insertUser: db.prepare('INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)'),
    insertNotice: db.prepare('INSERT OR IGNORE INTO notices (title, content, author, date, section, is_static) VALUES (?, ?, ?, ?, ?, ?)'),
    checkUsersCount: db.prepare('SELECT COUNT(*) as count FROM users'),
    checkNoticesCount: db.prepare("SELECT COUNT(*) as count FROM notices WHERE section = 'vision-mission'")
};

// Initialize database with default data
function initializeDatabase() {
    try {
        // Insert default users if table is empty
        const userCount = statements.checkUsersCount.get().count;
        if (userCount === 0) {
            const defaultUsers = [
                ['admin', 'password123', 'admin'],
                ['hod', 'password123', 'hod'],
                ['principal', 'password123', 'principal']
            ];
            for (const user of defaultUsers) {
                statements.insertUser.run(...user);
            }
        }

        // Insert vision-mission notice if it doesn't exist
        const noticeCount = statements.checkNoticesCount.get().count;
        if (noticeCount === 0) {
            statements.insertNotice.run(
                'Vision & Mission',
                'Vision\nTo emerge as one of the finest technical institutions of higher learning, to develop engineering professionals who are technically competent, ethical and environment friendly for betterment of the society.\n\nMission\nAccomplish stimulating learning environment through high quality academic instruction, innovation and industry-institute interface.',
                'BMSIT&M',
                '01/01/2025',
                'vision-mission',
                1
            );
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Wrapper functions to mimic pool.query interface
const pool = {
    query: async (sql, params = []) => {
        try {
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                const stmt = db.prepare(sql);
                const rows = stmt.all(...params);
                return { rows };
            } else {
                const stmt = db.prepare(sql);
                const result = stmt.run(...params);
                return { rowCount: result.changes };
            }
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }
};

module.exports = { pool, initializeDatabase, db };

