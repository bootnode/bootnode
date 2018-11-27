from kubernetes import client, config
from kubernetes.stream import stream

POD_NAMESPACE = 'default'


class Node(object):
    def __init__(self, node, api=None):
        self.api  = api
        self.node = node


class Pool(object):
    def __init__(self, pool, api=None):
        self.api  = api
        self.pool = pool


class Pod(object):
    def __init__(self, pod, api=None):
        self.api = api
        self.pod = pod

        name = pod.metadata.name
        self.name = name

        self.phase = pod.status.phase
        self.ip    = pod.status.pod_ip

        # Pod names should follow client-network-number scheme
        bits = name.split('-')
        self.client  = bits[0]
        self.network = bits[1]

        # Currently only support directly attached gce persistent disks
        try:
            self.disk = pod.spec.volumes[0].gce_persistent_disk.pd_name
        except Exception:
            self.disk = 'unknown'

        # Pod may not follow correct naming scheme
        if len(bits) > 2:
            self.number = int(bits[2])
        else:
            self.number = -1

    def exec(self, js):
        command = [
            '/bin/geth',
            '--datadir=/data',
            'attach',
            '--exec',
            js
        ]
        return self.api.exec(self.name, command).lower()

    def syncing(self):
        if self.exec('eth.syncing').lower() == 'false':
            return False
        else:
            return True

    def block_number(self):
        try:
            return int(self.exec('eth.blockNumber'))
        except:
            return -1

    def __repr__(self):
        return self.name


class Kubernetes(object):
    def __init__(self, config_path='config/cluster.yaml'):
        self.config_path = config_path

        config.load_kube_config(config_path)
        self.api = client.CoreV1Api()

    def exec(self, pod_name, command, namespace=POD_NAMESPACE, stdin=False,
             stderr=True, stdout=True, tty=False):
        return stream(self.api.connect_get_namespaced_pod_exec, pod_name,
                      namespace, command=command, stdin=stdin, stderr=stderr,
                      stdout=stdout, tty=tty)

    def create_pod(self, config):
        return self.api.create_namespaced_pod(POD_NAMESPACE, body=config)

    def delete_pod(self, name, config):
        return self.api.delete_namespaced_pod(name, POD_NAMESPACE, body=config)

    def list_pods(self, network=None):
        pods = [Pod(p, self) for p in
                self.api.list_namespaced_pod(POD_NAMESPACE).items]

        if not network:
            return pods

        return [p for p in pods if p.network == network]

    def get_pod(self, name):
        for pod in self.list_pods():
            if pod.name == name:
                return pod
        raise Exception('Pod not found: "%s"' % name)

    def get_last_pod(self, network=None):
        return max(self.list_pods(network), key=lambda x: x.number)

    def get_synced_pod(self, network=None):
        pods = self.list_pods(network)
        for pod in sorted(pods, key=lambda x: x.number):
            if not pod.syncing():
                return pod
