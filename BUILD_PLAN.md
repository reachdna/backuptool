
## Backup Tool 
This a backup tool that takes snapshots of all files in a specified directory and stores their content and filenames in a database. The tool should be efficient in terms of storage and capable of handling incremental changes. Below are the key requirements and features:

1. **Snapshot Functionality:**
    - **Content and Filenames Only**: The tool should store only the file contents and filenames, ignoring metadata like permissions, ownership, or timestamps.
    - **Incremental Storage:** Snapshots should store only the incremental differences to minimize the database size. This means storing the minimal amount of data necessary to represent the new state of the directory by referencing already-stored data.
    - **Deduplication:** The tool should avoid storing duplicate file or directory content by using content hashes (e.g., SHA-256) to detect changes and prevent duplicate storage.
1. **Database:**
    - Snapshots are assigned sequential numbers based on the order of their creation.
1. **Enhanced list Operation:**
    - The list operation should include additional disk-usage metrics:
        - **Directory Consumption:** How much disk space the directory consumed at the time of snapshotting (i.e., the space required to restore the snapshot).
        - **Snapshot Size:** How much disk space the snapshot itself requires (i.e., the space required to store the files unique to the snapshot).
        - **Total Database Size:** A summary line showing the total size of the database.
1. **check Operation:**
    - Implement a check operation that scans the database for any corrupted file content.
1. **Chunking for Fine-Grained Deduplication:**

    - Use chunking to de-duplicate storage at a more fine-grained level. This     involves splitting files into smaller chunks, hashing each chunk, and storing only unique chunks to optimize storage.

### Summary of Key Features
* **Snapshot Creation:** Efficiently stores file contents and filenames, ignoring metadata.
* **Incremental Storage:** Minimizes database size by storing only incremental changes.
* **Deduplication:** Uses content hashes to avoid storing duplicate content.
* **Sequential Snapshot Numbers:** Snapshots are numbered sequentially.
* **Enhanced Listing:** Provides detailed disk-usage metrics.
* **Integrity Check:** Scans for corrupted file content.
* **Fine-Grained Deduplication:** Uses chunking to optimize storage further.

This tool aims to provide an efficient and reliable way to back up directories by focusing on incremental changes and deduplication, ensuring minimal storage usage and data integrity.


## Solution Options 
| Option                                     | Ranking | Overview                                                                                 | Pros                                                | Cons                                                         | Scalability                                         | Considerations                                              | Content Retrieval for Later Use                                                                                 | Content Retrieval for AI Training                                                                                | Local File System Suitability                                                                         | Cloud File System Suitability                                                                         | Suitable for Large File Sizes                                                              | Suitable for Large Number of Files                                                                 |
|--------------------------------------------|---------|------------------------------------------------------------------------------------------|-----------------------------------------------------|--------------------------------------------------------------|----------------------------------------------------|------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| AWS S3 with Database for Tracking          | 1       | Uses AWS S3 as the backup target and a database to track the last snapshot and only backup changed files. | Cost-efficient; highly scalable; minimal storage use. | Relies on accurate database tracking; requires network availability. | High; AWS S3 and databases can handle large-scale data. | Requires setup and management of database and S3 policies. | Efficient; S3 supports direct object retrieval, versioning, and integration with other AWS services.              | Highly suitable; S3's scalable storage can be directly used for training datasets, supports distributed access.  | Not ideal; cloud-oriented solution.                                                             | Highly suitable; designed for cloud environments.                                                     | Yes, highly scalable with S3’s object storage.                                                     | Yes, highly scalable with S3’s object storage and database.                                                     |
| Using File System Change Notification APIs | 2       | Monitors file system changes using platform-specific APIs and backups modified files.     | Real-time detection of changes; minimal resource usage. | Platform-dependent; may have performance impact on heavily loaded systems. | High; effective for small to moderate-scale file systems. | May need tuning for performance; API limitations.         | Moderate; depends on how the change notifications are logged and stored.                                         | Less suitable; limited to small to moderate datasets due to API and system limitations.                           | Best suited for local systems; uses native OS file system APIs.                                    | Not suited; APIs are designed for local file systems.                                                | Yes, but might need tuning for performance on large files.                                             | Yes, but performance tuning may be necessary for very large datasets.                                            |
| Incremental Snapshots Using Hash Comparisons| 3       | Uses hash comparisons to detect changed files and only backs up those files.              | Reduces backup size and time; works across file systems. | Can be slower for large directories; requires hashing.         | Moderate; performance can degrade with very large data sets. | Database size can grow; hashing may consume CPU resources. | Moderate; requires rebuilding file states from hashes, which can be slow for large datasets.                     | Less suitable; retrieval can be slow due to the need to compute and verify hashes, especially with large datasets.| Can work well for local systems, but hashing may be slow for large directories.                        | Can work, but inefficient compared to cloud-native solutions like S3.                                 | Less efficient; hashing can be slow on large files.                                                | No, performance can degrade significantly with a large number of files.                                             |



### Implemented Solution: Incremental Snapshots Using Hash Comparison

