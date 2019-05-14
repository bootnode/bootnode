def to_nodes(deployments, services, pods, zone):
    nodes_by_id = {}
    nodes = []
    for d in deployments:
        try:
            nodes_by_id[d['name']] = len(nodes)

            nodes.append({
                'blockchain': d['blockchain'],
                'network': d['network'],
                'id': d['name'],
                'instances': [],
                'zone': zone,
            })
        except Exception as e:
            print('warning: skipping invalid deployment ' + str(d) + ': ' + str(e))

    for s in services:
        try:
            i = nodes_by_id.get(s['name'])

            if i is not None:
                nodes[i]['ip'] = s['ip']
                nodes[i]['ports'] = s['ports']
            else:
                print('{0} does not exist'.format(s['name']))
        except Exception as e:
            print('warning: skipping invalid service ' + str(s) + ': ' + str(e))

    for p in pods:
        try:
            i = nodes_by_id.get('{0}-{1}-{2}'.format(p['blockchain'], p['network'], p['number']))

            if i is not None:
                nodes[i]['instances'].append({
                    'name': p['name'],
                    'status': p['status'],
                })
            else:
                print('{0} does not exist'.format(p['name']))
        except Exception as e:
            print('warning: skipping invalid pod ' + str(p) + ': ' + str(e))

    return nodes

