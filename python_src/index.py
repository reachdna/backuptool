//** NOT NEEDED
//** This is the entry point for the Backup Tool Service. It is a command line interface that allows the user to interact with the service.
import argparse
from backup_tool_svc import BackupToolService

backupToolService = BackupToolService()

def take_snapshot(args):
  backupToolService.takeSnapshot(args.target_directory)

def list_snapshots(args):
  backupToolService.listSnapshots()

def restore_snapshot(args):
  backupToolService.restoreSnapshot(args.snapshot, args.output_directory)

def prune_snapshots(args):
  backupToolService.pruneSnapshots(args.snapshot)

def check_database(args):
  backupToolService.checkDatabase()

parser = argparse.ArgumentParser(description='Backup Tool Service')
subparsers = parser.add_subparsers()

# Snapshot command
snapshot_parser = subparsers.add_parser('snapshot', help='Take a snapshot of a directory')
snapshot_parser.add_argument('target_directory', type=str, help='Target directory to snapshot')
snapshot_parser.set_defaults(func=take_snapshot)

# List command
list_parser = subparsers.add_parser('list', help='List all snapshots')
list_parser.set_defaults(func=list_snapshots)

# Restore command
restore_parser = subparsers.add_parser('restore', help='Restore a snapshot')
restore_parser.add_argument('snapshot', type=int, help='Snapshot ID to restore')
restore_parser.add_argument('output_directory', type=str, help='Output directory for restored files')
restore_parser.set_defaults(func=restore_snapshot)

# Prune command
prune_parser = subparsers.add_parser('prune', help='Prune old snapshots')
prune_parser.add_argument('snapshot', type=int, help='Snapshot ID to prune')
prune_parser.set_defaults(func=prune_snapshots)

# Check command
check_parser = subparsers.add_parser('check', help='Check the database for corrupted file content')
check_parser.set_defaults(func=check_database)

args = parser.parse_args()
args.func(args)
