const yargs = require('yargs');
const BackupToolService = require('./backup-tool-svc');

const backupToolService = new BackupToolService();

yargs.command({
  command: 'snapshot',
  describe: 'Take a snapshot of a directory',
  builder: {
    targetDirectory: {
      describe: 'Target directory to snapshot',
      demandOption: true,
      type: 'string',
    },
  },
  handler(argv) {
    backupToolService.takeSnapshot(argv.targetDirectory);
  },
});

yargs.command({
  command: 'list',
  describe: 'List all snapshots',
  handler() {
    backupToolService.listSnapshots();
  },
});

yargs.command({
  command: 'restore',
  describe: 'Restore a snapshot',
  builder: {
    snapshot: {
      describe: 'Snapshot ID to restore',
      demandOption: true,
      type: 'number',
    },
    outputDirectory: {
      describe: 'Output directory for restored files',
      demandOption: true,
      type: 'string',
    },
  },
  handler(argv) {
    backupToolService.restoreSnapshot(argv.snapshot, argv.outputDirectory);
  },
});

yargs.command({
  command: 'prune',
  describe: 'Prune old snapshots',
  builder: {
    snapshot: {
      describe: 'Snapshot ID to prune',
      demandOption: true,
      type: 'number',
    },
  },
  handler(argv) {
    backupToolService.pruneSnapshots(argv.snapshot);
  },
});

yargs.command({
  command: 'check',
  describe: 'Check the database for corrupted file content',
  handler() {
    backupToolService.checkDatabase();
  },
});

yargs.parse();