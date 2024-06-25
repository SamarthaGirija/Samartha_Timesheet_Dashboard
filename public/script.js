
// ----------------------------------------------
// VARIABLE DECLARATIONS AND INITIALIZATION
// ----------------------------------------------

// Selecting HTML elements for calendar, navigation, event input, and buttons



const calendar = document.querySelector(".calendar"),
date = document.querySelector(".date"),
daysContainer = document.querySelector(".days"),
prev = document.querySelector(".prev"),
next = document.querySelector(".next"),
todayBtn = document.querySelector(".today-btn"),
gotoBtn = document.querySelector(".goto-btn"),
dateInput = document.querySelector(".date-input"),
eventDay = document.querySelector(".event-day"),
eventDate = document.querySelector(".event-date"),
eventsContainer = document.querySelector(".events"),
addEventBtn = document.querySelector(".add-event"),
addEventWrapper = document.querySelector(".add-event-wrapper "),
addEventCloseBtn = document.querySelector(".close "),
addEventTitle = document.querySelector(".event-name "),
addeEventDesc =document.querySelector(".event-desc"),
addEventFrom = document.querySelector(".event-time-from "),
addEventTo = document.querySelector(".event-time-to "),
addEventSubmit = document.querySelector(".add-event-btn "),
monthDropdown = document.getElementById("month"),
yearDropdown = document.getElementById("year");
const downloadBtn = document.querySelector('.down-btn');
const saveBtn = document.querySelector('.save-btn');


// Initialize today's date, active day, current month, and year

let today = new Date();
let activeDay;
let month = today.getMonth();
let year = today.getFullYear();
let eid;  // Employee ID


// Array to store events
const eventsArr = [];
fetchEvents();
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ----------------------------------------------
// FETCH USER DATA AND INITIALIZE CALENDAR
// ----------------------------------------------

// On window load, fetch user data and initialize the calendar
window.onload = async function() {
  const userId = 1; // Replace with the actual user ID you want to fetch
  await fetchUserData(userId); // Wait for user data to be fetched
  if (eid) {
    initCalendar();
    fetchEvents(today.getDate(), today.getMonth() + 1, today.getFullYear());
  } else {
    console.error("EID not set. Cannot initialize calendar.");
  }
};


// ----------------------------------------------
// FUNCTIONS FOR API CALLS
// ----------------------------------------------

// Fetch user data from server and initialize form fields


async function fetchUserData(id) {
  try {
      const response = await fetch(`http://localhost:3000/ud/${id}`);
      console.log(response);
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      const userData = await response.json();
      if (userData.length > 0) {
          const user = userData[0];
          document.getElementById('name').value = user.ename || '';
          document.getElementById('employeeNumber').value = user.eid || '';
          document.getElementById('client').value = user.client || '';
          document.getElementById('workingHours').value = user.wh || '';
          document.getElementById('location').value = user.loc || '';
          eid=user.eid;
      }
  } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
  }
}


// Send task data to the server

