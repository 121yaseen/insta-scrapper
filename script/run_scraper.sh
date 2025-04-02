#!/bin/bash

# Change to the script directory
cd "$(dirname "$0")"

echo "=== Instagram Scraper Automation ==="
echo "Starting at $(date)"

# Determine the correct python virtual environment path
VENV_DIR="./venv"
ACTIVATE_SCRIPT=""

if [ -f "${VENV_DIR}/bin/activate" ]; then
  # Unix/Mac
  ACTIVATE_SCRIPT="${VENV_DIR}/bin/activate"
elif [ -f "${VENV_DIR}/Scripts/activate" ]; then
  # Windows
  ACTIVATE_SCRIPT="${VENV_DIR}/Scripts/activate"
else
  echo "Error: Virtual environment activation script not found"
  exit 1
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source "$ACTIVATE_SCRIPT"

# Verify Python is from virtual environment
echo "Using Python: $(which python)"

# Install required packages if not already installed
echo "Installing dependencies..."
pip install -r requirements_db.txt

# Fetch usernames from database
echo "Fetching usernames from database..."
python db_to_usernames.py

# Check if usernames were fetched successfully
if [ $? -ne 0 ]; then
  echo "Error: Failed to fetch usernames from database"
  deactivate
  exit 1
fi

# Check if usernames file exists and is not empty
if [ ! -s usernames.txt ]; then
  echo "No usernames to process. Exiting."
  deactivate
  exit 0
fi

# Run the Instagram scraper
echo "Running Instagram scraper..."
python insta_scraper.py
SCRAPER_EXIT_CODE=$?

# Update the database with the scraped data
echo "Updating database with scraped data..."
python update_database.py

# Update completion status in QueuedRequest table
echo "Updating completion status in database..."
python update_completion.py

# Deactivate virtual environment
echo "Deactivating virtual environment..."
deactivate

echo "Process completed at $(date)"

# Exit with the scraper's exit code
exit $SCRAPER_EXIT_CODE 