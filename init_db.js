const BackupToolDAO = require('./src/backup-tool-dao');

const backupToolDAO = new BackupToolDAO();

const initDatabase = async () => {
  try {
    await backupToolDAO.dropdatabase();
    await backupToolDAO.createTables();
    console.log('Database and tables created successfully.');
  } catch (error) {
    console.error('Error creating database and tables:', error);
  } finally {
    process.exit();
  }
};

initDatabase();