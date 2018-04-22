from tabulate import tabulate
from collections import Iterable


def table(data, *attrs):
    """
    Takes an object or list of objects and formats listed attributes in a
    table.
    """

    # Ensure data is iterable
    if not isinstance(data, Iterable):
        data = [data]

    # Generate headers from attributes specified
    headers = [a.upper().replace('_', ' ') for a in attrs]

    # Generate tabular data from list of objects
    table = []
    for obj in data:
        row = []

        # Grab each attribute off object
        for a in attrs:
            v = getattr(obj, a, None)

            # If attribute is callable, use returned value
            if callable(v):
                row.append(v())
            else:
                row.append(v)

        table.append(row)

    # Pretty print table and headers
    print(tabulate(table, headers=headers))
