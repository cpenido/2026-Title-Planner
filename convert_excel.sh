#!/bin/bash

# Helper script to convert Excel files to CSV for easier processing
# Run this script to convert your Excel files to CSV format

echo "Converting Excel files to CSV format..."

# Check if xlsx2csv is installed
if ! command -v xlsx2csv &> /dev/null; then
    echo "xlsx2csv not found. Installing..."
    pip install xlsx2csv
fi

# Convert the 2026 APub US Pub Calendar.xlsx
if [ -f "2026 APub US Pub Calendar.xlsx" ]; then
    echo "Converting 2026 APub US Pub Calendar.xlsx..."
    xlsx2csv "2026 APub US Pub Calendar.xlsx" "2026_calendar.csv"
    echo "Created 2026_calendar.csv"
fi

# Convert the 2025 Title Planning file
if [ -f "IN+PROGRESS+full+2025+Title+Planning.xlsx" ]; then
    echo "Converting IN+PROGRESS+full+2025+Title+Planning.xlsx..."
    xlsx2csv "IN+PROGRESS+full+2025+Title+Planning.xlsx" "2025_planning.csv"
    echo "Created 2025_planning.csv"
fi

echo "Conversion complete! You can now examine the CSV files to understand the data structure."
echo "The web app can import Excel files directly using the 'Import Excel' button."