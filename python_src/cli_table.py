# cli_table.py
from tabulate import tabulate

class Table:
    def __init__(self, headers):
        self.headers = headers
        self.rows = []

    def add_row(self, row):
        self.rows.append(row)

    def __str__(self):
        return tabulate(self.rows, headers=self.headers, tablefmt='grid')