const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

// Path to your data file
const dataFilePath = path.join(__dirname, '..', 'data', 'data.txt');
// Path to SQLite database
const dbFilePath = path.join(__dirname, '..', 'app_data.db');

// Create or open the SQLite database
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Create tables if they don't exist
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // User info table
      db.run(`CREATE TABLE IF NOT EXISTS user_info (
        id TEXT PRIMARY KEY,
        email TEXT,
        full_name TEXT,
        country TEXT,
        currency TEXT
      )`, (err) => {
        if (err) reject(err);
      });

      // Device info table
      db.run(`CREATE TABLE IF NOT EXISTS device_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_name TEXT,
        app_name TEXT,
        os TEXT,
        version TEXT,
        country TEXT,
        first_seen DATETIME,
        last_seen DATETIME,
        user_id TEXT,
        FOREIGN KEY (user_id) REFERENCES user_info(id)
      )`, (err) => {
        if (err) reject(err);
      });

      // Trips table
      db.run(`CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ownership TEXT,
        departure_time DATETIME,
        arrival_time DATETIME,
        origin TEXT,
        destination TEXT,
        created_at DATETIME,
        updated_at DATETIME,
        user_id TEXT,
        FOREIGN KEY (user_id) REFERENCES user_info(id)
      )`, (err) => {
        if (err) reject(err);
      });

      // Flights table
      db.run(`CREATE TABLE IF NOT EXISTS flights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seat TEXT,
        booking_reference TEXT,
        source TEXT,
        airline_code TEXT,
        flight_number TEXT,
        aircraft TEXT,
        origin TEXT,
        destination TEXT,
        departure_time DATETIME,
        arrival_time DATETIME,
        local_departure_time DATETIME,
        local_arrival_time DATETIME,
        created_at DATETIME,
        trip_id INTEGER,
        FOREIGN KEY (trip_id) REFERENCES trips(id)
      )`, (err) => {
        if (err) reject(err);
      });

      resolve();
    });
  });
}

