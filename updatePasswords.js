const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the database connection
const db = require('./config/database');

async function updatePasswords() {
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
            // Remove spaces from the username
            const modifiedPassword = username.replace(/\s+/g, '');

            // Hash the modified password
            const hashedPassword = await bcrypt.hash(modifiedPassword, 8);

            // Update the user's password in the database
            await query('UPDATE Users SET password = ? WHERE id = ?', [hashedPassword, userId]);

            console.log(`Password for user ${username} updated successfully`);
        }
    } catch (err) {
        console.error('Error updating passwords:', err);
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

updatePasswords();