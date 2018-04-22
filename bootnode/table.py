from tabulate import tabulate
from collections import Iterable


def attr(obj, a):
    """
    Returns value of attribute on an object, calling attribute if necessary.
    """
    v = getattr(obj, a, None)
    if callable(v):
        return v()
    return v


def table(data, *attrs):
    """
    Takes an object or list of objects and prints specified attributes in a
    nicely formatted table.
    """

    # Ensure data is iterable
    if not isinstance(data, Iterable):
        data = [data]

    # Generate headers from attributes specified
    headers = [a.upper().replace('_', ' ') for a in attrs]

    # Generate tabular data from list of objects
    table   = [[attr(o, a) for a in attrs] for o in data]

    # Pretty print table and headers
    print(tabulate(table, headers=headers))
