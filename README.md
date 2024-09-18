
## Backup Tool

For detailed requirements and solutions, refer to the **[BUILD_PLAN.md](./BUILD_PLAN.md)** document.

## Get Started in Your Local Environment

### Prerequisites

- Node.js installed
- npm installed
- PostgreSQL database - optional, if not already on local machine, run `make init` and skip the whole **Setup** since `make init` will
  - Setup a docker container with postgres in it. 
  - Create the proper role and initialize the database 
  - Generate test files

### Setup

#### Step 1: Create the Database

```sql
CREATE ROLE backup_tool WITH LOGIN PASSWORD 'backup_tool_local';
GRANT ALL PRIVILEGES ON DATABASE backup_tool TO backup_tool;
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Initialize the Database

```bash
node init_db.js
```

#### Step 4: Generate Test Files

Run `file_gen.sh` to generate test files. The default is 5 files with a size of 1024 bytes, output to the `snapshot_files` folder. Feel free to change these settings directly.

```bash
file_gen.sh
```

If the script file didn't run, make sure it is set up as executable:

```bash
chmod +x file_gen.sh
```

-- **_Setup Complete_**

## Commands to Run

### Taking a Snapshot

Run `backup.sh` or `make backup`
It is a wrapper around the command in `index.js`:
`bash
node src/index.js snapshot --targetDirectory $directory
`

The default directory is `snapshot-files`, but it can be passed as an argument to `backup.sh`.

### Get a List of Snapshots

Run `list.sh`  or `make list`

### Restore a Snapshot

Run `restore.sh <snapshotId>` or `make restore <snapshotId>`
The default directory is `output`, but it can be passed as an argument to `restore.sh`.

### Prune a Snapshot

Run `prune.sh <snapshotId>`  or `make prune <snapshotId>`

### Check for corrupted content

Run `check.sh` or `make check`

### Run Tests
Run `npm test` or `make test`


### Switch Between Chunking and Non-Chunking Techniques

Update the `.env` file to change the `TECHNIQUE` variable:

```env
TECHNIQUE='chunking/not-chunking'
```
