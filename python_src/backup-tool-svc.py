import os
import hashlib
import datetime
import argparse
from pathlib import Path

from cli_table import Table
from backup_tool_dao import BackupToolDAO
from technique import TECHNIQUE  # Import the TECHNIQUE enum

class BackupToolService:
    def __init__(self):
        self.dao = BackupToolDAO()
        self.technique = TECHNIQUE[os.getenv('TECHNIQUE', TECHNIQUE.CHUNKING.value)]
        self.chunk_size = int(os.getenv('CHUNK_SIZE', 1024 * 1024))  # Default to 1MB

    def take_snapshot(self, target_directory):
        timestamp = datetime.datetime.now().isoformat()
        directory_size = self.get_directory_size(target_directory)
        snapshot_id = self.dao.insert_snapshot(timestamp, directory_size, self.technique.value)

        for root, _, files in os.walk(target_directory):
            for file in files:
                file_path = os.path.join(root, file)
                file_size = os.path.getsize(file_path)
                if self.technique == TECHNIQUE.CHUNKING:
                    self.snapshot_by_chunk(snapshot_id, file_path, file_size)
                else:
                    self.snapshot_by_file(snapshot_id, file_path, file_size)
        return snapshot_id

    def list_snapshots(self):
        snapshots = self.dao.list_snapshots()
        table = Table(['SNAPSHOT', 'TIMESTAMP', 'DIRECTORY SIZE', 'SNAPSHOT SIZE', 'TECHNIQUE'])
        for snapshot in snapshots:
            snapshot_size = self.dao.get_snapshot_size(snapshot['id'])
            table.add_row([snapshot['id'], snapshot['timestamp'], snapshot['directory_size'], snapshot_size, snapshot['technique']])
        print(table)
        total_db_size = self.dao.get_total_database_size()
        print(f'Total database size: {total_db_size}')
        return snapshots

    def restore_snapshot(self, snapshot_id, output_directory):
        snapshot = self.dao.get_snapshot(snapshot_id)
        if snapshot:
            files = self.dao.get_files_by_snapshot_id(snapshot_id)
            for file in files:
                file_path = os.path.join(output_directory, file['path'])
                if snapshot['technique'] == TECHNIQUE.CHUNKING.value:
                    self.restore_from_chunk(file, file_path)
                else:
                    self.restore_from_content(file, file_path)

    def prune_snapshots(self, snapshot_id):
        snapshot = self.dao.get_snapshot(snapshot_id)
        if snapshot:
            self.dao.delete_snapshot(snapshot_id)

    def get_directory_size(self, directory):
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(directory):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                total_size += os.path.getsize(fp)
        return total_size

    def snapshot_by_chunk(self, snapshot_id, file_path, file_size):
        with open(file_path, 'rb') as f:
            chunk_number = 0
            while chunk := f.read(self.chunk_size):
                chunk_hash = hashlib.sha256(chunk).hexdigest()
                self.dao.insert_chunk(snapshot_id, file_path, chunk_number, chunk_hash, chunk)
                chunk_number += 1

    def snapshot_by_file(self, snapshot_id, file_path, file_size):
        with open(file_path, 'rb') as f:
            content = f.read()
            file_hash = hashlib.sha256(content).hexdigest()
            self.dao.insert_file(snapshot_id, file_path, file_hash, content)

    def restore_from_chunk(self, file, file_path):
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'wb') as f:
            chunks = self.dao.get_chunks_by_file(file['id'])
            for chunk in chunks:
                f.write(chunk['data'])

    def restore_from_content(self, file, file_path):
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'wb') as f:
            f.write(file['content'])

def main():
    backup_tool_service = BackupToolService()

    parser = argparse.ArgumentParser(description='Backup Tool')
    subparsers = parser.add_subparsers(dest='command')

    snapshot_parser = subparsers.add_parser('snapshot', help='Take a snapshot of a directory')
    snapshot_parser.add_argument('targetDirectory', type=str, help='Target directory to snapshot')

    list_parser = subparsers.add_parser('list', help='List all snapshots')

    restore_parser = subparsers.add_parser('restore', help='Restore a snapshot')
    restore_parser.add_argument('snapshot', type=int, help='Snapshot ID to restore')
    restore_parser.add_argument('outputDirectory', type=str, help='Output directory for restored files')

    prune_parser = subparsers.add_parser('prune', help='Prune old snapshots')
    prune_parser.add_argument('snapshot', type=int, help='Snapshot ID to prune')

    args = parser.parse_args()

    if args.command == 'snapshot':
        backup_tool_service.take_snapshot(args.targetDirectory)
    elif args.command == 'list':
        backup_tool_service.list_snapshots()
    elif args.command == 'restore':
        backup_tool_service.restore_snapshot(args.snapshot, args.outputDirectory)
    elif args.command == 'prune':
        backup_tool_service.prune_snapshots(args.snapshot)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()