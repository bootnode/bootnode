from threading import Thread
from functools import wraps
from quart import jsonify, Quart, request
from quart_cors import cors
from bootnode import Bootnode
from util import asynctools, convert
from pymongo import MongoClient
import datetime
import asyncio
import requests_async as requests
import datetime
import nest_asyncio

nest_asyncio.apply()

app = Quart(__name__)
cors(app)

SUPPORTED_PROVIDERS = ['private-cloud', 'google']
SUPPORTED_ZONES = {
    'google': ['us-central1-a', 'europe-west6-a', 'asia-east2-a'],
    'private-cloud': ['london1', 'munich1', 'oslo1', 'tokyo1'],
}

# connect to mongo and set up database vars
mongo_client = MongoClient()
bootnode_db = mongo_client.bootnode
nodes_collection = bootnode_db.nodes
updates_collection = bootnode_db.updates
node_statuses = bootnode_db.node_statuses

# set up system update loop
async def update_nodes_lambda(date, zone, provider):
    print('updating', date, zone, provider)
    print('-------- Getting ' + provider + ' nodes in zone: ' + zone + ' --------')
    bootnode = Bootnode('casper', 'testnet', provider, zone)

    deployments = [d.to_dict() for d in await bootnode.list_deployments()]
    services = [s.to_dict() for s in await bootnode.list_services()]
    pods = [p.to_dict() for p in await bootnode.list_pods()]

    nodes = convert.to_nodes(deployments, services, pods, zone)

    for node in nodes:
        node['lastUpdated'] = date

        try:
            if node['blockchain'] == 'casper' and node['ip'] is not None:
                ip = node['ip']
                port = 9001
                if provider == 'private-cloud':
                    for p in node['ports']:
                        if p['port'] == 9001:
                            port = p['nodePort']

                node['provider'] = provider

                print('Pod', zone + ' ' + node['id'] + ' ' + node['ip'])

                start = datetime.datetime.now()

                reqs = [
                    requests.put('https://{0}:{1}/show/blocks'.format(ip, port),
                                     json={'depth': 1},
                                     verify=False),
                    requests.put('https://{0}:{1}/show/dag'.format(ip,
                                                                   port),
                                     json={'depth': 10,
                                           'showJustifications':
                                           True}, verify=False)
                ]

                ress = await asyncio.gather(*reqs)

                blockdata = ress[0]
                dag = ress[1]

                end = datetime.datetime.now()

                node['metadata'] = {
                    'block': blockdata.json()[0],
                    'dag': dag.json(),
                }
                node['latencyMillis'] = (end - start).microseconds / 1000

        except Exception as e:
            print('cannot get metadata for ' + node['id'] + ': ' +
                  str(e))

        nodes_collection.insert_one(node)

    # except Exception as e:
    #     print('update nodes loop error: ' + str(e))
    # finally:

loop = asyncio.new_event_loop()
asyncio.get_child_watcher().attach_loop(loop)

# function to spin off thread
async def update_nodes_loop():
    while True:
        date = datetime.datetime.utcnow()

        updates = []
        for provider in SUPPORTED_PROVIDERS:
            zones = SUPPORTED_ZONES[provider]

            for zone in zones:
                updates.append(update_nodes_lambda(date, zone, provider))

        await asyncio.gather(*updates)

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

        await asyncio.sleep(1)

def update_nodes_thread():
    asyncio.set_event_loop(loop)
    loop.run_until_complete(update_nodes_loop())

Thread(target=update_nodes_thread).start()

def auth_required(fn):
    @wraps(fn)
    async def wrapped_fn(*args, **kwargs):
        # print(request.headers.get('Authorization'))
        if request.headers.get('Authorization') != 'Bearer fLcLu7OLD81aR9jf':
            return jsonify({
                'status': 'failed',
                'error': 'authorization required',
            })
        return await fn(*args, **kwargs)
    return wrapped_fn

@app.route('/login', methods=['POST'])
async def login():
    try:
        json = await request.get_json()

        # print('login', json)

        if json['email'] == 'test@bootnode.io' and json['password'] == 'testtest':
            return jsonify({'token': 'fLcLu7OLD81aR9jf'})

        return jsonify({
            'status': 'failed',
            'error': 'incorrect username or password'
        })

    except Exception as e:
        return jsonify({
            'status': 'failed',
            'error': 'could not get login: ' + str(e),
        })

@app.route('/nodes', methods=['GET'])
@auth_required
async def get_nodes():
    try:
        update = updates_collection.find_one({ 'name': 'nodes' })
        # print(update)
        # print('getting node data as of ' + str(update['date']))
        nodes = nodes_collection.find({'lastUpdated': update['date']})

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

@app.route('/nodes', methods=['DELETE'])
@auth_required
async def delete_nodes():
    try:
        print('deleting everything!')

        update = updates_collection.find_one({ 'name': 'nodes' })
        nodes = nodes_collection.find({'lastUpdated': update['date']})

        for node in nodes:
            print('deleting ' + str(await delete_node(node['id'], node['provider'], node['zone'])))

        return jsonify({
            'status': 'success',
        })
    except Exception as e:
         return jsonify({
            'status': 'failed',
             'error': 'could not delete a nodes: ' + str(e)
        })

@app.route('/nodes', methods=['PUT'])
@auth_required
async def put_node():
    try:
        json = await request.get_json()
        print('launching ' + str(json['number']) + ' nodes in ' + str(json['zone']))

        provider = json['provider']
        if provider not in SUPPORTED_PROVIDERS:
            return jsonify({
                'status': 'failed',
                'error': provider + ' is not a valid provider',
            })

        zone = json['zone']
        if zone not in SUPPORTED_ZONES[provider]:
            return jsonify({
                'status': 'failed',
                'error': zone + ' is not a valid zone',
            })

        bootnode = Bootnode('casper', 'testnet', provider, zone)

        number = 1
        if json['number'] is not None:
            number = int(json['number'])

        nodes = []

        ds = []
        for i in range(number):

            async def create_deployment():
                data = await bootnode.create_deployment()
                # print('deployment created', data.deployment)

            ds.append(create_deployment())

        asyncio.ensure_future(asyncio.gather(*ds))

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
async def get_node(node_id, provider=None, zone=None):
    try:
        json = await request.get_json()

        if provider is None:
            provider = json['provider']
        if zone is None:
            zone = json['zone']

        bootnode = Bootnode('casper', 'testnet', provider, zone)

        deployment = await bootnode.get_deployment(node_id)
        service = await bootnode.get_service(node_id)
        pods = [p.to_dict() for p in await bootnode.list_pods(label_selector='app=' + node_id)]

        return jsonify(convert.to_nodes([deployment.to_dict()],
                                [service.to_dict()], pods, zone))
    except Exception as e:
        return jsonify({
            'status': 'failed',
            'error': 'node not found: ' + str(e)
        })

@app.route('/nodes/<node_id>', methods=['DELETE'])
@auth_required
async def delete_node(node_id, provider=None, zone=None):
    try:
        if provider is None:
            json = await request.get_json()
            provider = json['provider']
            zone = json['zone']

        print('deleting ' + node_id + ' from provider ' + provider + ' and zone ' + zone)

        bootnode = Bootnode('casper', 'testnet', provider, zone)
        await bootnode.delete_deployment(node_id)

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
