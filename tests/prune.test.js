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

test('pruneSnapshots should remove snapshots from the database', async () => {
  const testDir = path.join('testDir');
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(path.join(testDir, 'test.txt'), 'Hello, World!');

  let snapshotId = await backupToolService.takeSnapshot(testDir);

  await backupToolService.pruneSnapshots(snapshotId);

  const client = await backupToolDAO.pool.connect();
  const res = await client.query('SELECT COUNT(*) FROM snapshots WHERE id = $1', [snapshotId]);
  expect(parseInt(res.rows[0].count)).toBe(0);
  const resFiles = await client.query('SELECT COUNT(*) FROM files WHERE snapshot_id = $1', [snapshotId]);
  expect(parseInt(resFiles.rows[0].count)).toBe(0);
  client.release();

  fs.rmdirSync(testDir, { recursive: true });
});