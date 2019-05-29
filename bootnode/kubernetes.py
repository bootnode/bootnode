from kubernetes_asyncio import client, config
from kubernetes.stream import stream
import asyncio

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
        self.ip     = pod.status.host_ip

        try:
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
        except Exception as e:
            print('warning: probably not one of ours: ' + str(e))
            self.client = ''
            self.network = ''
            self.number = -1

    def to_dict(self):
        return {
            'name': self.name,
            'blockchain': self.client,
            'network': self.network,
            'number': self.number,
            'status': self.status,
            'ip': self.ip,
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

        try:
            # Pod names should follow client-network-number scheme
            bits = name.split('-')
            self.client  = bits[0]
            self.network = bits[1]

            if len(bits) > 2:
                self.number = int(bits[2])
            else:
                self.number = -1
        except Exception as e:
            print('warning: probably not one of ours: ' + str(e))
            self.client = ''
            self.network = ''
            self.number = -1

    def to_dict(self):
        ports = []
        for port in self.ports:
            p =  {'port': port.port, 'name': port.name}
            if hasattr(port, 'node_port'):
                p['nodePort'] = port.node_port
            ports.append(p)
        return {
            'name': self.name,
            'blockchain': self.client,
            'network': self.network,
            'number': self.number,
            'ip': self.ip,
            'ports': ports,
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

        try:
            # Pod names should follow client-network-number scheme
            bits = name.split('-')
            self.client  = bits[0]
            self.network = bits[1]

            # Pod may not follow correct naming scheme
            if len(bits) > 2:
                self.number = int(bits[2])
            else:
                self.number = -1
        except Exception as e:
            print('warning: probably not one of ours: ' + str(e))
            self.client = ''
            self.network = ''
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
        self.api = None

    async def init_apis(self):
        if self.api is None:
            api_client = await config.new_client_from_config(self.config_path)

            self.api = client.CoreV1Api(api_client)
            self.apps_api = client.AppsV1Api(api_client)

    async def exec(self, pod_name, command, namespace=NAMESPACE, stdin=False,
             stderr=True, stdout=True, tty=False):
        await self.init_apis()
        return await stream(self.api.connect_get_namespaced_pod_exec, pod_name,
                      namespace, command=command, stdin=stdin, stderr=stderr,
                      stdout=stdout, tty=tty)

    async def create_volume(self, config):
        await self.init_apis()
        return await self.api.create_namespaced_persistent_volume_claim(NAMESPACE, body=config)

    async def delete_volume(self, name):
        await self.init_apis()
        return await self.api.delete_namespaced_persistent_volume_claim(name,
                                                                  NAMESPACE,
                                                                  body=client.V1DeleteOptions(),
                                                                  grace_period_seconds=60,
                                                                  propagation_policy='Background')

    async def create_service(self, config):
        await self.init_apis()
        return Service(await self.api.create_namespaced_service(NAMESPACE, body=config), self)

    async def delete_service(self, name):
        await self.init_apis()
        return await self.api.delete_namespaced_service(name, NAMESPACE, body=client.V1DeleteOptions())

    async def list_services(self, network=None):
        await self.init_apis()
        services = [Service(p, self) for p in
                (await self.api.list_namespaced_service(NAMESPACE)).items]

        if not network:
            return services

        return [p for p in services if p.network == network]

    async def get_service(self, name):
        await self.init_apis()
        return Service(await self.api.read_namespaced_service(name, NAMESPACE), self)

    async def create_pod(self, config):
        await self.init_apis()
        return await self.api.create_namespaced_pod(NAMESPACE, body=config)

    async def delete_pod(self, name):
        await self.init_apis()
        return await self.api.delete_namespaced_pod(name, NAMESPACE, body=client.V1DeleteOptions())

    async def list_pods(self, label_selector=None, network=None):
        await self.init_apis()
        if label_selector is None:
            pods = [Pod(p, self) for p in
                    (await self.api.list_namespaced_pod(NAMESPACE)).items]
        else:
            pods = [Pod(p, self) for p in
                    (await self.api.list_namespaced_pod(NAMESPACE, label_selector=label_selector)).items]

        if not network:
            return pods

        return [p for p in pods if p.network == network]

    async def get_pod(self, name):
        await self.init_apis()
        for pod in await self.list_pods():
            if pod.name == name:
                return pod
        raise Exception('Pod not found: "%s"' % name)

    async def create_deployment(self, config):
        await self.init_apis()
        return await self.apps_api.create_namespaced_deployment(NAMESPACE, body=config)

    async def delete_deployment(self, name):
        await self.init_apis()
        return await self.apps_api.delete_namespaced_deployment(name, NAMESPACE, body=client.V1DeleteOptions())

    async def list_deployments(self, network=None):
        await self.init_apis()
        deployments = [Deployment(p, self) for p in (await self.apps_api.list_namespaced_deployment(NAMESPACE)).items]

        if not network:
            return deployments

        return [p for p in deployments if p.network == network]

    async def get_deployment(self, name):
        await self.init_apis()
        return Deployment(await self.apps_api.read_namespaced_deployment(name, NAMESPACE), self)

    async def get_last_pod(self, network=None):
        await self.init_apis()
        return max(await self.list_pods(network), key=lambda x: x.number)

    async def get_synced_pod(self, network=None):
        await self.init_apis()
        pods = await self.list_pods(network)
        for pod in sorted(pods, key=lambda x: x.number):
            if not pod.syncing():
                return pod

    async def create_ingress(self, config):
        await self.init_apis()
        await self.api.create_namespaced_ingress(NAMESPACE, config)
