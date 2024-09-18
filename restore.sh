#!/bin/bash
if [ -z "$1" ]; then
  echo "Error: snapshotId is required."
  exit 1
fi

snapshotId=$1
directory=${2:-'output'}

# Print the values for debugging purposes
echo "Restore snapshot ID: $snapshotId"
node src/index.js restore --snapshot $snapshotId --outputDirectory $directory

