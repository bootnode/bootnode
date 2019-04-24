from flask import Flask
from flask_restful import Resource, Api
from bootnode import Bootnode

app = Flask(__name__)
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
        i = nodesById[s['name']]

        if i is not None:
            nodes[i]['ip'] = s['ip']
            nodes[i]['ports'] = s['ports']
        else:
            print('{0} does not exist'.format(s.name))

    for p in pods:
        i = nodesById['{0}-{1}-{2}'.format(p['blockchain'], p['network'], p['number'])]

        if i is not None:
            nodes[i]['instances'].append({
                'name': p['name'],
                'status': p['status'],
            })
        else:
            print('{0} does not exist'.format(p['name']))

    return nodes

class Nodes(Resource):
    def get(self):
        bootnode = Bootnode('casper', 'testnet')

        deployments = [d.to_dict() for d in bootnode.list_deployments()]
        services = [s.to_dict() for s in bootnode.list_services()]
        pods = [p.to_dict() for p in bootnode.list_pods()]

        return convert_to_nodes(deployments, services, pods)

    def put(self):
        bootnode = Bootnode('casper', 'testnet')

        ret = bootnode.create_deployment()
        return Node().get(ret['deployment'].metadata.name)

class Node(Resource):
    def get(self, node_id):
        bootnode = Bootnode('casper', 'testnet')

        print(node_id)

        deployment = bootnode.get_deployment(node_id)
        service = bootnode.get_service(node_id)
        pods = [p.to_dict() for p in bootnode.list_pods(label_selector='app=' + node_id)]

        return convert_to_nodes([deployment.to_dict()], [service.to_dict()], pods)

    def delete(self, node_id):
        bootnode = Bootnode('casper', 'testnet')

        try:
            bootnode.delete_deployment(node_id)
            return {
                'status': 'ok',
            }
        except:
            return {
                'status': 'failed',
            }

api.add_resource(Nodes, '/nodes')
api.add_resource(Node, '/nodes/<node_id>')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port='4000')