This solution implements both hash for whole file cotnent and hash by chunk of a file. 

#### Between these two techniques

| Feature                            | Hash for Whole File Content                  | Hash by Chunk of a File                        |
|-------------------------------------|----------------------------------------------|------------------------------------------------|
| **Complexity**                      | Simple to implement                          | More complex; requires chunk management        |
| **Performance (Small Files)**       | Faster for small files                       | More overhead for small files                  |
| **Performance (Large Files)**       | Slow for large files                         | Efficient for large files with partial changes |
| **Network/Storage Usage**           | Higher for large files with small changes    | Lower; only changed chunks are uploaded        |
| **Granularity**                     | Coarse (detects file-level changes)          | Fine (detects chunk-level changes)             |
| **Computational Overhead**          | Lower; only one hash per file                | Higher; hash needs to be calculated for each chunk |
| **Use Case**                        | Best for small files or files with full changes | Best for large files with partial changes      |
| **Chunk Size Trade-offs**           | Not applicable                               | Needs careful tuning to balance overhead and granularity |

- **Use Whole File Hashing** when:
  - Dealing with smaller files.
  - Prefer simplicity and low computational overhead.
  - The entire file is likely to change between snapshots.

- **Use Chunk Hashing** when:
  - Dealing with large files where only portions of the file change.
  - Reducing network and storage usage is important.
  - Willing to handle the added complexity of managing chunks and handling potential overhead.

For large files with partial updates, **hashing by chunks** is the more efficient option, while for smaller files or cases where the whole file changes frequently, **hashing the entire file** is simpler and faster.

## Database Schema

This schema is designed to support both chunking and non-chunking techniques for efficient storage and retrieval of file snapshots.

#### Tables and Their Purpose
1. **snapshots** - stores metadata about each snapshot.
1. **files** - stores metadata about each file in a snapshot.
1. **contents** - stores unique file contents to avoid duplication.
1. **chunks** - stores unique chunks of file contents to enable fine-grained 
1. **file_chunks** - stores the relationship between files and their chunks, maintaining the order of chunks.
**_Relationships_**
* **snapshots** to **files**: One-to-Many
    * Each ``snapshot`` can contain multiple ``files``.
    * The ``snapshot_id`` in the ``files`` table references the ``id`` in the ``snapshots`` table.

* **files** to **contents**: Many-to-One
    * Multiple files can reference the same content if the content is identical.
    * The hash in the files table references the hash in the contents table.

* **files** to **file_chunks**: One-to-Many
    * Each file can be divided into multiple chunks.
    * The file_id in the file_chunks table references the id in the files table.

* **file_chunks** to **chunks**: Many-to-One
    * Multiple file chunks can reference the same chunk content if the chunk content is identical.
    * The chunk_hash in the file_chunks table references the hash in the chunks table.

## Code

### Key Highlights
1. **Implemented in JavaScript**: Chosen for rapid development and ease of use.
2. **Environment Management**: Utilizes `dotenv` to manage environment variables and security credentials. Also facilitates switching between chunking and non-chunking techniques.
3. **Command-Line Interface**: No API is provided, but service methods can be invoked from the command line using `yargs`. Easily extendable to expose endpoints via an API.
4. **Data Access Layer**: Features a separate DAO layer for database schema and CRUD operations.
5. **Database Flexibility**: Uses PostgreSQL for the current implementation, but can be adapted to other databases by updating the DAO layer.

### The Approach
Hashing is the key here!! 

* **Deduplication:** By hashing file contents and chunks, the tool can identify and avoid storing duplicate data.
* **Data Integrity:** Hashes ensure that the content remains consistent and unaltered, allowing for integrity checks.
* **Storage Optimization:** Chunking and hashing enable fine-grained deduplication, significantly reducing storage requirements.

##### Hashing File Contents

- **Hashing Process:**
    - The `#hashFile` method reads the entire file into a buffer and then calls the `#hashContent` method to generate a hash.
    - The `#hashContent` method uses the SHA-256 cryptographic hash function to generate a unique hash for the given content.

##### Deduplication

- **Duplicate Detection:**
    - By generating a unique hash for each file's content, the tool can detect duplicate files. If two files produce the same hash, their contents are identical, and only one copy needs to be stored.
    - This reduces storage requirements by avoiding the storage of duplicate content.

##### Data Integrity

- **Integrity Verification:**
    - The hash values serve as unique identifiers for file contents. When restoring files or verifying data integrity, the tool can compare the stored hash with the hash of the current content to detect any corruption or changes.
    - This ensures that the stored data remains consistent and unaltered.

##### Chunking for Fine-Grained Deduplication

- **Chunking Process:**
    - The `#chunkFile` method divides a file into smaller chunks (default size: 1MB).
    - Each chunk can be hashed individually, allowing the tool to detect and store only unique chunks.
    - This further optimizes storage by enabling fine-grained deduplication, especially useful for large files with small changes.


## Not (Yet) Implementing
1. Remove hashed content/chunk when all related snapshot files were pruned. 
2. AWS S3 implementation 