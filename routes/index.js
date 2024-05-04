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

router.get('/getNewCommands', function(req, res, next) {
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
      const selectQuery = 'SELECT * FROM Commands WHERE hasBeenSeen = false';
      
      try {
        // Execute the select query
        const selectResult = await client.query(selectQuery);
        console.log('Unseen commands:', selectResult.rows);
        res.send(selectResult.rows); // Send the records to the client

        // Define the SQL query to update hasBeenSeen to true
        const updateQuery = 'UPDATE Commands SET hasBeenSeen = true WHERE hasBeenSeen = false';
        await client.query(updateQuery);
        
        // Commit the transaction
        await client.query('COMMIT');
        console.log('Updated hasBeenSeen and committed transaction');

      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during transaction, rolled back.', err.stack);
        res.status(500).send('Error processing commands');
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

function cleanPhoneNumber(phone) {
  // Remove spaces, dashes, parentheses, and any non-digit characters
  let cleaned = phone.replace(/[^\d]/g, '');
  // Return the last 10 digits only, assuming they represent the local phone number part
  return cleaned.slice(-10);
}


router.get('/newUser', function(req, res, next) {
  const username = req.query.username; // Retrieve the username from the query parameters
  const rawPhone = req.query.phone; // Retrieve the raw phone number from the query parameters
  const phone = cleanPhoneNumber(rawPhone); // Clean and format the phone number
  const password = req.query.password; // Retrieve the password from the query parameters

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
      // Define the SQL query to insert a new user
      const queryText = 'INSERT INTO users (Username, Phone, Password) VALUES ($1, $2, $3) RETURNING Token';
      // Define the values to be inserted
      const values = [username, phone, password];
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
          release(done); // Release the client back to the pool
          res.send({ message: 'Signup successful', token: result.rows[0].token });
        });
      });
    });
  });

  // Function to release the client back to the pool
  function release(done) {
    done(); // Call done function to release the client back to the pool
  }
});

router.get('/login', function(req, res, next) {
  const rawPhone = req.query.phone; // Retrieve the raw phone number from the query parameters
  const phone = cleanPhoneNumber(rawPhone); // Clean and format the phone number
  const password = req.query.password; // Retrieve the password from the query parameters

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
      // Define the SQL query to verify a user and get their token
      const queryText = 'SELECT Token FROM users WHERE Phone = $1 AND Password = $2';
      // Define the values for the query
      const values = [phone, password];
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
          release(done); // Release the client back to the pool
          if (result.rows.length > 0) {
            // Send the token as part of the response
            res.send({ message: 'Login successful', token: result.rows[0].token });
          } else {
            res.status(401).send('Invalid credentials');
          }
        });
      });
    });
  });

  // Function to release the client back to the pool
  function release(done) {
    done(); // Call done function to release the client back to the pool
  }
});




router.get('/newMessage', function(req, res, next) {
  const token = req.query.token; // Retrieve the token from the query parameters
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
      // Define the SQL query to find the username associated with the token
      const userQuery = 'SELECT Username FROM users WHERE Token = $1';
      // Execute the query to fetch the username
      client.query(userQuery, [token], (err, userResult) => {
        if (err || userResult.rows.length === 0) {
          client.query('ROLLBACK', () => {
            release(done); // Pass done function to the release function
            res.status(401).send('Invalid token or user not found');
          });
          return;
        }
        // Extract the username from the result
        const username = userResult.rows[0].username;
        // Define the SQL query to insert a new message
        const messageQuery = 'INSERT INTO Messages (sender, receiver, message) VALUES ($1, $2, $3)';
        // Define the values to be inserted, with sender now as the username fetched by the token
        const messageValues = [username, 'Deet', message];
        // Execute the SQL query to insert the message
        client.query(messageQuery, messageValues, (err, messageResult) => {
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
            release(done); // Release the client back to the pool
            // Send a response indicating success
            res.send('Message sent successfully');
          });
        });
      });
    });
  });

  // Function to release the client back to the pool
  function release(done) {
    done(); // Call done function to release the client back to the pool
  }
});


router.get('/newCommand', function(req, res, next) {
  const token = req.query.token; // Retrieve the token from the query parameters
  const command = req.query.command; // Retrieve the command from the query parameters
  const params = req.query.params; // Retrieve the params from the query parameters

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
      // Define the SQL query to find the username associated with the token
      const userQuery = 'SELECT username FROM users WHERE token = $1';
      // Execute the query to fetch the username
      client.query(userQuery, [token], (err, userResult) => {
        if (err || userResult.rows.length === 0) {
          client.query('ROLLBACK', () => {
            release(done); // Pass done function to the release function
            res.status(401).send('Invalid token or user not found');
          });
          return;
        }
        // Extract the username from the result
        const sender = userResult.rows[0].username;
        // Define the SQL query to insert a new command
        const commandQuery = 'INSERT INTO Commands (sender, receiver, date_created, params, hasbeenseen) VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)';
        // Define the values to be inserted
        const commandValues = [sender, 'Deet', command + " " + params, false]; // Assuming Deet is the receiver and command hasn't been seen yet
        // Execute the SQL query to insert the command
        client.query(commandQuery, commandValues, (err, commandResult) => {
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
            release(done); // Release the client back to the pool
            // Send a response indicating success
            res.send('Command sent successfully');
          });
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
