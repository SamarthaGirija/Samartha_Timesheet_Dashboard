
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();
const fetch = require("node-fetch");
const axios = require('axios');
const http = require('http')
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));
//app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

/*
// Middleware to process data received from another route
app.use((req, res, next) => {
  // Process data received from another route
  // Modify or augment the data as needed
  
  req.processedData = processData(req.data);
  next();
});
*/


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});



app.get('/index', (req, res) => {

  res.sendFile(path.join(__dirname,'public', 'index.html'));
});




app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using https
}));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Function to get user by username and password
async function getUserByUsernameAndPassword(username, password) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM ud WHERE username = ? AND password = ?', [username, password], (err, results) => {
      if (err) {
        return reject(err);
      }
      if (results.length > 0) {
        resolve(results[0]);
      } else {
        resolve(null);
      }
    });
  });
}

// Function to get user by username
async function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM ud WHERE username = ?', [username], (err, results) => {
      if (err) {
        return reject(err);
      }
      if (results.length > 0) {
        resolve(results[0]);
      } else {
        resolve(null);
      }
    });
  });
}

const r1 = express.Router();

r1.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await getUserByUsernameAndPassword(username, password);

    if (user) {
      if (password === user.password) {
        req.session.loggedin = true;
     //   req.session.eid = user.eid;
     //    res.redirect(`/getUserDetails/${username}`);

     const user = await getUserByUsername(username);

     if (user) {
      res.status(200).json({ user });
     //res.redirect('/index');
    }


      } else {
        res.status(401).json({ success: false, message: 'Incorrect username or password' });
      }
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ success: false, message: 'Error logging in' });
  }
});

/*
// Route to get user details by username
r1.get('/getUserDetails/:username', async (req, res) => {
  if (!req.session.loggedin) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { username } = req.params;

  try {
    const user = await getUserByUsername(username);

    if (user) {
      res.status(200).json({ success: true, user });
     //res.redirect('/index');
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ success: false, message: 'Error fetching user details' });
  }
});
*/

app.use('/', r1);









































    /*
  if (userId) {
    fetchUserDetails(userId);
   // window.location.href = '/index';
  } else {
    console.error('User ID is not available. Please login first.');
  }
     // res.status(200).json({ success: true, userId: req.session.eid });
  } else {
      res.status(401).json({ success: false, message: 'Not logged in' });
  }


*/







































// Existing login route
/*
const r1 = express.Router()
r1.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
      const user = await getUserByUsernameAndPassword(username, password);

      if (user) {
          if (password === user.password) {
              req.session.loggedin = true;
              const userId = req.session.userId;
              req.session.userId = user.userId;
             // res.status(200).json({ success: true, userId: user.userId });
             res.redirect('/index');
          } else {
              res.status(401).json({ success: false, message: 'Incorrect username or password' });
          }
      } else {
          res.status(404).json({ success: false, message: 'User not found' });
      }
  } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).json({ success: false, message: 'Error logging in' });
  }
});

// Function to get user by username and password from the database
async function getUserByUsernameAndPassword(username, password) {
  return new Promise((resolve, reject) => {
      db.query('SELECT * FROM ud WHERE username = ? AND password = ?', [username, password], (err, results) => {
          if (err) {
              return reject(err);
          }
          if (results.length > 0) {
              resolve(results[0]);
          } else {
              resolve(null);
          }
      });
  });
}


*/


/*

const r2 = express.Router()
r2.get("/fetchbyuserid/:userId", async (req, res) => {
  try {
   // const userId = req.params.userId;
    const userId = req.session.userId;
    const result = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM ud WHERE eid = ?', [userId], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});
*/

const r2 = express.Router();
r2.post('/add-event', (req, res) => {
  const { title, description, timeFrom, timeTo, day, month, year } = req.body;

  if (!title || !description || !timeFrom || !timeTo || !day || !month || !year) {
    res.status(400).json({ error: 'Please provide all the required fields.' });
    return;
  }

  const query = 'INSERT INTO tasks (title, description, timeFrom, timeTo, day, month, year) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const values = [title, description, timeFrom, timeTo, day, month, year];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Failed to add the event.' });
      return;
    }
    res.status(200).json({ message: 'Event added successfully.', eventId: result.insertId });
  });
});

  



/*

// Endpoint to fetch events by day, month, and year
const r4 = express.Router();
r4.get('/events/:day/:month/:year', (req, res) => {
  const { day, month, year } = req.query;

  if (!day || !month || !year) {
      res.status(400).json({ error: 'Please provide day, month, and year.' });
      return;
  }

  const query = 'SELECT * FROM tasks WHERE day = ? AND month = ? AND year = ?';
  const values = [day, month, year];

  db.query(query, values, (err, results) => {
      if (err) {
          console.error('Error executing query:', err);
          res.status(500).json({ error: 'Failed to fetch events.' });
          return;
      }
      res.status(200).json(results);
  });
});

*/




/*

const r4 = express.Router();

r4.get('/events/:day/:month/:year', (req, res) => {
  const { day, month, year } = req.params;

  if (!day || !month || !year) {
    res.status(400).json({ error: 'Please provide day, month, and year.' });
    return;
  }

  const dayInt = parseInt(day, 10);
  const monthInt = parseInt(month, 10);
  const yearInt = parseInt(year, 10);

  if (isNaN(dayInt) || isNaN(monthInt) || isNaN(yearInt)) {
    res.status(400).json({ error: 'Day, month, and year must be valid numbers.' });
    return;
  }

  const query = 'SELECT * FROM tasks WHERE day = ? AND month = ? AND year = ?';
  const values = [dayInt, monthInt, yearInt];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Failed to fetch events.' });
      return;post
    }
    res.status(200).json(results);
  });
});
*/
app.use(r1, r2);


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
