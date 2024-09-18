#!/bin/bash
# Check for the correct number of arguments
# Assign arguments to variables with default values
snapshotId=${1}

# Print the values for debugging purposes
echo "Check content"
node src/index.js check

