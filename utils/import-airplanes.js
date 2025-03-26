const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parse');

// Paths configuration
const airplanesFilePath = path.join(__dirname, '..', 'data', 'airplan-type-codes.txt');
const dbFilePath = path.join(__dirname, '..', 'app_data.db');

// Create or open the SQLite database
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Initialize airplanes table
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS airplanes (
      iata_code TEXT PRIMARY KEY,
      manufacturer TEXT,
      model TEXT,
      wake_category TEXT
    )`, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

async function importAirplanes() {
  await initializeDatabase();
  
  const parser = fs
    .createReadStream(airplanesFilePath)
    .pipe(csv.parse({
      columns: true,
      skip_empty_lines: true,
      delimiter: '\t'
    }));

  // Prepare the insert statement
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO airplanes 
    (iata_code, manufacturer, model, wake_category)
    VALUES (?, ?, ?, ?)
  `);

  let count = 0;
  
  for await (const record of parser) {
    stmt.run(
      record.IATA,
      record.Manufacturer,
      record['Type/Model'],
      record.Wake
    );
    count++;
  }

  stmt.finalize();

  console.log(`Imported ${count} airplane types into database.`);
  
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
importAirplanes().catch(err => {
  console.error('Error importing airplanes:', err);
  db.close();
});