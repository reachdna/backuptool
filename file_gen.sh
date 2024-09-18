#!/bin/bash

# Number of files to generate
num_files=5

# Size of each file in bytes
file_size=1024

# Directory to store the files
output_dir="./snapshot_files"

# Create the output directory if it doesn't exist
mkdir -p "$output_dir"

for i in $(seq 1 $num_files); do
  # Generate a random filename
  filename="$output_dir/random_file_$i.txt"

  # Generate random text using /dev/urandom and tr
  LC_CTYPE=C tr -dc 'A-Za-z0-9 ,.!?' < /dev/urandom | head -c $file_size > "$filename"
done

echo "Generated $num_files random text files in $output_dir"