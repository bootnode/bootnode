from functools import wraps
from flask import Flask, request
from flask_restful import Resource, Api
from flask_cors import CORS
from bootnode import Bootnode

app = Flask(__name__)
CORS(app)

api = Api(app)

SUPPORTED_ZONES = ['us-central1-a', 'europe-west6-a', 'asia-east2-a']

def convert_to_nodes(deployments, services, pods, zone):
    nodes_by_id = {}
    nodes = []
    for d in deployments:
        nodes_by_id[d['name']] = len(nodes)

        nodes.append({
            'blockchain': d['blockchain'],
            'network': d['network'],
            'id': d['name'],
            'instances': [],
            'zone': zone,
        })

    for s in services:
        i = nodes_by_id.get(s['name'])

        if i is not None:
            nodes[i]['ip'] = s['ip']
            nodes[i]['ports'] = s['ports']
        else:
            print('{0} does not exist'.format(s['name']))

    for p in pods:
        i = nodes_by_id.get('{0}-{1}-{2}'.format(p['blockchain'], p['network'], p['number']))

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
            zones = SUPPORTED_ZONES
            try:
                json = request.get_json()

                if json['zone'] is None:
                    zones = [json['zone']]
            except Exception as e:
                print('warning: no zone provided, getting all zones: ' + str(e))

            nodes = []
            for zone in zones:
                print('getting nodes in zone: ' + zone)
                bootnode = Bootnode('casper', 'testnet', zone)

                deployments = [d.to_dict() for d in bootnode.list_deployments()]
                services = [s.to_dict() for s in bootnode.list_services()]
                pods = [p.to_dict() for p in bootnode.list_pods()]

                nodes += convert_to_nodes(deployments, services, pods, zone)

            return nodes

        except Exception as e:
            return {
                'status': 'failed',
                'error': 'could not get nodes: ' + str(e),
            }

    @auth_required
    def put(self):
        try:
            json = request.get_json()
            print('launching ' + json['number'] + ' nodes in ' + json['zone'])

            if json['zone'] not in SUPPORTED_ZONES:
                return {
                    'status': 'failed',
                    'error': json['zone'] + ' is not a valid zone',
                }

            bootnode = Bootnode('casper', 'testnet', json['zone'])

            number = 1
            if json['number'] is not None:
                number = int(json['number'])

            nodes = []
            for i in range(number):
                ret = bootnode.create_deployment()
                nodes.append(Node().get(ret['deployment'].metadata.name, zone=json['zone']))

            return nodes
        except Exception as e:
             return {
                'status': 'failed',
                 'error': 'could not create a node: ' + str(e)
            }

class Node(Resource):
    @auth_required
    def get(self, node_id, zone='us-central1-a'):
        try:
            bootnode = Bootnode('casper', 'testnet', zone)

            deployment = bootnode.get_deployment(node_id)
            service = bootnode.get_service(node_id)
            pods = [p.to_dict() for p in bootnode.list_pods(label_selector='app=' + node_id)]

            return convert_to_nodes([deployment.to_dict()],
                                    [service.to_dict()], pods, zone)
        except Exception as e:
            return {
                'status': 'failed',
                'error': 'node not found: ' + str(e)
            }

    @auth_required
    def delete(self, node_id, zone='us-central1-a'):
        try:
            json = request.get_json()
            print('deleting ' + node_id + ' from zone ' + json['zone'])

            zone = json['zone']

            bootnode = Bootnode('casper', 'testnet', zone)
            bootnode.delete_deployment(node_id)
            return {
                'status': 'ok',
            }
        except Exception as e:
            return {
                'status': 'failed',
                'error': 'could not delete: ' + str(e)
            }

api.add_resource(Nodes, '/nodes')
api.add_resource(Node, '/nodes/<node_id>')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port='4000')
