#!/bin/bash

# Assign arguments to variables with default values
directory=${1:-'snapshot_files'}

# Print the values for debugging purposes
echo "Directory: $directory"
echo "Taking snapshot in  $directory directory"

node src/index.js snapshot --targetDirectory $directory

