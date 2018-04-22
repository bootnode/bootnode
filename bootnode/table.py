from tabulate import tabulate
from collections import Iterable


def table(data, *attrs):
    if not isinstance(data, Iterable):
        data = [data]
    headers = [a.upper().replace('_', ' ') for a in attrs]
    table = []
    for obj in data:
        row = []
        for a in attrs:
            v = getattr(obj, a, None)
            if callable(v):
                row.append(v())
            else:
                row.append(v)
        table.append(row)
    print(tabulate(table, headers=headers))
