from functools import wraps
from flask import Flask, request
from flask_restful import Resource, Api
from flask_cors import CORS
from bootnode import Bootnode

app = Flask(__name__)
CORS(app)

api = Api(app)

def convert_to_nodes(deployments, services, pods):
    nodesById = {}
    nodes = []
    for d in deployments:
        nodesById[d['name']] = len(nodes)

        nodes.append({
            'blockchain': d['blockchain'],
            'network': d['network'],
            'id': d['name'],
            'instances': [],
        })

    for s in services:
        i = nodesById.get(s['name'])

        if i is not None:
            nodes[i]['ip'] = s['ip']
            nodes[i]['ports'] = s['ports']
        else:
            print('{0} does not exist'.format(s['name']))

    for p in pods:
        i = nodesById.get('{0}-{1}-{2}'.format(p['blockchain'], p['network'], p['number']))

        if i is not None:
            nodes[i]['instances'].append({
                'name': p['name'],
                'status': p['status'],
            })
        else:
            print('{0} does not exist'.format(p['name']))

    return nodes

def auth_required(fn):
    @wraps(fn)
    def wrapped_fn(*args, **kwargs):
        print(request.headers.get('Authorization'))
        if request.headers.get('Authorization') != 'Bearer fLcLu7OLD81aR9jf':
            return {
                'status': 'failed',
                'error': 'authorization required',
            }
        return fn(*args, **kwargs)
    return wrapped_fn

class Nodes(Resource):
    @auth_required
    def get(self):
        try:
            bootnode = Bootnode('casper', 'testnet')

            deployments = [d.to_dict() for d in bootnode.list_deployments()]
            services = [s.to_dict() for s in bootnode.list_services()]
            pods = [p.to_dict() for p in bootnode.list_pods()]

            return convert_to_nodes(deployments, services, pods)
        except Exception as e:
            print(e.message, e.args)
            return {
                'status': 'failed',
                'error': + (e.message if e is not None else 'unknown'),
            }

    @auth_required
    def put(self):
        try:
            bootnode = Bootnode('casper', 'testnet')

            ret = bootnode.create_deployment()
            return Node().get(ret['deployment'].metadata.name)
        except Exception as e:
             return {
                'status': 'failed',
                'error': 'could not create a node' + (': ' +e.message if e is not None else ''),
            }

class Node(Resource):
    @auth_required
    def get(self, node_id):
        try:
            bootnode = Bootnode('casper', 'testnet')

            deployment = bootnode.get_deployment(node_id)
            service = bootnode.get_service(node_id)
            pods = [p.to_dict() for p in bootnode.list_pods(label_selector='app=' + node_id)]

            return convert_to_nodes([deployment.to_dict()], [service.to_dict()], pods)
        except Exception as e:
            return {
                'status': 'failed',
                'error': 'node not found' + (': ' +e.message if e is not None else ''),
            }

    @auth_required
    def delete(self, node_id):
        try:
            bootnode = Bootnode('casper', 'testnet')
            bootnode.delete_deployment(node_id)
            return {
                'status': 'ok',
            }
        except Exception as e:
            return {
                'status': 'failed',
                'error': 'could not delete' + (': ' +e.message if e is not None else ''),
            }

api.add_resource(Nodes, '/nodes')
api.add_resource(Node, '/nodes/<node_id>')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port='4000')
