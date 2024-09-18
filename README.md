
## Backup Tool 
For detailed requirements and solutions, refer to the **[BUILD_PLAN.md](./BUILD_PLAN.md)** document.


## Get Started at your Local Environment

## Prerequisites
* PostgreSQL database
* Node.js installed
* npm installed

### Setup 
#### Step 1. Create the database 
```sql
CREATE ROLE backup_tool WITH LOGIN PASSWORD 'backup_tool_local';
GRANT ALL PRIVILEGES ON DATABASE backup_tool TO backup_tool;
```
#### Step 2. Install dependencies 
```
npm install 
```
#### Step 3. Initalize the database 
```
node init_db.js
```
#### Step 4. Generate test files 
Run file_gen.sh to generate test files.  Default is 5 with size of 1024 bytes and output to snapshot_files folder.  Feel to change directly. 
```
file_gen.sh
```
If script file didn't run, make sure to have it setup as exeuctable 
```chmod +x file_gen.sh```

-- **_Setup Complete_**

## Commands to Run
#### Taking a snapshot 
Run ```backup.sh``` to take a snaphot.  It just a wrapper around call to run the actual command in index.js - ```node src/index.js snapshot --targetDirectory $directory``` The default is to look at ``snapshot-files`` folder but it can be pass in as argument to ``backup.sh``

#### Get a list of snapshot 
Run ```list.sh```

#### Restore a snapshot
Run ```restore.sh <snapshotId>```.  The default directory is output but it can be pass in as argument to ``restore.sh``
 
#### Prune a snapshot
Run ```prune.sh <snapshotId>```

#### Run Tests
```npm test```

#### Switch between chunking and non-chunking technique
Update .env file to change the ```TECHNIQUE = 'chunking/not-chunking'```