async function sendEventData(eventData) {
  try {
    const response = await fetch('http://localhost:3000/add-event', { // Replace with your actual endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();
    alert(`Event added successfully: ${result.message}`); // Handle the server response as needed
  } catch (error) {
    console.error('There was a problem with your fetch operation:', error);
    alert('Failed to add the event. Please try again.');
  }
}



// Fetch tasks from the server for a specific day

async function fetchEvents(day, month, year) {
  try {
    const response = await fetch(`http://localhost:3000/events/${eid}/${day}/${month}/${year}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const events = await response.json();
    console.log(events); // Log the fetched events


    // Update the events container
    updateEventsContainer(events);

    // Fetch total hours for the specified day
    if (typeof day !== 'undefined') {
      fetchTotalHours(eid,day, month, year,`day-input-${day}`);
      
  }

  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
  }
}


// Fetch total hours worked for a specific day

async function fetchTotalHours(eid,day, month, year,inputId) {
  try {
    const response = await fetch(`http://localhost:3000/totalHours/${eid}/${year}/${month}/${day}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const totalHoursData = await response.json();
    const totalHours = totalHoursData.totalHours;

    // Update the value of the input field
    const dayInput = document.getElementById(inputId);
    if (dayInput) {
      dayInput.value = totalHours; // Assuming the value is in hours
    } else {
      console.error('Element with ID', inputId, 'not found');
    }
  } catch (error) {
    console.error('There was a problem with your fetch operation:', error);
  }
}


// Fetch total hours worked for a specific month

async function fetchTotalHoursMonth(eid, month, year) {
  try {
    const response = await fetch(`http://localhost:3000/totalHours/${eid}/${year}/${month}`);
    console.log('db fetch respnse normal',response);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const totalHoursMonth = await response.json();
    console.log(totalHoursMonth);
    return totalHoursMonth; // Format { '1': 8, '2': 7, '3': 5, ... } where keys are days
  } catch (error) {
    console.error('There was a problem with your fetch operation:', error);
    return {}; // Return an empty object in case of an error
  }
}

// ----------------------------------------------
// UTILITY FUNCTIONS
// ----------------------------------------------



// Initialize the calendar for the selected month and year

async function initCalendar() {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const prevLastDay = new Date(year, month, 0);
  const prevDays = prevLastDay.getDate();
  const lastDate = lastDay.getDate();
  const day = firstDay.getDay();
  const nextDays = 7 - lastDay.getDay() - 1;
  

  date.innerHTML = months[month] + " " + year;

  let days = "";

  try {
    const totalHoursForMonth = await fetchTotalHoursMonth(eid,month + 1, year);
    

    for (let x = day; x > 0; x--) {
      days += `<div class="day prev-date">${prevDays - x + 1}</div>`;
    }

    for (let i = 1; i <= lastDate; i++) {
      let event = false;
      eventsArr.forEach((eventObj) => {
        if (
          eventObj.day === i &&
          eventObj.month === month + 1 &&
          eventObj.year === year
        ) {
          event = true;
        }
      });

      const totalHours = totalHoursForMonth[i] || 0;

      if (
        i === new Date().getDate() &&
        year === new Date().getFullYear() &&
        month === new Date().getMonth()
      ) {
        activeDay = i;
        getActiveDay(i);
        updateEvents(i);
        if (event) {
          days += `<div class="day today active event"><span class="date-display">${i}</span><hr><div class="day-i">
            <input type="number" id="day-input-${i}" class="day-input" readonly value="${totalHours}">
            </div></div>`;
        } else {
          days += `<div class="day today active"><span class="date-display">${i}</span><hr><div class="date-i">
            <input type="number" id="day-input-${i}" class="day-input" readonly value="${totalHours}">
          </div></div>`;
        }

      } else {
        if (event) {
          days += `<div class="day event"><span class="date-display">${i}</span><hr><div class="date-i">
            <input type="number" id="day-input-${i}" class="day-input" readonly value="${totalHours}">
          </div></div>`;
        } else {
          days += `<div class="day"><span class="date-display">${i}</span><hr><div class="date-i">
            <input type="number" id="day-input-${i}" class="day-input" readonly value="${totalHours}">
          </div></div>`;
        }
      }
    }

    for (let j = 1; j <= nextDays; j++) {
      days += `<div class="day next-date">${j}</div>`;
    }
    daysContainer.innerHTML = days;
    addListner();
  } catch (error) {
    console.error("Error fetching total hours:", error);
  }
}


// Update the events container with task data

function updateEventsContainer(events) {
  let eventsHTML = '';

  events.forEach(event => {
    eventsHTML += `
      <div class="event">
      <input type="checkbox" class="event-checkbox" >
        <div class="title">
          <i class="fas fa-circle"></i>
          <h3 class="event-title">${event.title}</h3>
        </div>
        <div class="event-desc">
          <h4 class="event-desc">${event.description}</h4>
        </div>
        <div class="event-time">
          <span class="event-time">${event.timeFrom} - ${event.timeTo}</span>
        </div>
      </div>
    `;
  });

  if (eventsHTML === '') {
    eventsHTML = `
      <div class="no-event">
        <h3>No Tasks</h3>
      </div>
    `;
  }

  eventsContainer.innerHTML = eventsHTML;
}


// Convert 24-hour time to 12-hour format

function convertTime(time) {
  let timeArr = time.split(":");
  let timeHour = timeArr[0];
  let timeMin = timeArr[1];
  let timeFormat = timeHour >= 12 ? "PM" : "AM";
  timeHour = timeHour % 12 || 12;
  time = timeHour + ":" + timeMin + " " + timeFormat;
  return time;
}



// ----------------------------------------------
// EVENT HANDLERS
// ----------------------------------------------

// Add event listeners for month navigation and event submission
prev.addEventListener("click", prevMonth);
next.addEventListener("click", nextMonth);



// Function to add event
addEventBtn.addEventListener("click", () => {
  addEventWrapper.classList.toggle("active");
});

addEventCloseBtn.addEventListener("click", () => {
  addEventWrapper.classList.remove("active");
});

document.addEventListener("click", (e) => {
  if (e.target !== addEventBtn && !addEventWrapper.contains(e.target)) {
    addEventWrapper.classList.remove("active");
  }
});

// Allow 50 chars in event title
addEventTitle.addEventListener("input", (e) => {
  addEventTitle.value = addEventTitle.value.slice(0, 60);
});

addeEventDesc.addEventListener("input", (e) => {
  addeEventDesc.value = addeEventDesc.value.slice(0, 60);
});

// Function to add event to eventsArr
addEventSubmit.addEventListener("click", async () => { 
  const eventTitle = addEventTitle.value;
  const eventDesc = addeEventDesc.value;
  const eventTimeFrom = addEventFrom.value;
  const eventTimeTo = addEventTo.value;

  if (eventTitle === "" || eventDesc === "" || eventTimeFrom === "" || eventTimeTo === "") {
    alert("Please fill all the fields");
    return;
  }

  // Check correct time format 24 hour
  const timeFromArr = eventTimeFrom.split(":");
  const timeToArr = eventTimeTo.split(":");
  if (
    timeFromArr.length !== 2 ||
    timeToArr.length !== 2 ||
    timeFromArr[0] > 23 ||
    timeFromArr[1] > 59 ||
    timeToArr[0] > 23 ||
    timeToArr[1] > 59
  ) {
    alert("Invalid Time Format");
    return;
  }

  const timeFrom = convertTime(eventTimeFrom);
  const timeTo = convertTime(eventTimeTo);

  // Check if event is already added
  let eventExist = false;
  eventsArr.forEach((event) => {
    if (
      event.day === activeDay &&
      event.month === month + 1 &&
      event.year === year
    ) {
      event.events.forEach((event) => {
        if (event.title === eventTitle) {
          eventExist = true;
        }
      });
    }
  });

  if (eventExist) {
    alert("Event already added");
    return;
  }

  const newEvent = {
    title: eventTitle,
    desc: eventDesc,
    time: `${timeFrom} - ${timeTo}`,
  };

  console.log(newEvent);
  console.log(activeDay);

  let eventAdded = false;
  if (eventsArr.length > 0) {
    eventsArr.forEach((item) => {
      if (
        item.day === activeDay &&
        item.month === month + 1 &&
        item.year === year
      ) {
        item.events.push(newEvent);
        eventAdded = true;
      }
    });
  }

  if (!eventAdded) {
    eventsArr.push({
      day: activeDay,
      month: month + 1,
      year: year,
      events: [newEvent],
    });
  }

  console.log(eventsArr);
  addEventWrapper.classList.remove("active");
  addEventTitle.value = "";
  addeEventDesc.value = "";
  addEventFrom.value = "";
  addEventTo.value = "";
  updateEvents(activeDay);

  const activeDayEl = document.querySelector(".day.active");
  if (!activeDayEl.classList.contains("event")) {
    activeDayEl.classList.add("event");
  }

  // Send event data to the server
  const eventData = {
    title: eventTitle,
    description: eventDesc,
    timeFrom: eventTimeFrom,
    timeTo: eventTimeTo,
    day: activeDay,
    month: month + 1, // Adjust for zero-based month
    year: year,
    eid:eid
  };

  await sendEventData(eventData);
});







document.addEventListener('DOMContentLoaded', () => {
  const scrollButton = document.querySelector('.scroll-button');
  const eventsContainer = document.querySelector('.events');

  if (scrollButton && eventsContainer) {
    scrollButton.addEventListener('click', () => {
      eventsContainer.scrollBy({
        top: 0,
        left: 100,
        behavior: 'smooth'
      });
    });
  }
});


// Add event listener to check if events overflow horizontally
eventsContainer.addEventListener('scroll', () => {
  const scrollLeft = eventsContainer.scrollLeft;
  const scrollWidth = eventsContainer.scrollWidth;
  const clientWidth = eventsContainer.clientWidth;

  if (scrollLeft > 0 && scrollWidth > clientWidth) {
    eventsContainer.classList.add('overflowed');
    scrollButton.style.display = 'inline-block';
  } else {
    eventsContainer.classList.remove('overflowed');
    scrollButton.style.display = 'none';
  }
});



todayBtn.addEventListener("click", () => {
  today = new Date();
  month = today.getMonth();
  year = today.getFullYear();
  updateDropdowns();
  initCalendar();
});



// Attach click event listener to the download button
// Attach click event listener to the download button
downloadBtn.addEventListener('click', async () => {
  // Replace '123' with the actual 'eid' value you want to download the Excel file for
  const eid = '1';
  const month1 = month + 1;

  // Prompt the user for the filename
  const userFilename = prompt("Enter the filename for the downloaded Excel file (without extension):", `Modified_Timesheet_${eid}`);
  if (!userFilename) {
    alert('Filename is required.');
    return; // Exit if the user cancels the prompt or leaves the filename empty
  }

  // Make a GET request to the server to download the Excel file
  try {
    const response = await fetch(`http://localhost:3000/download-excel/${eid}/${month1}/${year}`);
    if (!response.ok) {
      throw new Error('Failed to download Excel file');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userFilename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a); // Clean up the DOM by removing the link element
  } catch (error) {
    console.error('Error downloading Excel file:', error);
    alert('Failed to download Excel file. Please try again.');
  }
});




/// Attach click event listener to the save button
saveBtn.addEventListener('click', async () => {
  // Increment month by 1 since JavaScript months are 0-based
  const monthbased = month + 1;

  try {
      const response = await fetch(`http://localhost:3000/updateExcel/${eid}/${year}/${monthbased}`);
      
      console.log('Response in saveBtn:', response);

      if (!response.ok) {
          throw new Error('Failed to update and save the Excel file');
      }

      alert('Excel file updated and saved successfully on the server.');
  } catch (error) {
      console.error('Error updating and saving Excel file:', error);
      alert('Failed to update and save Excel file. Please try again.');
  }
});


// ----------------------------------------------
// ADDITIONAL FUNCTIONALITY
// ----------------------------------------------


// Populate year dropdown
populateYearDropdown(2000, 2030);

// Function to populate the year dropdown with a range of years
function populateYearDropdown(startYear, endYear) {
  for (let year = startYear; year <= endYear; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.text = year;
    yearDropdown.appendChild(option);
  }
  yearDropdown.value = today.getFullYear();
  monthDropdown.value = today.getMonth();
}

// Jump function to handle dropdown changes
function jump() {
  month = parseInt(monthDropdown.value);
  year = parseInt(yearDropdown.value);
  initCalendar();
}





// Function to add month and year on prev and next button
function prevMonth() {
  month--;
  if (month < 0) {
    month = 11;
    year--;
  }
  updateDropdowns();
  initCalendar();
}

function nextMonth() {
  month++;
  if (month > 11) {
    month = 0;
    year++;
  }
  updateDropdowns();
  initCalendar();
}

function updateDropdowns() {
  monthDropdown.value = month;
  yearDropdown.value = year;
}



// Function to add active on day
function addListner() {
  const days = document.querySelectorAll(".day");
  days.forEach((day) => {
    day.addEventListener("click", () => {
      const dateDisplay = day.querySelector('.date-display');
      if (dateDisplay) {
        const dateValue = dateDisplay.innerText;
        getActiveDay(Number(dateValue));
        updateEvents(Number(dateValue));
        activeDay = Number(dateValue);
        // Remove active class from all days
        days.forEach((d) => {
          d.classList.remove("active");
        });
        // Add active class to the clicked day
        day.classList.add("active");
      } else {
        console.error("No '.date-display' element found in the clicked day:", day);
      }
    });
  });
}





// Function to get active day day name and date and update eventday eventdate
function getActiveDay(date) {
  const day = new Date(year, month, date);
  const dayName = day.toString().split(" ")[0];
  eventDay.innerHTML = dayName;
  eventDate.innerHTML = date + " " + months[month] + " " + year;
}

// Function to update events when a day is active
function updateEvents(date) {
  // Fetch events for the selected date
  fetchEvents(date, month + 1, year);
}



function scrollRight() {
  const eventsContainer = document.querySelector('.events-container');
  eventsContainer.scrollBy({
    left: 200, // Adjust the value as needed
    behavior: 'smooth'
  });
}




