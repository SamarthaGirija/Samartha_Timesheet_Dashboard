const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');
const express = require('express');
const session = require('express-session');
const ExcelJS = require('exceljs');
const fs = require('fs');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const db = require('./db'); // Assuming db.js exports the MySQL connection
require('dotenv').config();

//main app creation in express
const app = express();
const PORT = process.env.PORT || 3000;




// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'sinchana',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static('public'));


// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');




// Route for fetching data based on route parameters
app.get('/ud/:id',(req,res)=>{
  db.query('SELECT * FROM ud where eid=1',[req.params.id],(err,rows)=>{
    if(err){
      console.log(err)
    }
    else{
      res.json(rows);
    }
  })
});


// Route for fetching tasks based on route parameters

app.get('/events/:eid/:day/:month/:year', (req, res) => {
  const { eid, day, month, year } = req.params;
  //query to take details from tasks table
  const query = `SELECT t.*, te.timeFrom, te.timeTo
FROM tasks t
JOIN task_emp_assoc te ON t.tid = te.tid
WHERE te.eid = ? AND te.day = ? AND te.month = ? AND te.year = ?;
`;

  const values = [eid, day, month, year];
  
  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Failed to fetch events.' });
      return;
    }
    res.json(results);
  });
});


// Route for calculating totalhours for a specific day

app.get('/totalHours/:eid/:year/:month/:day', (req, res) => {
  const {eid,year, month, day } = req.params;

  // Construct the date in YYYY-MM-DD format
  const date = `${year}-${month}-${day}`;

  //query to fetch the sum of totalHours for the specified day
  const query = 'SELECT SUM(te.totalHours) AS totalHours FROM task_emp_assoc te JOIN tasks t ON te.tid = t.tid WHERE te.eid = ? AND te.year = ? AND te.month = ? AND te.day = ?';

  const values = [eid,year, month, day];

  db.query(query, values, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Failed to fetch tasks.' });
      return;
    }

    // Extract the totalHours from the results
    const totalHours = results[0].totalHours || 0; // If no tasks found, default to 0

    res.status(200).json({ totalHours });

  });
});


// Route for calculating totalhours for a each day in a month

app.get('/totalHours/:eid/:year/:month', (req, res) => {
  const year = req.params.year;
  const month = req.params.month;
  const eid=req.params.eid;

  const query = 'SELECT te.day, SUM(te.totalHours) AS totalHours FROM time_s.task_emp_assoc te JOIN time_s.tasks t ON te.tid = t.tid WHERE te.eid = ? AND te.year = ? AND te.month = ? GROUP BY te.day ORDER BY te.day';

  db.query(query, [eid, year, month], (err, results) => {
    if (err) {
      console.error('Error fetching data from the database:', err);
      res.status(500).send('Server error');
      return;
    }

    const totalHours = results.reduce((acc, row) => {
      acc[row.day] = row.totalHours;
      return acc;
    }, {});
    res.json(totalHours);
  });
});


// Route for adding tasks based on route parameters

