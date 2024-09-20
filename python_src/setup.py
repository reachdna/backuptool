from setuptools import setup, find_packages

setup(
    name='backup_tool',
    version='0.1',
    packages=find_packages(),
    install_requires=[
        'tabulate',  # Add other dependencies here
    ],
    entry_points={
        'console_scripts': [
            'backup_tool=backup_tool_svc:main',  # Assuming you have a main function in backup_tool_svc.py
        ],
    },
)