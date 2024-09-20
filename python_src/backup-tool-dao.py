import psycopg2
from psycopg2 import sql
import os

class BackupToolDAO:
    def __init__(self):
        db_name = os.getenv('DB_NAME', 'backup_tool')
        user = os.getenv('DB_USER', 'your_user')
        password = os.getenv('DB_PASSWORD', 'your_password')
        host = os.getenv('DB_HOST', 'localhost')
        port = os.getenv('DB_PORT', '5432')

        self.connection = psycopg2.connect(
            dbname=db_name,
            user=user,
            password=password,
            host=host,
            port=port
        )
        self.create_tables()

    def create_tables(self):
        with self.connection.cursor() as cursor:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS snapshots (
                    id SERIAL PRIMARY KEY,
                    timestamp TEXT,
                    directory_size INTEGER,
                    technique TEXT
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS files (
                    id SERIAL PRIMARY KEY,
                    snapshot_id INTEGER REFERENCES snapshots(id),
                    path TEXT,
                    hash TEXT,
                    content BYTEA
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS chunks (
                    id SERIAL PRIMARY KEY,
                    snapshot_id INTEGER REFERENCES snapshots(id),
                    file_path TEXT,
                    chunk_number INTEGER,
                    chunk_hash TEXT,
                    data BYTEA
                )
            ''')
            self.connection.commit()

    def drop_database(self):
        with self.connection.cursor() as cursor:
            cursor.execute('DROP TABLE IF EXISTS chunks')
            cursor.execute('DROP TABLE IF EXISTS files')
            cursor.execute('DROP TABLE IF EXISTS snapshots')
            self.connection.commit()

    def insert_snapshot(self, timestamp, directory_size, technique):
        with self.connection.cursor() as cursor:
            cursor.execute('''
                INSERT INTO snapshots (timestamp, directory_size, technique)
                VALUES (%s, %s, %s) RETURNING id
            ''', (timestamp, directory_size, technique))
            snapshot_id = cursor.fetchone()[0]
            self.connection.commit()
            return snapshot_id

    def list_snapshots(self):
        with self.connection.cursor() as cursor:
            cursor.execute('SELECT * FROM snapshots')
            return cursor.fetchall()

    def get_snapshot(self, snapshot_id):
        with self.connection.cursor() as cursor:
            cursor.execute('SELECT * FROM snapshots WHERE id = %s', (snapshot_id,))
            return cursor.fetchone()

    def get_files_by_snapshot_id(self, snapshot_id):
        with self.connection.cursor() as cursor:
            cursor.execute('SELECT * FROM files WHERE snapshot_id = %s', (snapshot_id,))
            return cursor.fetchall()

    def insert_file(self, snapshot_id, file_path, file_hash, content):
        with self.connection.cursor() as cursor:
            cursor.execute('''
                INSERT INTO files (snapshot_id, path, hash, content)
                VALUES (%s, %s, %s, %s) RETURNING id
            ''', (snapshot_id, file_path, file_hash, content))
            file_id = cursor.fetchone()[0]
            self.connection.commit()
            return file_id

    def insert_chunk(self, snapshot_id, file_path, chunk_number, chunk_hash, chunk):
        with self.connection.cursor() as cursor:
            cursor.execute('''
                INSERT INTO chunks (snapshot_id, file_path, chunk_number, chunk_hash, data)
                VALUES (%s, %s, %s, %s, %s) RETURNING id
            ''', (snapshot_id, file_path, chunk_number, chunk_hash, chunk))
            chunk_id = cursor.fetchone()[0]
            self.connection.commit()
            return chunk_id

    def get_chunks_by_file(self, file_id):
        with self.connection.cursor() as cursor:
            cursor.execute('SELECT * FROM chunks WHERE file_id = %s', (file_id,))
            return cursor.fetchall()

    def delete_snapshot(self, snapshot_id):
        with self.connection.cursor() as cursor:
            cursor.execute('DELETE FROM snapshots WHERE id = %s', (snapshot_id,))
            cursor.execute('DELETE FROM files WHERE snapshot_id = %s', (snapshot_id,))
            cursor.execute('DELETE FROM chunks WHERE snapshot_id = %s', (snapshot_id,))
            self.connection.commit()

    def get_snapshot_size(self, snapshot_id):
        with self.connection.cursor() as cursor:
            cursor.execute('SELECT SUM(OCTET_LENGTH(content)) FROM files WHERE snapshot_id = %s', (snapshot_id,))
            file_size = cursor.fetchone()[0] or 0
            cursor.execute('SELECT SUM(OCTET_LENGTH(data)) FROM chunks WHERE snapshot_id = %s', (snapshot_id,))
            chunk_size = cursor.fetchone()[0] or 0
            return file_size + chunk_size

    def get_total_database_size(self):
        with self.connection.cursor() as cursor:
            cursor.execute('SELECT SUM(OCTET_LENGTH(content)) FROM files')
            file_size = cursor.fetchone()[0] or 0
            cursor.execute('SELECT SUM(OCTET_LENGTH(data)) FROM chunks')
            chunk_size = cursor.fetchone()[0] or 0
            return file_size + chunk_size