app.post('/add-event', (req, res) => {
  const { title, description, timeFrom, timeTo, day, month, year, eid } = req.body;

  // Function to calculate total hours
  function calculateTotalHours(timeFrom, timeTo) {
    const [fromHour, fromMin] = timeFrom.split(":").map(Number);
    const [toHour, toMin] = timeTo.split(":").map(Number);

    const fromTime = fromHour + fromMin / 60; // Convert to decimal hours
    const toTime = toHour + toMin / 60; // Convert to decimal hours

    return toTime - fromTime;
  }

  // Calculate total hours
  const totalHours = calculateTotalHours(timeFrom, timeTo);

  // Validation: Check if all required fields are present
  if (!title || !description || !timeFrom || !timeTo || !day || !month || !year || !eid) {
    res.status(400).json({ error: 'Please provide all the required fields.' });
    return;
  }

  // SQL query to insert into `tasks` table
  const insertTaskQuery = 'INSERT INTO tasks (title, description) VALUES (?, ?)';
  const taskValues = [title, description];

  // Execute the query to insert into `tasks` table
  db.query(insertTaskQuery, taskValues, (err, taskResult) => {
    if (err) {
      console.error('Error inserting into tasks table:', err);
      res.status(500).json({ error: 'Failed to add the event.' });
      return;
    }

    // Retrieve the inserted `tid`
    const taskId = taskResult.insertId;

    // SQL query to insert into `task_eid_assoc` table
    const insertAssocQuery = `
      INSERT INTO task_emp_assoc (tid, eid, timeFrom, timeTo, day, month, year, totalHours)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const assocValues = [taskId, eid, timeFrom, timeTo, day, month, year, totalHours];

    // Execute the query to insert into `task_eid_assoc` table
    db.query(insertAssocQuery, assocValues, (assocErr, assocResult) => {
      if (assocErr) {
        console.error('Error inserting into task_eid_assoc table:', assocErr);
        res.status(500).json({ error: 'Failed to add the event association.' });
        return;
      }

      // Respond with success message and details
      res.status(200).json({
        message: 'Task and association added successfully.',
        eventId: taskId, // Use the `taskId` from tasks table
        totalHours: totalHours
      });
    });
  });
});


// Route for updating an Excel file with data from the database

app.get('/updateExcel/:eid/:year/:month', async (req, res) => {
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month);
  const eid = req.params.eid;

  if (isNaN(year) || isNaN(month) || year < 1970 || month < 1 || month > 12) {
    return res.status(400).send('Invalid year or month');
  }

  const query = 
  'SELECT day, SUM(totalHours) AS totalHours FROM task_emp_assoc WHERE eid = ? AND year = ? AND month = ? GROUP BY day ORDER BY day';

  db.query(query, [eid, year, month], async (err, results) => {
    if (err) {
      console.error('Error fetching data from the database:', err);
      return res.status(500).send('Server error');
    }

    const totalHours = results.reduce((acc, row) => {
      acc[row.day] = row.totalHours;
      return acc;
    }, {});

    try {
      const templatePath = path.join(__dirname, 'documents', 'Template.xlsx');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);
      const worksheet = workbook.getWorksheet(1);


      // Update dropdown cells for month and year
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      // Assuming D1 for month and E1 for year
      const monthCell = worksheet.getCell('D1');
      const yearCell = worksheet.getCell('E1');
      
      monthCell.value = monthNames[month - 1]; // Set month name
      yearCell.value = year; // Set year value

      // Define columns for days of the week (B to H: Monday to Sunday)
      const columnsForDays = ['B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const startingRow = 13; // The row where dates start
      const rowInterval = 3; // Dates are spaced every 3 rows
      const daysInMonth = new Date(year, month, 0).getDate();

      const cellMapping = {};

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = (date.getDay() + 6) % 7; // Adjust so Monday is 0
        const column = columnsForDays[dayOfWeek];

        // Calculate the week number and row based on the day and interval
        const weekNumber = Math.floor((day + new Date(year, month - 1, 1).getDay() - 1) / 7);
        const dateRow = startingRow + weekNumber * rowInterval;
        const dateCellAddress = `${column}${dateRow}`;

        // Identify the cell below the date cell
        const hoursCellAddress = `${column}${dateRow + 1}`;
        cellMapping[day] = {
          dateCell: worksheet.getCell(dateCellAddress),
          hoursCell: worksheet.getCell(hoursCellAddress)
        };

      }

      // Populate total hours below each date cell
      for (const day in totalHours) {
        if (cellMapping.hasOwnProperty(day)) {
          const { dateCell, hoursCell } = cellMapping[day];

          hoursCell.value = totalHours[day];
        
        }
      }



      const outputPath = path.join(__dirname, 'downloads', `Updated_Timesheet_${month}_${year}_eid_${eid}.xlsx`);
      await workbook.xlsx.writeFile(outputPath);

      res.send(`Excel file updated successfully and saved as ${outputPath}`);
    } catch (error) {
      console.error('Error updating the Excel file:', error);
      res.status(500).send('Error updating the Excel file');
    }
  });
});


// Route for downloading an  Excel file with data from the database based on userid

app.get('/download-excel/:eid/:month/:year', async (req, res) => {
  const eid = req.params.eid;
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month);

  // Fetch data from database
  db.query('SELECT * FROM ud WHERE eid = ?', [eid], async (error, results) => {
      if (error) {
          return res.status(500).send(error);
      }

      if (results.length > 0) {
          const data = results[0];

          // Load the existing Excel template
          const templatePath = path.join(__dirname, 'downloads', `Updated_Timesheet_${month}_${year}_eid_${eid}.xlsx`);
          // Update this path
          const workbook = new ExcelJS.Workbook();

          try {
              await workbook.xlsx.readFile(templatePath);
          } catch (err) {
              return res.status(500).send('Error reading Excel template');
          }

          const worksheet = workbook.getWorksheet(1); // Assuming the first worksheet

          // Update the necessary cells in column C
          worksheet.getCell('C3').value = data.ename; // Update cell references to match your data
          worksheet.getCell('C4').value = data.eid;
          worksheet.getCell('C5').value = data.client;
          worksheet.getCell('C8').value = data.wh;
          worksheet.getCell('C10').value = data.loc;

          // Save the modified Excel file
          const outputPath = path.join(__dirname,'downloads', `Timesheet_${eid}.xlsx`);
          try {
              await workbook.xlsx.writeFile(outputPath);
          } catch (err) {
              return res.status(500).send('Error writing Excel file');
          }

          // Serve the file to the client
          res.download(outputPath, `Modified_Timesheet_${eid}.xlsx`, (err) => {
              if (err) {
                  console.error('Error downloading file:', err);
                  res.status(500).send('Error downloading file.');
              } else {
                  // Optionally, delete the file after download
                  fs.unlink(outputPath, (unlinkErr) => {
                      if (unlinkErr) {
                          console.error('Error deleting file:', unlinkErr);
                      }
                  });
              }
          });
      } else {
          res.status(404).send('No record found');
      }
  });
});






// Start the server

 app.listen(PORT, () => { 
     console.log(`Server running on port: ${PORT}`); 
 });