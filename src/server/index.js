const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Function to find an available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
    server.on('error', () => {
      // Port is in use, try the next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

// Path to SQLite database
const dbFilePath = path.join(__dirname, '../../app_data.db');

// Enable CORS
app.use(cors());

// Create or open the SQLite database
const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Endpoint to get user info
app.get('/api/user_info', (req, res) => {
  db.all('SELECT * FROM user_info', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Endpoint to get device info
app.get('/api/device_info', (req, res) => {
  db.all('SELECT * FROM device_info', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Endpoint to get trips
app.get('/api/trips', (req, res) => {
  db.all('SELECT * FROM trips', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Endpoint to get flights
const query = `
    SELECT 
      f.*,
      origin_airport.name as origin_name,
      origin_airport.latitude_deg as origin_latitude,
      origin_airport.longitude_deg as origin_longitude,
      origin_airport.continent as origin_continent,
      origin_airport.country as origin_country,
      dest_airport.name as destination_name,
      dest_airport.latitude_deg as destination_latitude,
      dest_airport.longitude_deg as destination_longitude,
      dest_airport.continent as destination_continent,
      dest_airport.country as destination_country
    FROM flights f
    LEFT JOIN airports origin_airport ON f.origin = origin_airport.iata_code
    LEFT JOIN airports dest_airport ON f.destination = dest_airport.iata_code
`;

app.get('/api/flights', (req, res) => {
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Ensure the response includes all fields from the query
        const flights = rows.map(row => ({
            id: row.id,
            seat: row.seat,
            booking_reference: row.booking_reference,
            source: row.source,
            airline_code: row.airline_code,
            flight_number: row.flight_number,
            aircraft: row.aircraft,
            origin: row.origin,
            destination: row.destination,
            departure_time: row.departure_time,
            arrival_time: row.arrival_time,
            local_departure_time: row.local_departure_time,
            local_arrival_time: row.local_arrival_time,
            trip_id: row.trip_id,
            origin_airport: {
                name: row.origin_name,
                latitude: row.origin_latitude,
                longitude: row.origin_longitude,
                continent: row.origin_continent,
                country: row.origin_country
            },
            destination_airport: {
                name: row.destination_name,
                latitude: row.destination_latitude,
                longitude: row.destination_longitude,
                continent: row.destination_continent,
                country: row.destination_country
            }
        }));

        res.json(flights);
    });
});

// Endpoint to get aircraft details by IATA code
app.get('/api/aircraft/:code', (req, res) => {
  const sql = 'SELECT iata_code, manufacturer, model FROM airplanes WHERE iata_code = ?';
  db.get(sql, [req.params.code], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Aircraft not found' });
      return;
    }
    res.json(row);
  });
});

// Serve static files from the 'src' directory
app.use(express.static(path.join(__dirname, '../../src')));

// Start the server on an available port
(async () => {
  try {
    const availablePort = await findAvailablePort(PORT);
    app.listen(availablePort, () => {
      console.log(`Server running on http://localhost:${availablePort}`);
      console.log(`Open your browser to view the App in the Air Data Explorer`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

// Handle graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});