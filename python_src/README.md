python3 -m venv venv
source venv/bin/activate

python_src/
├── venv/
├── __init__.py
├── requirements.txt
├── setup.py
├── backup_tool_svc.py
├── cli_table.py
└── backup_tool_dao.py

Installing Dependencies
Activate your virtual environment and install the dependencies:
```
source venv/bin/activate
pip install -r requirements.txt
```

python backup_tool_svc.py snapshot /path/to/directory
python backup_tool_svc.py list
python backup_tool_svc.py restore 1 /path/to/output
python backup_tool_svc.py prune 1