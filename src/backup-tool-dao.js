const { Pool } = require('pg');
require('dotenv').config();

class BackupToolDAO {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
  }
  async dropdatabase() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        DROP SCHEMA IF EXISTS public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO ${process.env.DB_USER};
        GRANT ALL ON SCHEMA public TO public;
        `);
    } finally {
      client.release();
    }
  }
  async createTables() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS snapshots (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMP NOT NULL,
          directory_size BIGINT NOT NULL,
          technique TEXT
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS files (
          id SERIAL PRIMARY KEY,
          snapshot_id INTEGER,
          path TEXT NOT NULL,
          hash TEXT NOT NULL,
          size BIGINT NOT NULL,
          FOREIGN KEY(snapshot_id) REFERENCES snapshots(id)
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS contents (
          hash TEXT PRIMARY KEY,
          content BYTEA
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS chunks (
          hash TEXT PRIMARY KEY,
          content BYTEA
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS file_chunks (
          file_id INTEGER,
          chunk_hash TEXT,
          chunk_order INTEGER,
          FOREIGN KEY(file_id) REFERENCES files(id),
          FOREIGN KEY(chunk_hash) REFERENCES chunks(hash)
        );
      `);
    } finally {
      client.release();
    }
  }

  async insertSnapshot(timestamp, directorySize, technique) {
    const client = await this.pool.connect();
    try {
      const res = await client.query('INSERT INTO snapshots (timestamp, directory_size, technique) VALUES ($1, $2, $3) RETURNING id', [timestamp, directorySize, technique]);
      return res.rows[0].id;
    } finally {
      client.release();
    }
  }

  async insertFile(snapshotId, filePath, fileHash, fileSize) {
    const client = await this.pool.connect();
    try {
      const res =  await client.query(
        'INSERT INTO files (snapshot_id, path, hash, size) VALUES ($1, $2, $3, $4) RETURNING id',
        [snapshotId, filePath, fileHash, fileSize]
      );
      return res.rows[0].id;
    } finally {
      client.release();
    }
  }

  async insertContent(fileHash, fileContent) {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO contents (hash, content) VALUES ($1, $2)', [fileHash, fileContent]);
    } finally {
      client.release();
    }
  }

  async getContentByHash(fileHash) {
    const client = await this.pool.connect();
    try {
      const res = await client.query('SELECT content FROM contents WHERE hash = $1', [fileHash]);
      return res?.rows[0]?.content;
    } finally {
      client.release();
    }
  }

  async getFilesBySnapshotId(snapshotId) {
    const client = await this.pool.connect();
    try {
      const res = await client.query('SELECT id, path, hash, size FROM files WHERE snapshot_id = $1', [snapshotId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async getSnapshot(snapshotId) {
    const client = await this.pool.connect();
    try {
      const res = await client.query('SELECT id, timestamp, directory_size, technique FROM snapshots WHERE id = $1', [snapshotId]);
      return res?.rows[0];
    } finally {
      client.release();
    }
  }

  async listSnapshots() {
    const client = await this.pool.connect();
    try {
      const res = await client.query('SELECT id, timestamp, directory_size, technique FROM snapshots');
      return res.rows;
    } finally {
      client.release();
    }
  }

  async getSnapshotSize(snapshotId) {
    const client = await this.pool.connect();
    try {
      const res = await client.query('SELECT SUM(size) AS snapshot_size FROM files WHERE snapshot_id = $1', [snapshotId]);
      return res.rows[0].snapshot_size;
    } finally {
      client.release();
    }
  }

  async getTotalDatabaseSize() {
    const client = await this.pool.connect();
    try {
      const res = await client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size
      `);
      return res.rows[0].db_size;
    } finally {
      client.release();
    }
  }

  async deleteSnapshot(snapshotId) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        DELETE FROM file_chunks
        USING files
        WHERE file_chunks.file_id = files.id
        AND files.snapshot_id = $1
      `, [snapshotId]);
      await client.query('DELETE FROM files WHERE snapshot_id = $1', [snapshotId]);
      await client.query('DELETE FROM snapshots WHERE id = $1', [snapshotId]);
    } finally {
      client.release();
    }
  }

  async getAllFileContents() {
    const client = await this.pool.connect();
    try {
      const res = await client.query('SELECT hash, content FROM contents');
      return res.rows;
    } finally {
      client.release();
    }
  }

  /**
   * For chunking feature implementation
   */
  /**
   * @param {*} chunkHash 
   * @param {*} chunkContent 
   */
  async insertChunk(chunkHash, chunkContent) {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO chunks (hash, content) VALUES ($1, $2)', [chunkHash, chunkContent]);
    } finally {
      client.release();
    }
  }

  async getChunkByHash(chunkHash) {
    const client = await this.pool.connect();
    try {
      const res = await client.query('SELECT content FROM chunks WHERE hash = $1', [chunkHash]);
      return res?.rows[0]?.content;
    } finally {
      client.release();
    }
  }

  async insertFileChunk(fileId, chunkHash, chunkOrder) {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO file_chunks (file_id, chunk_hash, chunk_order) VALUES ($1, $2, $3)', [fileId, chunkHash, chunkOrder]);
    } finally {
      client.release();
    }
  }

  async getFileChunks(fileId) {
    const client = await this.pool.connect();
    try {
      const res = await client.query('SELECT chunk_hash, chunk_order FROM file_chunks WHERE file_id = $1 ORDER BY chunk_order', [fileId]);
      return res.rows;
    } finally {
      client.release();
    }
  }
}

module.exports = BackupToolDAO;