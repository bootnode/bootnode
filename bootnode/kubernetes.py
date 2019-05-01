from kubernetes import client, config
from kubernetes.stream import stream

NAMESPACE = 'default'

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

        self.status = pod.status.phase
        self.ip     = pod.status.pod_ip

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

    def to_dict(self):
        return {
            'name': self.name,
            'blockchain': self.client,
            'network': self.network,
            'number': self.number,
            'status': self.status,
        }

class Service(object):
    def __init__(self, service, api=None):
        self.api = api
        self.service = service

        selector = service.spec.selector
        name = 'unknown-unknown'
        if selector is not None:
            self.name = name = selector['app']

        if service.status.load_balancer is not None and \
           service.status.load_balancer.ingress is not None:
            self.ip = service.status.load_balancer.ingress[0].ip
        else:
            self.ip = ''

        self.ports = service.spec.ports

        # Pod names should follow client-network-number scheme
        bits = name.split('-')
        self.client  = bits[0]
        self.network = bits[1]

        if len(bits) > 2:
            self.number = int(bits[2])
        else:
            self.number = -1

    def to_dict(self):
        return {
            'name': self.name,
            'blockchain': self.client,
            'network': self.network,
            'number': self.number,
            'ip': self.ip,
            'ports': [p.port for p in self.ports],
        }

    # def exec(self, js):
    #     command = [
    #         '/bin/geth',
    #         '--datadir=/data',
    #         'attach',
    #         '--exec',
    #         js
    #     ]
    #     return self.api.exec(self.name, command).lower()

    # def syncing(self):
    #     if self.exec('eth.syncing').lower() == 'false':
    #         return False
    #     else:
    #         return True

    # def block_number(self):
    #     try:
    #         return int(self.exec('eth.blockNumber'))
    #     except:
    #         return -1

    # def __repr__(self):
    #     return self.name

class Deployment(object):
    def __init__(self, deployment, api=None):
        self.api = api
        self.deployment = deployment

        name = deployment.metadata.name
        self.name = name

        # Pod names should follow client-network-number scheme
        bits = name.split('-')
        self.client  = bits[0]
        self.network = bits[1]

        # Pod may not follow correct naming scheme
        if len(bits) > 2:
            self.number = int(bits[2])
        else:
            self.number = -1

    def to_dict(self):
        return {
            'name': self.name,
            'blockchain': self.client,
            'network': self.network,
            'number': self.number,
        }

class Kubernetes(object):
    def __init__(self, config_path='config/ethereum-testnet/cluster.yaml'):
        self.config_path = config_path

        config.load_kube_config(config_path)
        self.api = client.CoreV1Api()
        self.appsApi = client.AppsV1Api()

    def exec(self, pod_name, command, namespace=NAMESPACE, stdin=False,
             stderr=True, stdout=True, tty=False):
        return stream(self.api.connect_get_namespaced_pod_exec, pod_name,
                      namespace, command=command, stdin=stdin, stderr=stderr,
                      stdout=stdout, tty=tty)

    def create_volume(self, config):
        return self.api.create_namespaced_persistent_volume_claim(NAMESPACE, body=config)

    def delete_volume(self, name):
        return self.api.delete_namespaced_persistent_volume_claim(name, NAMESPACE, body=client.V1DeleteOptions())

    def create_service(self, config):
        return self.api.create_namespaced_service(NAMESPACE, body=config)

    def delete_service(self, name):
        return self.api.delete_namespaced_service(name, NAMESPACE, body=client.V1DeleteOptions())

    def list_services(self, network=None):
        services = [Service(p, self) for p in
                self.api.list_namespaced_service(NAMESPACE).items]

        if not network:
            return services

        return [p for p in services if p.network == network]

    def get_service(self, name):
        return Service(self.api.read_namespaced_service(name, NAMESPACE), self)

    def create_pod(self, config):
        return self.api.create_namespaced_pod(NAMESPACE, body=config)

    def delete_pod(self, name):
        return self.api.delete_namespaced_pod(name, NAMESPACE, body=client.V1DeleteOptions())

    def list_pods(self, label_selector=None, network=None):
        if label_selector is None:
            pods = [Pod(p, self) for p in
                    self.api.list_namespaced_pod(NAMESPACE).items]
        else:
            pods = [Pod(p, self) for p in
                    self.api.list_namespaced_pod(NAMESPACE, label_selector=label_selector).items]

        if not network:
            return pods

        return [p for p in pods if p.network == network]

    def get_pod(self, name):
        for pod in self.list_pods():
            if pod.name == name:
                return pod
        raise Exception('Pod not found: "%s"' % name)

    def create_deployment(self, config):
        return self.appsApi.create_namespaced_deployment(NAMESPACE, body=config)

    def delete_deployment(self, name):
        return self.appsApi.delete_namespaced_deployment(name, NAMESPACE, body=client.V1DeleteOptions())

    def list_deployments(self, network=None):
        deployments = [Deployment(p, self) for p in self.appsApi.list_namespaced_deployment(NAMESPACE).items]

        if not network:
            return deployments

        return deployments

        return [p for p in deployments if p.network == network]

    def get_deployment(self, name):
        return Deployment(self.appsApi.read_namespaced_deployment(name, NAMESPACE), self)

    def get_last_pod(self, network=None):
        return max(self.list_pods(network), key=lambda x: x.number)

    def get_synced_pod(self, network=None):
        pods = self.list_pods(network)
        for pod in sorted(pods, key=lambda x: x.number):
            if not pod.syncing():
                return pod

    def create_ingress(self, config):
        self.api.create_namespaced_ingress(NAMESPACE, config)
