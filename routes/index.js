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

router.get('/getNewInteractions', function(req, res, next) {
  // Connect to the PostgreSQL database
  pool.connect((err, client, done) => {
    if (err) {
      return console.error('Error acquiring client', err.stack);
    }
    // Begin a transaction
    client.query('BEGIN', async (err) => {
      if (err) {
        release(done); // Pass done function to the release function
        return console.error('Error beginning transaction', err.stack);
      }
      // Define the SQL query to select all records where hasBeenSeen is false
      const selectQuery = 'SELECT * FROM interaction WHERE hasBeenSeen = false';
      
      try {
        // Execute the select query
        const selectResult = await client.query(selectQuery);
        console.log('Unseen interactions:', selectResult.rows);
        res.send(selectResult.rows); // Send the records to the client

        // Define the SQL query to update hasBeenSeen to true
        const updateQuery = 'UPDATE interaction SET hasBeenSeen = true WHERE hasBeenSeen = false';
        await client.query(updateQuery);
        
        // Commit the transaction
        await client.query('COMMIT');
        console.log('Updated hasBeenSeen and committed transaction');

      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during transaction, rolled back.', err.stack);
        res.status(500).send('Error processing interactions');
      } finally {
        // Release the client back to the pool
        done();
      }
    });
  });
});

router.get('/getMessages', function(req, res, next) {
  // Connect to the PostgreSQL database
  pool.connect((err, client, done) => {
      if (err) {
          console.error('Error acquiring client', err.stack);
          res.status(500).send('Error acquiring database connection');
          return;
      }

      // Define the SQL query to select all messages, sorted by date_created in descending order
      const selectQuery = 'SELECT * FROM Messages ORDER BY date_created DESC';

      // Execute the select query
      client.query(selectQuery, (err, result) => {
          done(); // Release the client back to the pool
          if (err) {
              console.error('Error executing select query', err.stack);
              res.status(500).send('Error fetching messages');
          } else {
              console.log('Fetched all messages sorted by date:', result.rows);
              res.send(result.rows); // Send the records to the client
          }
      });
  });
});


function release(done) {
  done();
}

router.get('/newMessage', function(req, res, next) {
  const message = req.query.message; // Retrieve the message from the query parameters

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
      // Define the SQL query to insert a new message
      const queryText = 'INSERT INTO Messages (sender, receiver, message) VALUES ($1, $2, $3)';
      // Define the values to be inserted, with sender and receiver hardcoded
      const values = ['Anonymous', 'Deet', message];
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
          res.send('Message sent successfully');
        });
      });
    });
  });

  // Function to release the client back to the pool
  function release(done) {
    done(); // Call done function to release the client back to the pool
  }
});




router.get('/newInteraction', function(req, res, next) {
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
