require('dotenv').config(); // Load environment variables from .env file
var express = require('express');
var router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});
/* GET home page. */
router.get('/', function(req, res, next) {
  // Connect to the PostgreSQL database
  pool.connect((err, client, done) => {
    if (err) {
      return console.error('Error acquiring client', err.stack);
    }
    // Begin a transaction
    client.query('BEGIN', (err) => {
      if (err) {
        release(done); // Pass done function to the release function
        return console.error('Error beginning transaction', err.stack);
      }
      // Define the SQL query to insert a new record
      const queryText = 'INSERT INTO Interaction (Type, Subject, Date_Created) VALUES ($1, $2, CURRENT_DATE)';
      // Define the values to be inserted
      const values = ['Surfer', 'Thomas'];
      // Execute the SQL query
      client.query(queryText, values, (err, result) => {
        if (err) {
          client.query('ROLLBACK', () => {
            release(done); // Pass done function to the release function
          });
          return console.error('Error executing query', err.stack);
        }
        // Commit the transaction
        client.query('COMMIT', (err) => {
          if (err) {
            release(done); // Pass done function to the release function
            return console.error('Error committing transaction', err.stack);
          }
          console.log('Transaction completed successfully');
          // Release the client back to the pool
          release(done); // Pass done function to the release function
          // Send a response indicating success
          res.send('Record created successfully');
        });
      });
    });
  });

  // Function to release the client back to the pool
  function release(done) {
    done(); // Call done function to release the client back to the pool
  }
});


// Listen for application shutdown and end the pool
process.on('SIGINT', () => {
  console.log('Shutting down...');
  pool.end(); // End the pool when the application is shutting down
  process.exit(0);
});

module.exports = router;
