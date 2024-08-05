const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const db = require('./config/database');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1 * 60 * 60 * 1000,
        httpOnly: true
    } // 1 hour
}));

app.use((req, res, next) => {
    // console.log('Session data:', req.session);
    res.locals.userId = req.session.userId;
    res.locals.username = req.session.username;
    res.locals.isAdmin = req.session.isAdmin;
    next();
});


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to protect routes
function authMiddleware(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized user' + req.session.userId });
    }
    next();
}

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM Users WHERE username = ?';
    db.query(query, [username], async(err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(400).json({ error: 'User is not registered', navigateToRegister: true });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.isAdmin = user.isAdmin;
        res.status(200).json({ message: 'Logged in successfully', userId: req.session.userId, isAdmin: req.session.isAdmin });
    });
});

// Registration endpoint
app.post('/register', async(req, res) => {
    const { username, useremail, password } = req.body;

    if (!username || !password || !useremail) {
        return res.status(400).send('Please enter all fields');
    }

    try {
        // Check if username or email already exists
        const [existingUsers] = await db.promise().query('SELECT * FROM Users WHERE username = ? OR email = ?', [username, useremail]);

        if (existingUsers.length > 0) {
            return res.status(400).send('Username or email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        // Check if email matches admin format
        const isAdmin = /^expenseadmin\d*@gmail\.com$/.test(useremail);

        await db.promise().query('INSERT INTO Users (username, password, email, isAdmin) VALUES (?, ?, ?, ?)', [username, hashedPassword, useremail, isAdmin]);
        res.status(201).send('User registered');
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Get categories endpoint
app.get('/api/categories', authMiddleware, (req, res) => {
    const query = 'SELECT DISTINCT category FROM Expenses';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ categories: results });
    });
});

app.get('/api/user', authMiddleware, (req, res) => {
    res.status(200).json({ username: req.session.username, isAdmin: req.session.isAdmin });
});


// Create or Update Expense
app.post('/api/expenses', authMiddleware, (req, res) => {
    console.log("Insert API called.");
    const { amount, date, category } = req.body;
    const insert_query = `INSERT INTO Expenses (amount, date, category, user_id) VALUES (?, ?, ?, ?) `;
    db.query(insert_query, [amount, date, category, req.session.userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            id: result.insertId,
            amount,
            date,
            category,
            user_id: req.session.userId
        });
    });
});

// Get Expenses
app.get('/expenses', authMiddleware, (req, res) => {
    const query = req.session.isAdmin ?
        'SELECT * FROM Expenses' :
        'SELECT * FROM Expenses WHERE user_id = ?';
    db.query(query, req.session.isAdmin ? [] : [req.session.userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// Get expenses categories and the total for each category.
app.get('/api/expenses/categories', authMiddleware, (req, res) => {
    const category_query = req.session.isAdmin ?
        'SELECT category, SUM(amount) as category_amount FROM Expenses GROUP BY category ORDER BY category' :
        'SELECT category, SUM(amount) as category_amount FROM Expenses WHERE user_id = ? GROUP BY category ORDER BY category';
    db.query(category_query, req.session.isAdmin ? [] : [req.session.userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// Delete an expense
app.delete('/api/expenses/:id', authMiddleware, (req, res) => {
    const delete_query = req.session.isAdmin ?
        'DELETE FROM Expenses WHERE id = ?' :
        'DELETE FROM Expenses WHERE id = ? AND user_id = ?';
    db.query(delete_query, req.session.isAdmin ? [req.params.id] : [req.params.id, req.session.userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Expense not found!' });
        }
        res.status(200).json({ message: 'Expense deleted successfully' });
    });
});

// Fetch expense by ID
app.get('/api/expenses/:id', authMiddleware, (req, res) => {
    const query = 'SELECT * FROM Expenses WHERE id = ?' + (req.session.isAdmin ? '' : ' AND user_id = ?');
    db.query(query, req.session.isAdmin ? [req.params.id] : [req.params.id, req.session.userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.status(200).json(results[0]);
    });
});

// Update expense
app.put('/api/expenses/:id', authMiddleware, (req, res) => {
    const { amount, date, category } = req.body;
    const update_query = 'UPDATE Expenses SET amount = ?, date = ?, category = ? WHERE id = ?' + (req.session.isAdmin ? '' : ' AND user_id = ?');
    db.query(update_query, req.session.isAdmin ? [amount, date, category, req.params.id] : [amount, date, category, req.params.id, req.session.userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Expense not found or not updated' });
        }
        res.status(200).json({ message: 'Expense updated successfully' });
    });
});

// Chart data endpoint
app.get('/api/chartdata', authMiddleware, async(req, res) => {
    try {
        // Query to get the total expenses for each category
        const query = req.session.isAdmin ?
            'SELECT category, SUM(amount) AS total_amount FROM Expenses GROUP BY category ORDER BY category' :
            'SELECT category, SUM(amount) AS total_amount FROM Expenses WHERE user_id = ? GROUP BY category ORDER BY category';

        const [results] = await db.promise().query(query, req.session.isAdmin ? [] : [req.session.userId]);

        // Process the results to format it for the chart
        const chartData = results.map(row => ({
            category: row.category,
            total_amount: row.total_amount
        }));

        res.status(200).json(chartData);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});



// Implement the routing for the pages so that the session is maintained
app.get('/dashboard', authMiddleware, (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

app.get('/add-expense', authMiddleware, (req, res) => {
    res.sendFile(__dirname + '/public/addExpense.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/editExpense', authMiddleware, (req, res) => {
    res.sendFile(__dirname + '/public/editExpense.html');
});

//admin handler for the ejs file
app.get('/admin', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.render('admin', { session: req.session, adminNavs: [], cardData: [] });
    } else {
        res.redirect('/login');
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/login.html');
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});