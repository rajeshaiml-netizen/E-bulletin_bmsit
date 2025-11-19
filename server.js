const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { pool, initializeDatabase } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Set up the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'image') {
            // Accept image files
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed for image field'));
            }
        } else if (file.fieldname === 'pdf') {
            // Accept PDF files
            if (file.mimetype === 'application/pdf') {
                cb(null, true);
            } else {
                cb(new Error('Only PDF files are allowed for PDF field'));
            }
        } else {
            cb(null, true);
        }
    }
});

// Middleware to serve static files (CSS, uploads)
app.use(express.static(path.join(__dirname, 'public')));
// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve founder images
app.get('/BMSreenivasaiah.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'BMSreenivasaiah.jpg'));
});

app.get('/BSNarayan.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'BSNarayan.jpg'));
});

// Initialize database on startup
initializeDatabase().then(() => {
    console.log('Database ready');
}).catch(err => {
    console.error('Database initialization failed:', err);
});

// --- ROUTES ---

// Login page
app.get('/', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred. Please try again.' });
    }
});

// Dashboard page - displays all notices organized by sections
app.get('/dashboard', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Get the static vision & mission notice
        const visionResult = await pool.query(
            "SELECT * FROM notices WHERE section = 'vision-mission' LIMIT 1"
        );
        const visionMissionNotice = visionResult.rows[0] || null;
        
        // Get other notices grouped by section, filter expired ones, and sort by deadline
        const sections = ['announcement', 'exams', 'placement', 'event'];
        const sectionNotices = {};
        
        for (const section of sections) {
            const result = await pool.query(
                `SELECT * FROM notices 
                 WHERE section = $1 AND is_static = FALSE 
                 AND (deadline IS NULL OR deadline >= $2)
                 ORDER BY deadline ASC NULLS LAST, created_at DESC`,
                [section, today]
            );
            sectionNotices[section] = result.rows;
        }
        
        res.render('dashboard', { 
            visionMissionNotice: visionMissionNotice,
            sectionNotices: sectionNotices
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send('Error loading dashboard');
    }
});

// Page to create a new notice
app.get('/new-notice', (req, res) => {
    res.render('new-notice');
});

// Handle new notice submission with file uploads
app.post('/add-notice', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
    const { title, content, author, section, deadline, imageUrl } = req.body;
    
    if (!title || !content || !section) {
        return res.redirect('/new-notice');
    }

    try {
        const date = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
        const imageFilename = req.files && req.files['image'] ? req.files['image'][0].filename : null;
        const pdfFilename = req.files && req.files['pdf'] ? req.files['pdf'][0].filename : null;
        
        // Convert deadline from DD/MM/YYYY to YYYY-MM-DD for database
        let deadlineDate = null;
        if (deadline) {
            const [day, month, year] = deadline.split('/');
            deadlineDate = `${year}-${month}-${day}`;
        }

        await pool.query(
            `INSERT INTO notices (title, content, author, date, deadline, section, image_url, image_filename, pdf_filename, is_static)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)`,
            [title, content, author || 'Admin', date, deadlineDate, section, imageUrl || null, imageFilename, pdfFilename]
        );

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error adding notice:', error);
        res.redirect('/new-notice');
    }
});

// Handle notice deletion
app.post('/delete-notice/:id', async (req, res) => {
    const noticeId = parseInt(req.params.id, 10);
    try {
        // Get file names before deleting
        const result = await pool.query('SELECT image_filename, pdf_filename FROM notices WHERE id = $1', [noticeId]);
        
        if (result.rows.length > 0) {
            const notice = result.rows[0];
            
            // Delete files from filesystem
            if (notice.image_filename) {
                const imagePath = path.join(uploadsDir, notice.image_filename);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            if (notice.pdf_filename) {
                const pdfPath = path.join(uploadsDir, notice.pdf_filename);
                if (fs.existsSync(pdfPath)) {
                    fs.unlinkSync(pdfPath);
                }
            }
        }
        
        // Delete from database
        await pool.query('DELETE FROM notices WHERE id = $1', [noticeId]);
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error deleting notice:', error);
        res.redirect('/dashboard');
    }
});

// Logout (simple redirect to login)
app.get('/logout', (req, res) => {
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
