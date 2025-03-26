# App in the Air - Data Export

A tool for importing and managing App in the Air data.

## Prerequisites

- Node.js
- npm

## Project Structure

```
.
├── app_data.db          # SQLite database file
├── db-schema.sql        # Database schema definition
├── data/               
│   ├── airports.csv     # Airport reference data
│   ├── airplan-type-codes.txt  # Aircraft type codes
│   └── data.txt        # App data export
├── src/                # Web application
│   ├── index.html      # Main HTML entry point
│   ├── assets/         # Static assets (CSS, JS)
│   ├── components/     # Vue.js components
│   └── server/         # Express.js backend server
└── utils/              
    ├── app-parser.js    # Main app data parser
    ├── import-airplanes.js  # Aircraft data importer
    ├── import-airport-data.js # Airport data importer
    └── package.json     # Node.js dependencies
```

## Web Application

The project includes a web-based data explorer built with Vue.js and Express.js. This application provides an interactive interface to explore your flight data with the following features:

- **Flight List View**: Browse and search through all your flights
- **Flight Details**: View detailed information about each flight including:
  - Interactive map showing the flight route
  - Aircraft information
  - Departure and arrival details
- **Statistics Dashboard**: Analyze your flight history with:
  - Total flights and flight duration
  - Yearly and monthly flight distributions
  - Aircraft type statistics
  - Countries visited statistics

### Running the Web Application

1. First, make sure you've imported your data using the data import process
2. Start the server by running:
   ```bash
   npm install
   npm start
   ```
3. The server will start and display the URL where you can access the application (usually http://localhost:3000)
4. Open your web browser and navigate to the displayed URL to view your flight data

The application will automatically connect to the SQLite database and display your flight information in an interactive interface.

## Data Import Process

The data import process is automated through the `import-data.sh` script. This script handles the complete data pipeline in the following steps:

1. **Setup**
   - Verifies Node.js installation
   - Installs required npm dependencies (csv-parse, readline-sync, sqlite3)

2. **Data Import Sequence**
   - Imports airports data from `data/airports.csv`
   - Imports airplane type codes from `data/airplan-type-codes.txt`
   - Processes and imports app data from `data/data.txt`

### Running the Import

Replace empty `/data/data.txt` file with your App In The Air data export contnet.

To import all data, simply run:

```bash
./import-data.sh
```

The script will execute all import steps in the correct order and provide progress feedback.