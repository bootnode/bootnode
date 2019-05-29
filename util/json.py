import json
import datetime
from quart import Response

def default(o):
    if isinstance(o, (datetime.date, datetime.datetime)):
        return o.isoformat()

def jsonify(obj):
    return Response(json.dumps(obj, indent = 2, separators = (', ', ': '), default=default),
        content_type='application/json')


