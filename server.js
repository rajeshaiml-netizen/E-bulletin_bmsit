const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Import dummy data
let { users, notices } = require('./data');

// Set up the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to serve static files (CSS)
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

// --- ROUTES ---

// Login page
app.get('/', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // In a real app, you would use sessions here.
        // For this demo, we'll just redirect.
        res.redirect('/dashboard');
    } else {
        res.render('login', { error: 'Invalid username or password' });
    }
});

// Dashboard page - displays all notices organized by sections
app.get('/dashboard', (req, res) => {
    // Get the static vision & mission notice
    const visionMissionNotice = notices.find(notice => notice.section === 'vision-mission');
    
    // Get other notices grouped by section
    const sectionNotices = {
        'announcement': notices.filter(notice => notice.section === 'announcement' && !notice.isStatic).sort((a, b) => b.id - a.id),
        'exams': notices.filter(notice => notice.section === 'exams' && !notice.isStatic).sort((a, b) => b.id - a.id),
        'placement': notices.filter(notice => notice.section === 'placement' && !notice.isStatic).sort((a, b) => b.id - a.id),
        'event': notices.filter(notice => notice.section === 'event' && !notice.isStatic).sort((a, b) => b.id - a.id)
    };
    
    res.render('dashboard', { 
        visionMissionNotice: visionMissionNotice,
        sectionNotices: sectionNotices
    });
});

// Page to create a new notice
app.get('/new-notice', (req, res) => {
    res.render('new-notice');
});

// Handle new notice submission
app.post('/add-notice', (req, res) => {
    const { title, content, author, section } = req.body;
    if (title && content && section) {
        const newNotice = {
            id: notices.length + 1,
            title: title,
            content: content,
            author: author || 'Admin', // Default author if not provided
            date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
            section: section,
            imageUrl: req.body.imageUrl || null, // Optional image URL
            isStatic: false
        };
        notices.push(newNotice);
    }
    res.redirect('/dashboard');
});

// Handle notice deletion
app.post('/delete-notice/:id', (req, res) => {
    const noticeId = parseInt(req.params.id, 10);
    notices = notices.filter(notice => notice.id !== noticeId);
    res.redirect('/dashboard');
});

// Logout (simple redirect to login)
app.get('/logout', (req, res) => {
    res.redirect('/');
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});