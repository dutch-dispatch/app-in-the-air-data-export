const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parse');

// Paths configuration
const airportsFilePath = path.join(__dirname, '..', 'data', 'airports.csv');
const dbFilePath = path.join(__dirname, '..', 'app_data.db'); // Database in root directory

// Create or open the SQLite database
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Initialize airports table
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS airports (
      id TEXT PRIMARY KEY,
      name TEXT,
      latitude_deg REAL,
      longitude_deg REAL,
      continent TEXT,
      country TEXT,
      iata_code TEXT UNIQUE
    )`, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

async function importAirports() {
  await initializeDatabase();
  
  const parser = fs
    .createReadStream(airportsFilePath)
    .pipe(csv.parse({
      columns: true,
      skip_empty_lines: true
    }));

  // Prepare the insert statement
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO airports 
    (id, name, latitude_deg, longitude_deg, continent, country, iata_code)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  
  for await (const record of parser) {
    // Skip heliports and seaplane bases
    if (record.type === 'heliport' || record.type === 'seaplane_base') {
      continue;
    }

    // Only import if we have an IATA code
    if (record.iata_code) {
      stmt.run(
        record.id,
        record.name,
        parseFloat(record.latitude_deg),
        parseFloat(record.longitude_deg),
        record.continent,
        record.iso_country,
        record.iata_code
      );
      count++;
    }
  }

  stmt.finalize();

  console.log(`Imported ${count} airports into database.`);
  
  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
}

// Run the importer
importAirports().catch(err => {
  console.error('Error importing airports:', err);
  db.close();
});