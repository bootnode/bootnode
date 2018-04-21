from kubernetes import client, config
from kubernetes.stream import stream

POD_NAMESPACE = 'default'


class Pod(object):
    def __init__(self, pod):
        name = pod.metadata.name
        self.name = name

        self.phase = pod.status.phase
        self.ip    = pod.status.pod_ip

        # Pod names should follow client-network-number scheme
        bits = name.split('-')
        self.client  = bits[0]
        self.network = bits[1]

        # Pod may not follow correct naming scheme
        if len(bits) > 2:
            self.number = int(bits[2])
        else:
            self.number = -1

    def __repr__(self):
        return self.name


class Kubernetes(object):
    def __init__(self, config_path='config/cluster.yaml'):
        self.config_path = config_path

        config.load_kube_config(config_path)
        self.api = client.CoreV1Api()

    def list_pods(self, network=None):
        pods = [Pod(p) for p in
                self.api.list_namespaced_pod(POD_NAMESPACE).items]

        if not network:
            return pods

        return [p for p in pods if p.network == network]

    def last_pod(self, network=None):
        return max(self.list_pods(network), key=lambda x: x.number)

    def pod_synced(self, pod_name):
        command = [
            '/bin/geth',
            '--datadir=/data',
            'attach',
            '--exec',
            'eth.syncing',
        ]
        res = stream(self.api.connect_get_namespaced_pod_exec, pod_name,
                     POD_NAMESPACE, command=command, stdin=False, stderr=True,
                     stdout=True, tty=False)

        if res.lower() == 'false':
            return True
        else:
            return False