// Parse data.txt and store in SQLite
async function parseAndStoreData() {
  await initializeDatabase();

  const fileStream = fs.createReadStream(dataFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let userId = null;
  let userEmail = null;
  let userFullName = null;
  let userCountry = null;
  let userCurrency = null;
  let currentSection = null;
  let devices = [];
  let trips = [];
  let currentTrip = null;
  let currentFlights = [];

  for await (const line of rl) {
    // Skip empty lines
    if (line.trim() === '') continue;

    // Detect sections
    if (line.startsWith('user:')) {
      userId = line.split(':')[1].trim();
      currentSection = 'user';
      continue;
    } else if (line === 'devices:') {
      currentSection = 'devices';
      continue;
    } else if (line === 'accounts:') {
      currentSection = 'accounts';
      continue;
    } else if (line === 'settings:') {
      currentSection = 'settings';
      continue;
    } else if (line === 'trips:') {
      currentSection = 'trips';
      continue;
    } else if (line === 'flights:') {
      currentSection = 'flights';
      continue;
    } else if (line === 'hotels:' || line === 'rental cars:' || line === 'expenses:') {
      // Skip sections we're not interested in
      currentSection = 'ignore';
      continue;
    }

    // Parse data based on current section
    if (currentSection === 'devices') {
      const parts = line.split(';');
      if (parts.length >= 7) {
        devices.push({
          device_name: parts[0],
          app_name: parts[1],
          os: parts[2],
          version: parts[3],
          country: parts[4] === 'None' ? null : parts[4],
          first_seen: parts[5],
          last_seen: parts[6]
        });
      }
    } else if (currentSection === 'settings') {
      if (line.startsWith('country:')) {
        userCountry = line.substring('country:'.length).trim();
      } else if (line.startsWith('currency:')) {
        userCurrency = line.substring('currency:'.length).trim();
      } else if (line.startsWith('full name:')) {
        userFullName = line.substring('full name:'.length).trim();
      } else if (line.startsWith('display email:')) {
        userEmail = line.substring('display email:'.length).trim();
      }
    } else if (currentSection === 'trips') {
      if (line.startsWith('Ownership.')) {
        // If we already have a current trip, store it and its flights
        if (currentTrip) {
          trips.push({
            trip: currentTrip,
            flights: currentFlights
          });
        }

        const parts = line.split(';');
        if (parts.length >= 7) {
          currentTrip = {
            ownership: parts[0],
            departure_time: parts[1],
            arrival_time: parts[2],
            origin: parts[3],
            destination: parts[4],
            created_at: parts[5],
            updated_at: parts[6]
          };
          currentFlights = [];
        }
      }
    } else if (currentSection === 'flights') {
      const parts = line.split(';');
      if (parts.length >= 14) {
        currentFlights.push({
          seat: parts[0] === 'None' ? null : parts[0],
          booking_reference: parts[2] === 'None' ? null : parts[2],
          source: parts[6],
          airline_code: parts[7],
          flight_number: parts[8],
          aircraft: parts[9] === 'None' ? null : parts[9],
          origin: parts[10],
          destination: parts[11],
          departure_time: parts[12],
          arrival_time: parts[13],
          local_departure_time: parts.length > 14 ? parts[14] : null,
          local_arrival_time: parts.length > 15 ? parts[15] : null,
          created_at: parts.length > 16 ? parts[16] : null
        });
      }
    }
  }

  // Store the last trip if we have one
  if (currentTrip) {
    trips.push({
      trip: currentTrip,
      flights: currentFlights
    });
  }

  // Store user info in SQLite
  const userStmt = db.prepare('INSERT OR REPLACE INTO user_info (id, email, full_name, country, currency) VALUES (?, ?, ?, ?, ?)');
  userStmt.run(userId, userEmail, userFullName, userCountry, userCurrency);
  userStmt.finalize();

  console.log('User info stored in database.');

  // Store devices in SQLite
  const deviceStmt = db.prepare('INSERT INTO device_info (device_name, app_name, os, version, country, first_seen, last_seen, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  
  for (const device of devices) {
    deviceStmt.run(
      device.device_name, 
      device.app_name, 
      device.os, 
      device.version, 
      device.country, 
      device.first_seen, 
      device.last_seen, 
      userId
    );
  }
  deviceStmt.finalize();

  console.log(`${devices.length} devices stored in database.`);

  // Store trips and flights in SQLite
  let tripCount = 0;
  let flightCount = 0;

  // Function to store trip and its flights
  function storeTrip(trip, flights) {
    db.run(
      'INSERT INTO trips (ownership, departure_time, arrival_time, origin, destination, created_at, updated_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [trip.ownership, trip.departure_time, trip.arrival_time, trip.origin, trip.destination, trip.created_at, trip.updated_at, userId],
      function(err) {
        if (err) {
          console.error('Error storing trip:', err.message);
          return;
        }
        
        const tripId = this.lastID;
        tripCount++;
        
        // Store flights for this trip
        const flightStmt = db.prepare(
          'INSERT INTO flights (seat, booking_reference, source, airline_code, flight_number, aircraft, origin, destination, departure_time, arrival_time, local_departure_time, local_arrival_time, created_at, trip_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        
        for (const flight of flights) {
          flightStmt.run(
            flight.seat,
            flight.booking_reference,
            flight.source,
            flight.airline_code,
            flight.flight_number,
            flight.aircraft,
            flight.origin,
            flight.destination,
            flight.departure_time,
            flight.arrival_time,
            flight.local_departure_time,
            flight.local_arrival_time,
            flight.created_at,
            tripId
          );
          flightCount++;
        }
        
        flightStmt.finalize();
      }
    );
  }

  // Store all trips and flights
  for (const tripData of trips) {
    storeTrip(tripData.trip, tripData.flights);
  }

  // Wait a bit to allow async operations to complete
  setTimeout(() => {
    console.log(`${tripCount} trips and ${flightCount} flights stored in database.`);
    console.log('Data parsing and storage completed.');
    
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }, 1000);
}

// Run the parser
parseAndStoreData().catch(err => {
  console.error('Error parsing data:', err);
  db.close();
});