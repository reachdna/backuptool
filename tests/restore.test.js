const fs = require('fs');
const path = require('path');
const BackupToolService = require('../src/backup-tool-svc');
const BackupToolDAO = require('../src/backup-tool-dao');

const backupToolService = new BackupToolService();
const backupToolDAO = new BackupToolDAO();

beforeAll(async () => {
  await backupToolDAO.createTables();
});

afterAll(async () => {
  await backupToolDAO.pool.end();
});

test('restoreSnapshot should restore files from the database', async () => {
  const testDir = path.join('testDir');
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(path.join(testDir, 'test.txt'), 'Hello, World!');

  let snapshotId = await backupToolService.takeSnapshot(testDir);

  const outputDir = path.join('outputDir');
  await backupToolService.restoreSnapshot(snapshotId, outputDir);

  const restoredFile = path.join(outputDir, 'testDir', 'test.txt');
  expect(fs.readFileSync(restoredFile, 'utf8')).toBe('Hello, World!');

  fs.rmdirSync(testDir, { recursive: true });
  fs.rmdirSync(outputDir, { recursive: true });
});