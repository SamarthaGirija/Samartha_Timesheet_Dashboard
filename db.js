// ----------------------------------------------
// DATABASE CONNECTION SETUP
// ----------------------------------------------

// Import the MySQL module
const mysql = require('mysql');

// Create a connection to the database using the provided credentials
const db = mysql.createConnection({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: 'root123',
  database: 'time_s'
});



// ----------------------------------------------
// CONNECT TO THE DATABASE
// ----------------------------------------------

// Establish a connection to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  // Log a success message if the connection was established
  console.log('Connected to the database');
});




// Export the database connection for use in other modules
module.exports = db;