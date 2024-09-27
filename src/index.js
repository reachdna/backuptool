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
  handler: async (argv) => {
    try {
      await backupToolService.takeSnapshot(argv.targetDirectory);
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      process.exit(0);
    }
  },
});

yargs.command({
  command: 'list',
  describe: 'List all snapshots',
  handler: async () => {
    try {
      await backupToolService.listSnapshots();
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      process.exit(0);
    }
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
  handler: async (argv) => {
    try {
      await backupToolService.restoreSnapshot(argv.snapshot, argv.outputDirectory);
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      process.exit(0);
    }
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
  handler: async (argv) => {
    try {
      await backupToolService.pruneSnapshots(argv.snapshot);
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      process.exit(0);
    }
  },
});

yargs.command({
  command: 'check',
  describe: 'Check the database for corrupted file content',
  handler: async () => {
    try {
      await backupToolService.checkDatabase();
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      process.exit(0);
    }
  },
});

yargs.parse();