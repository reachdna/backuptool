/**
 * BackupToolService class provides methods to take snapshots of directories,
 * list snapshots, restore snapshots, prune snapshots, and check the integrity
 * of the database.
 */
const fs = require('fs');
const path = require('path');
const Table = require('cli-table3');
const crypto = require('crypto');

const { TECHNIQUE } = require('./technique')
const BackupToolDAO = require('./backup-tool-dao');



class BackupToolService {
  /**
   * Initalizes the BackupToolService with a new BackupToolDAO instance. 
   * and configuration values for the backup technique and chunk size.
   */
  constructor() {
    this.dao = new BackupToolDAO();
    this.technique = process.env.TECHNIQUE;
    this.chunkSize = process.env.CHUNK_SIZE;
  }

  /**
   * Takes a snapshot of the target directory and stores the snapshot in the database.
   * @param {*} targetDirectory The directory to take a snapshot of. 
   * @returns {Promise<number>} The ID of the snapshot that was taken.
   */
  async takeSnapshot(targetDirectory) {
    const timestamp = new Date().toISOString();
    const directorySize = await this.#getDirectorySize(targetDirectory);
    const snapshotId = await this.dao.insertSnapshot(timestamp, directorySize, this.technique);

    const files = fs.readdirSync(targetDirectory);
    for (const file of files) {
      const filePath = path.join(targetDirectory, file);
      const fileSize = fs.statSync(filePath).size;
      if (this.technique === TECHNIQUE.CHUNKING) {
        await this.#snapshotByChunk(snapshotId, filePath, fileSize);
      } else {
        await this.#snapshotByFile(snapshotId, filePath, fileSize);
      }
    }
    return snapshotId;
  }


  /**
   *  Lists all snapshots stored in the database and prints them to the console in a table format
   * @returns {Promise<Array>} A list of snapshots stored in the database.
   */
  async listSnapshots() {
    const snapshots = await this.dao.listSnapshots();
    let table = new Table({
      head: ['SNAPSHOT', 'TIMESTAMP', 'DIRECTORY SIZE', 'SNAPSHOT SIZE', 'TECHNIQUE']
    });
    for (const snapshot of snapshots) {
      const snapshotSize = await this.dao.getSnapshotSize(snapshot.id);
      table.push(
        [snapshot.id, new Date(snapshot.timestamp).toLocaleString(), snapshot.directory_size, snapshotSize, snapshot.technique]
      );
    }
    console.log(table.toString());
    const totalDbSize = await this.dao.getTotalDatabaseSize();
    console.log(`Total database size: ${totalDbSize}`);
    return snapshots;
  }

  /**
   * Restores a snapshot by recreating the files in the output directory.
   * @param {*} snapshotId 
   * @param {*} outputDirectory 
   */
  async restoreSnapshot(snapshotId, outputDirectory) {
    const snapshot = await this.dao.getSnapshot(snapshotId);
    if (snapshot) {
      const files = await this.dao.getFilesBySnapshotId(snapshotId);
      for (const file of files) {
        const filePath = path.join(outputDirectory, file.path);
        if (snapshot.technique === TECHNIQUE.CHUNKING) {
          await this.#restoreFromChunk(file, filePath);
        } else {
          await this.#restoreFromContent(file, filePath);
        }
      }
    }
  }

  /**
   * Deletes a snapshot, files, and file_chunk(if applicable) from the database.
   * @param {*} snapshotId 
   */
  async pruneSnapshots(snapshotId) {
    const snapshot = await this.dao.getSnapshot(snapshotId);
    if (snapshot) {
      await this.dao.deleteSnapshot(snapshotId);
    }
  }

  /**
   * Checks the database for corrupted file content by comparing the hash of the content
   */
  async checkDatabase() {
    const fileContents = await this.dao.getAllFileContents();
    let corruptedFiles = [];

    for (const file of fileContents) {
      const computedHash = await this.#hashContent(file.content);
      if (computedHash !== file.hash) {
        corruptedFiles.push(file.hash);
      }
    }
    if (corruptedFiles.length > 0) {
      console.log('Corrupted files found:');
      corruptedFiles.forEach(hash => console.log(`Hash: ${hash}`));
    } else {
      console.log('No corrupted files found.');
    }
  }

  /**
   * ********** PRIVATE METHODS **********
   */

  /**
   * Takes a snapshot of a file by chunking the file into smaller chunks
   * @param {*} snapshotId 
   * @param {*} filePath 
   * @param {*} fileSize 
   */
  async #snapshotByChunk(snapshotId, filePath, fileSize) {
    const fileId = await this.dao.insertFile(snapshotId, filePath, '', fileSize); // Empty hash for now
    const fileChunks = await this.#chunkFile(filePath);

    for (let i = 0; i < fileChunks.length; i++) {
      const chunk = fileChunks[i];
      const chunkHash = await this.#hashContent(chunk);

      // Check if the chunk hash already exists
      const existingChunk = await this.dao.getChunkByHash(chunkHash);
      if (!existingChunk) {
        // If the chunk hash does not exist, store the chunk
        await this.dao.insertChunk(chunkHash, chunk);
      }
      // Store the file chunk reference
      await this.dao.insertFileChunk(fileId, chunkHash, i);
    }
  }
  /**
   * Takes a snapshot of a file by storing the file content directly
   * @param {*} snapshotId 
   * @param {*} filePath 
   * @param {*} fileSize 
   */
  async #snapshotByFile(snapshotId, filePath, fileSize) {
    const fileHash = await this.#hashFile(filePath);
    const content = await this.dao.getContentByHash(fileHash);
    if (!content) {
      // If the content hash does not exist, store the content
      const fileContent = fs.readFileSync(filePath);
      await this.dao.insertContent(fileHash, fileContent);
    }
    // Store the file path, hash, and size in the files table
    await this.dao.insertFile(snapshotId, filePath, fileHash, fileSize);

  }
  /**
   * Restores a file from its content
   * @param {*} file 
   * @param {*} filePath 
   */
  async #restoreFromContent(file, filePath) {
    const fileContent = await this.dao.getContentByHash(file.hash);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, fileContent);
  }

  /**
   * Restores a file from its chunks
   * @param {*} file 
   * @param {*} filePath 
   */
  async #restoreFromChunk(file, filePath) {
    const fileChunks = await this.dao.getFileChunks(file.id);
    const fileBuffer = Buffer.concat(await Promise.all(fileChunks.map(async (chunk) => {
      return await this.dao.getChunkByHash(chunk.chunk_hash);
    })));
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, fileBuffer);
  }

  async #hashFile(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return this.#hashContent(fileBuffer);
  }

  async #hashContent(content) {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  }

  async #chunkFile(filePath, chunkSize = 1024 * 1024) { // 1MB chunks
    const fileBuffer = fs.readFileSync(filePath);
    const chunks = [];
    for (let i = 0; i < fileBuffer.length; i += chunkSize) {
      chunks.push(fileBuffer.subarray(i, i + chunkSize));
    }
    return chunks;
  }

  async #getDirectorySize(directory) {
    const files = fs.readdirSync(directory);
    let totalSize = 0;
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    }
    return totalSize;
  }
}

module.exports = BackupToolService;