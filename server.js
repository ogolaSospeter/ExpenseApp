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
    cookie: { secure: false, maxAge: 1 * 60 * 60 * 1000 } // 1 hour
}));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
// app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to protect routes
function authMiddleware(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Middleware to check admin status
function adminMiddleware(req, res, next) {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
}

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log('Login request received:', username);

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
        console.error('Error registering user:', error);
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

// Create or Update Expense
app.post('/api/expenses', authMiddleware, (req, res) => {
    console.log("Insert API called.");
    const { amount, date, category } = req.body;
    const insert_query = `INSERT INTO Expenses (amount, date, category, user_id) VALUES (?, ?, ?, ?) `;
    console.log('Values to be passed: ', amount, date, category, req.session.userId);

    db.query(insert_query, [amount, date, category, req.session.userId], (err, result) => {
        if (err) {
            console.log('An error occurred: ', err);
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
            console.log('Error in fetching the category data and amounts: ', err);
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
            console.log('Error in deleting the expense: ', err);
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            console.log('Expense not found');
            return res.status(404).json({ error: 'Expense not found!' });
        }
        console.log('Expense deleted successfully');
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
app.get('/chartdata', authMiddleware, async(req, res) => {
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
        s

        res.status(200).json(chartData);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ error: 'Server error' });
    }
});



// Implement the routing for the pages so that the session is maintained
app.get('/dashboard', authMiddleware, (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

app.get('/add-expense', authMiddleware, (req, res) => {
    res.sendFile(__dirname + '/public/add-expense.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/login', (req, res) => {
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



// const express = require('express');
// const bodyParser = require('body-parser');
// const mysql = require('mysql2');
// const bcrypt = require('bcryptjs');
// const session = require('express-session');
// const db = require('./config/database');
// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 3000;

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: false, maxAge: 1 * 60 * 60 * 1000 } // 1 hours
// }));

// app.use(express.static('public'));

// // Middleware to protect routes
// function authMiddleware(req, res, next) {
//     if (!req.session.userId) {
//         return res.status(401).json({ error: 'Unauthorized' });
//     }
//     next();
// }

// app.post('/login', (req, res) => {
//     const { username, password } = req.body;

//     console.log('Login request received:', username);

//     const query = 'SELECT * FROM Users WHERE username = ?';
//     db.query(query, [username], async(err, results) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         if (results.length === 0) {
//             return res.status(400).json({ error: 'User is not registered', navigateToRegister: true });
//         }

//         const user = results[0];
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ error: 'Invalid credentials' });
//         }

//         req.session.userId = user.id;
//         req.session.username = user.username;

//         res.status(200).json({ message: 'Logged in successfully', userId: req.session.userId });
//         //clear all the fields after successful login


//     });
// });

// // Registration endpoint
// app.post('/register', async(req, res) => {
//     const { username, useremail, password } = req.body;

//     if (!username || !password || !useremail) {
//         return res.status(400).send('Please enter all fields');
//     }

//     try {
//         // Check if username or email already exists
//         const [existingUsers] = await db.promise().query('SELECT * FROM Users WHERE username = ? OR email = ?', [username, useremail]);

//         if (existingUsers.length > 0) {
//             return res.status(400).send('Username or email already exists');
//         }

//         const hashedPassword = await bcrypt.hash(password, 8);

//         await db.promise().query('INSERT INTO Users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, useremail]);

//         res.status(201).send('User registered');
//     } catch (error) {
//         console.error('Error registering user:', error);
//         res.status(500).send('Server error');
//     }
// });

// app.get('/api/categories', authMiddleware, (req, res) => {
//     const query = 'SELECT DISTINCT category FROM Expenses';
//     db.query(query, (err, results) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.status(200).json({ categories: results });
//     });
// });

// // Create or Update Expense
// app.post('/api/expenses', authMiddleware, (req, res) => {
//     console.log("Insert API called.");
//     const { amount, date, category } = req.body;
//     const insert_query = `INSERT INTO Expenses (amount, date, category, user_id) VALUES (?, ?, ?, ?) `;
//     console.log('Values to be passed: ', amount, date, category, req.session.userId);

//     db.query(insert_query, [amount, date, category, req.session.userId], (err, result) => {
//         if (err) {
//             console.log('An error occurred: ', err);
//             return res.status(500).json({ error: err.message });
//         }
//         res.status(201).json({
//             id: result.insertId,
//             amount,
//             date,
//             category,
//             user_id: req.session.userId
//         });
//     });
// });

// // Get Expenses
// app.get('/expenses', authMiddleware, (req, res) => {
//     const query = 'SELECT * FROM Expenses WHERE user_id = ?';
//     db.query(query, [req.session.userId], (err, results) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.status(200).json(results);
//     });
// });

// // Get expenses categories and the total for each category.
// app.get('/api/expenses/categories', authMiddleware, (req, res) => {
//     const category_query = 'SELECT category, SUM(amount) as category_amount FROM Expenses WHERE user_id = ? GROUP BY category ORDER BY category';
//     db.query(category_query, [req.session.userId], (err, results) => {
//         if (err) {
//             console.log('Error in fetching the category data and amounts: ', err);
//             return res.status(500).json({ error: err.message });
//         }
//         res.status(200).json(results);
//     });
// });

// // Delete an expense
// app.delete('/api/expenses/:id', authMiddleware, (req, res) => {
//     const delete_query = 'DELETE FROM Expenses WHERE id = ? AND user_id = ?';
//     db.query(delete_query, [req.params.id, req.session.userId], (err, result) => {
//         if (err) {
//             console.log('Error in deleting the expense: ', err);
//             return res.status(500).json({ error: err.message });
//         }
//         if (result.affectedRows === 0) {
//             console.log('Expense not found');
//             return res.status(404).json({ error: 'Expense not found!' });
//         }
//         console.log('Expense deleted successfully');
//         res.status(200).json({ message: 'Expense deleted successfully' });
//     });
// });


// // Fetch expense by ID
// app.get('/api/expenses/:id', authMiddleware, (req, res) => {
//     const query = 'SELECT * FROM Expenses WHERE id = ? AND user_id = ?';
//     db.query(query, [req.params.id, req.session.userId], (err, results) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         if (results.length === 0) {
//             return res.status(404).json({ error: 'Expense not found' });
//         }
//         res.status(200).json(results[0]);
//     });
// });

// // Update expense
// app.put('/api/expenses/:id', authMiddleware, (req, res) => {
//     const { amount, date, category } = req.body;
//     const update_query = 'UPDATE Expenses SET amount = ?, date = ?, category = ? WHERE id = ? AND user_id = ?';

//     db.query(update_query, [amount, date, category, req.params.id, req.session.userId], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'Expense not found or not updated' });
//         }
//         res.status(200).json({ message: 'Expense updated successfully' });
//     });
// });

// //Implement the routing for the pages so that the session is maintained
// app.get('/dashboard.html', authMiddleware, (req, res) => {
//     res.sendFile(__dirname + '/public/dashboard.html');
// });

// app.get('/add-expense.html', authMiddleware, (req, res) => {
//     res.sendFile(__dirname + '/public/add-expense.html');
// });

// app.get('/register.html', (req, res) => {
//     res.sendFile(__dirname + '/public/register.html');
// });

// app.get('/login.html', (req, res) => {
//     res.sendFile(__dirname + '/public/login.html');
// });

// app.get('/editExpense.html', authMiddleware, (req, res) => {
//     res.sendFile(__dirname + '/public/editExpense.html');
// });

// // Logout
// app.get('/logout', (req, res) => {
//     req.session.destroy((error) => {
//         if (error) {
//             res.status(500).send('Error logging out');
//         } else {
//             res.status(200).send('Logged out');
//         }
//     });
// });

// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });

// /************************************************************ */

// // const express = require('express');
// // const bodyParser = require('body-parser');
// // const mysql = require('mysql2');
// // const bcrypt = require('bcryptjs');
// // const session = require('express-session');
// // const db = require('./config/database');

// // require('dotenv').config();

// // const app = express();
// // const port = process.env.PORT || 3000;

// // app.use(bodyParser.json());
// // app.use(bodyParser.urlencoded({ extended: true }));
// // app.use(session({
// //     secret: process.env.SESSION_SECRET,
// //     resave: false,
// //     saveUninitialized: false
// // }));

// // app.use(express.static('public'));

// // // Middleware to protect routes
// // function authMiddleware(req, res, next) {
// //     if (!req.session.userId) {
// //         return res.status(401).json({ error: 'Unauthorized' });
// //     }
// //     next();
// // }


// // app.post('/login', (req, res) => {
// //     const { username, password } = req.body;

// //     console.log('Login request received:', username);

// //     const query = 'SELECT * FROM Users WHERE username = ?';
// //     db.query(query, [username], async(err, results) => {
// //         if (err) {
// //             return res.status(500).json({ error: err.message });
// //         }
// //         if (results.length === 0) {
// //             return res.status(400).json({ error: 'User is not registered', navigateToRegister: true });
// //         }

// //         const user = results[0];
// //         const isMatch = await bcrypt.compare(password, user.password);
// //         if (!isMatch) {
// //             return res.status(400).json({ error: 'Invalid credentials' });
// //         }

// //         req.session.userId = user.id;
// //         req.session.username = user.username;

// //         res.status(200).json({ message: 'Logged in successfully', userId: req.session.userId });
// //     });
// // });

// // // Registration endpoint
// // app.post('/register', async(req, res) => {
// //     const { username, useremail, password } = req.body;

// //     if (!username || !password || !useremail) {
// //         return res.status(400).send('Please enter all fields');
// //     }

// //     try {
// //         // Check if username or email already exists
// //         const [existingUsers] = await db.promise().query('SELECT * FROM Users WHERE username = ? OR email = ?', [username, useremail]);

// //         if (existingUsers.length > 0) {
// //             return res.status(400).send('Username or email already exists');
// //         }

// //         const hashedPassword = await bcrypt.hash(password, 8);

// //         await db.promise().query('INSERT INTO Users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, useremail]);

// //         res.status(201).send('User registered');
// //     } catch (error) {
// //         console.error('Error registering user:', error);
// //         res.status(500).send('Server error');
// //     }
// // });

// // // server.js

// // app.get('/api/categories', (req, res) => {
// //     const query = 'SELECT DISTINCT category FROM Expenses';
// //     db.query(query, (err, results) => {
// //         if (err) {
// //             return res.status(500).json({ error: err.message });
// //         }
// //         res.status(200).json({ categories: results });
// //     });
// // });


// // // Create or Update Expense
// // app.post('/api/expenses', authMiddleware, (req, res) => {
// //     console.log("Insert API called.")
// //     const { amount, date, category, } = req.body;
// //     const insert_query = `INSERT INTO Expenses (amount, date, category, user_id) VALUES (?, ?, ?, ?) `;
// //     console.log('Values to be passed, ', amount + date + category + req.session.userId)

// //     db.query(insert_query, [amount, date, category, req.session.userId], (err, result) => {
// //         if (err) {
// //             console.log('An error occured, error value , ', err)
// //             return res.status(500).json({ error: err.message });
// //         }
// //         res.status(201).json({
// //             id: result.insertId,
// //             amount,
// //             date,
// //             category,
// //             user_id: req.session.userId
// //         });
// //     });
// // });

// // // Get Expenses
// // app.get('/expenses', authMiddleware, (req, res) => {
// //     const query = `
// //         SELECT * FROM expenses
// //     `;

// //     db.query(query, (err, results) => {
// //         if (err) {
// //             return res.status(500).json({ error: err.message });
// //         }
// //         res.status(200).json(results);
// //     });
// // });

// // //Get expenses categories and the total for each category.
// // app.get('/api/expenses/categories', authMiddleware, (req, res) => {
// //     const category_query = `
// //     SELECT DISTINCT category, SUM(amount) as category_amount FROM Expenses GROUP BY category ORDER BY category
// //     `
// //     db.query(category_query, (err, results) => {
// //         if (err) {
// //             console.log('Error in fetching the category data and amounts due to error,', err)
// //             return res.status(500).json({ error: err.message });

// //         }
// //         res.status(200).json(results);
// //         console.log("Category data fetched successfully");
// //     });
// // });

// // //Delete an expense
// // app.delete('/api/expenses/:id', authMiddleware, (req, res) => {
// //     const delete_query = `DELETE FROM Expenses WHERE id = ? AND user_id = ?`;
// //     db.query(delete_query, [req.params.id, req.session.userId], (err, result) => {
// //         if (err) {
// //             console.log('Error in deleting the expense due to error,', err)
// //             return res.status(500).json({ error: err.message });

// //         }
// //         if (result.affectedRows === 0) {
// //             console.log('Expense not found')
// //             return res.status(404).json({ error: 'Expense not found!' });
// //         }
// //         console.log('Expense deleted successfully')
// //         res.status(200).json({ message: 'Expense deleted successfully' });
// //     });
// // });

// // app.get('/editExpense.html', (req, res) => {
// //     res.sendFile(__dirname + '/public/editExpense.html');
// // });

// // //edit an expense
// // app.post('/api/expenses/:id', authMiddleware, (req, res) => {
// //     const { amount, date, category } = req.body;
// //     const update_query = `UPDATE Expenses SET amount = ?, date = ?, category = ? WHERE id = ? AND user_id = ?`;
// //     db.query(update_query, [amount, date, category, req.params.id, req.session.userId], (err, result) => {
// //         if (err) {
// //             console.log('Error in updating the expense due to error,', err)
// //             return res.status(500).json({ error: err.message });
// //         }
// //         if (result.affectedRows === 0) {
// //             console.log('Expense not found')
// //             return res.status(404).json({ error: 'Expense not found!' });
// //         }
// //         console.log('Expense updated successfully')
// //         res.status(200).json({ message: 'Expense updated successfully' });
// //     });
// // });




















// // app.get('/logout', (req, res) => {
// //     req.session.destroy((error) => {
// //         if (error) {
// //             res.status(500).send('Error logging out');
// //         } else {
// //             res.status(200).send('Logged out');
// //         }
// //     });
// // });




// // app.listen(port, () => {
// //     console.log(`Server is running on port ${port}`);
// // });