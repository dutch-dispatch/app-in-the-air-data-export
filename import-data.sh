#!/bin/bash

# Exit on error
set -e

echo "Starting data import process..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Initialize and install npm dependencies
echo "Installing npm dependencies..."
cd utils
npm install
cd ..

# Import airports data
echo "Importing airports data..."
node utils/import-airport-data.js

# Import airplanes data
echo "Importing airplanes data..."
node utils/import-airplanes.js

# Import app data
echo "Importing app data..."
node utils/app-parser.js

echo "Data import completed successfully!"