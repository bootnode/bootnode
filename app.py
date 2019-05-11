from threading import Thread
from functools import wraps
from quart import jsonify, Quart, request
from quart_cors import cors
from bootnode import Bootnode
from util import asynctools, convert
from pymongo import MongoClient
import datetime
import asyncio

app = Quart(__name__)
cors(app)

SUPPORTED_ZONES = ['us-central1-a', 'europe-west6-a', 'asia-east2-a']

# connect to mongo and set up database vars
mongo_client = MongoClient()
bootnode_db = mongo_client.bootnode
nodes_collection = bootnode_db.nodes
updates_collection = bootnode_db.updates

# set up system update loop
def update_nodes_lambda():
    print('updating nodes')
    try:
        date = datetime.datetime.utcnow()
        zones = SUPPORTED_ZONES

        for zone in zones:
            print('getting nodes in zone: ' + zone)
            bootnode = Bootnode('casper', 'testnet', zone)

            deployments = [d.to_dict() for d in bootnode.list_deployments()]
            services = [s.to_dict() for s in bootnode.list_services()]
            pods = [p.to_dict() for p in bootnode.list_pods()]

            nodes = convert.to_nodes(deployments, services, pods, zone)

            for node in nodes:
                node['lateUpdated'] = date
                nodes_collection.insert_one(node)

    except Exception as e:
        print('update nodes loop' + str(e))
    finally:
        updates_collection.update_one(
            {
                'name': 'nodes',
            },
            {
                '$set': {
                    'date': date
                },
            },
            True
        )

# function to spin off thread
async def update_nodes_loop():
    while True:
        update_nodes_lambda()
        await asyncio.sleep(1)

def update_nodes_daemon():
    loop = asyncio.new_event_loop()
    task = loop.create_task(update_nodes_loop())
    loop.run_until_complete(task)

Thread(target=update_nodes_daemon, daemon=True).start()

def auth_required(fn):
    @wraps(fn)
    async def wrapped_fn(*args, **kwargs):
        print(request.headers.get('Authorization'))
        if request.headers.get('Authorization') != 'Bearer fLcLu7OLD81aR9jf':
            return jsonify({
                'status': 'failed',
                'error': 'authorization required',
            })
        return await fn(*args, **kwargs)
    return wrapped_fn

@app.route('/nodes', methods=['GET'])
@auth_required
async def get_nodes():
    try:
        update = updates_collection.find_one({ 'name': 'nodes' })
        print(update)
        print('getting node data as of ' + str(update['date']))
        nodes = nodes_collection.find({'lateUpdated': update['date']})

        ns = []
        for node in nodes:
            node.pop('_id')
            ns.append(node)

        return jsonify(ns)

    except Exception as e:
        return jsonify({
            'status': 'failed',
            'error': 'could not get nodes: ' + str(e),
        })

@app.route('/nodes', methods=['PUT'])
@auth_required
async def put_node():
    try:
        json = await request.get_json()
        print('launching ' + str(json['number']) + ' nodes in ' + str(json['zone']))

        if json['zone'] not in SUPPORTED_ZONES:
            return jsonify({
                'status': 'failed',
                'error': json['zone'] + ' is not a valid zone',
            })

        bootnode = Bootnode('casper', 'testnet', json['zone'])

        number = 1
        if json['number'] is not None:
            number = int(json['number'])

        def create_deployment():
            try:
                bootnode.create_deployment()
            except Exception as e:
                print('could not create deployment: ' + str(e))

        nodes = []
        for i in range(number):
            asyncio.get_event_loop().run_in_executor(None,
                                                       create_deployment())

        return jsonify({
            'status': 'success',
            'nodes-starting': number,
        })
    except Exception as e:
         return jsonify({
            'status': 'failed',
             'error': 'could not create a node: ' + str(e)
        })

@app.route('/nodes/<node_id>', methods=['GET'])
@auth_required
async def get_node(node_id, zone='us-central1-a'):
    try:
        bootnode = Bootnode('casper', 'testnet', zone)

        deployment = bootnode.get_deployment(node_id)
        service = bootnode.get_service(node_id)
        pods = [p.to_dict() for p in bootnode.list_pods(label_selector='app=' + node_id)]

        return jsonify(convert.to_nodes([deployment.to_dict()],
                                [service.to_dict()], pods, zone))
    except Exception as e:
        return jsonify({
            'status': 'failed',
            'error': 'node not found: ' + str(e)
        })

@app.route('/nodes/<node_id>', methods=['DELETE'])
@auth_required
async def delete_node(node_id, zone='us-central1-a'):
    try:
        json = await request.get_json()
        print('deleting ' + node_id + ' from zone ' + json['zone'])

        zone = json['zone']

        bootnode = Bootnode('casper', 'testnet', zone)
        bootnode.delete_deployment(node_id)
        return jsonify({
            'status': 'ok',
        })
    except Exception as e:
        return jsonify({
            'status': 'failed',
            'error': 'could not delete: ' + str(e)
        })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port='4000')
