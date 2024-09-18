#!/bin/bash
snapshotId=${1}

# Print the values for debugging purposes
echo "Snapshot ID: $snapshotId"
node src/index.js prune --snapshot $snapshotId 

