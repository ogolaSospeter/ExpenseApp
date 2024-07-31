const mysql = require('mysql2');
require('dotenv').config();

// Import the database connection
const db = require('./config/database');

async function updateEmails() {
    try {
        console.log('MySQL connected');

        // Promisify the query method for async/await support
        const query = (sql, params) => {
            return new Promise((resolve, reject) => {
                db.query(sql, params, (error, results) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(results);
                });
            });
        };

        // Query to select all users
        const rows = await query('SELECT id, username FROM Users');
        console.log('Users retrieved:', rows);

        for (const row of rows) {
            const userId = row.id;
            const username = row.username;
            // Construct the email address
            const email = `${username.replace(/\s+/g, '').toLowerCase()}@gmail.com`;

            // Update the user's email in the database
            await query('UPDATE Users SET email = ? WHERE id = ?', [email, userId]);

            console.log(`Email for user ${username} updated to ${email}`);
        }
    } catch (err) {
        console.error('Error updating emails:', err);
    } finally {
        // Close the database connection
        db.end((error) => {
            if (error) {
                console.error('Error closing the connection:', error);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

updateEmails();