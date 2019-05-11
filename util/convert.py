def to_nodes(deployments, services, pods, zone):
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

