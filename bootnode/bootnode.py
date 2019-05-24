from .gcloud import Gcloud
from .kubernetes import Kubernetes
from .template import Ethereum, Casper, Service, Ingress, Backend, ServicePort
from .table import table
import secrets
import asyncio

blockchains = [Ethereum, Casper]
gcloud = Gcloud()

class Bootnode(object):
    def __init__(self, chain, network, provider, zone):
        self.gcloud = gcloud

        self.chain = self.find_blockchain(chain)
        self.network, id = self.chain.normalize_network(network)
        self.zone = zone
        self.provider = provider

        if self.chain is None:
            raise Exception('Blockchain "" does not exist' % chain)

        if provider == 'private-cloud':
            self.cluster = '{0}-{1}-encloudify-{2}'.format(self.chain.get_name(),
                                            network,
                                            zone)
        else:
            self.cluster = '{0}-{1}-{2}'.format(self.chain.get_name(),
                                            network,
                                            zone)

        try:
            self.kube    = Kubernetes('config/{0}/cluster.yaml'.format(self.cluster))
        except Exception as e:
            print('{0} is a new cluster: '.format(self.cluster) + str(e))

    # Disks
    def list_disks(self, network=None):
        table(self.gcloud.list_disks(network=network), 'name', 'status', 'link')

    def create_disk(self, snapshot, name):
        snap = self.gcloud.get_snapshot(snapshot)
        print(snap.create_disk(name))

    def get_disk(self, name):
        table(self.gcloud.get_disk(name), ['name', 'status', 'link'])

    def get_last_disk(self, network=None):
        table(self.gcloud.last_disk(network=network), 'name', 'status', 'link')

    # Snapshots
    def list_snapshots(self, network=None):
        table(self.gcloud.list_snapshots(network=network), 'name', 'status', 'link')

    def get_snapshot(self, name):
        table(self.gcloud.get_snapshot(name), 'name', 'status', 'link')

    def get_last_snapshot(self, network=None):
        table(self.gcloud.get_last_snapshot(network=network), 'name', 'status', 'link')

    async def snapshot_disk(self, name):
        disk = self.gcloud.get_disk(name)
        pod  = await self.kube.get_pod(disk.pod)
        print(self.gcloud.snapshot_pod(pod))

    async def snapshot_pod(self, name):
        pod = await self.kube.get_pod(name)
        print(self.gcloud.snapshot_pod(pod))

    async def update_snapshot(self):
        if not network:
            raise Exception('Network must be specified')

        # Re-use last snapshot so subsequent snapshots are just deltas,
        # otherwise find any sync'd pod and start there
        snap = self.gcloud.get_last_snapshot(network=self.network)
        if snap:
            pod = await self.kube.get_pod(snap.pod)
        else:
            pod = await self.kube.get_synced_pod(self.network)

        if not pod or pod.syncing():
            raise Exception('Pod not synced: ""' % pod.name)

        name = "{0}-{1}-{2}".format(pod.client, pod.network, pod.block_number())
        print(self.gcloud.snapshot_disk(pod.disk, name, pod_name=pod.name))

    def find_blockchain(self, chain):
        """
        Find constructor to use for given blockchain node, i.e. Ethereum()
        which generates a config for `geth`.
        """
        for blockchain in blockchains:
            if blockchain.is_blockchain(chain):
                return blockchain

    async def create_load_balancer(self, name=None):
        """
        Create a new load balancer for a given set of pods.
        """

        service_name = self.cluster + '-svc'
        ingress_name = self.cluster + '-ing'

        service = Service(
            metadata=Metadata(
                name=service_name,
                annotations={"cloud.google.com/neg": '{"ingress": true}'},
            ),
            spec=Spec(
                selector={"run": self.cluster},
                ports=[ServicePort(port=80, protocol='TCP', targetServicePort=9376)]
            ),
        )

        ingress = Ingress(
            metadata=Metadata(
                name=ingress_name,
            ),
            spec=Spec(
                backend=Backend(
                    serviceName=service_name,
                    serviceServicePort=80,
                )
            )
        )

        creates = [
            self.kube.create_service(service),
            self.kube.create_ingress(ingress),
        ]

        await asyncio.gather(*creates)


    async def create_pod(self, name=None):
        """
        Create a new pod for a specific chain on a specific network of that
        chain.  Ex. geth-mainnet
        """

        if not name:
            name = '{0}-{1}-{2}'.format(self.chain.get_name(), self.network, secrets.randbelow(1000000000000))

        print('Creating pod {0}'.format(name))
        config = self.chain(name, self.network, self.cluster).spec.template

        disk_name = config.spec.volumes[0].gcePersistentDisk.pdName
        snap = self.gcloud.get_last_snapshot(self.network)
        if snap:
            snap.create_disk(disk_name)
        else:
            self.gcloud.create_disk(disk_name)

        # pool = self.kube.get_pool(network)
        # if not pool:
        #     self.kube.create_pool(network)
        print(await self.kube.create_pod(config))

    async def delete_pod(self, name):
        await self.kube.delete_pod(name)

    async def list_pods(self, label_selector=None, network=None):
        if network is None:
            network = self.network

        pods = await self.kube.list_pods(label_selector=label_selector, network=self.network)
        #table(pods, 'name', 'status')

        return pods

    async def get_pod(self, name):
        table(await self.kube.get_pod(name), 'name', 'phase', 'ip')

    async def get_last_pod(self):
        table(await self.kube.get_last_pod(network=self.network), 'name', 'phase', 'block_number', 'ip')

    async def get_synced_pod(self):
        table(await self.kube.get_synced_pod(network=self.network), 'name', 'phase', 'block_number', 'ip')

    async def create_deployment(self, name=None):
        """
        Create a new deployment for a specific chain on a specific network of that
        chain.  Ex. geth-mainnet
        """

        if not name:
            name = '{0}-{1}-{2}'.format(self.chain.get_name(), self.network, secrets.randbelow(1000000000000))

        config = self.chain(name, self.network, self.cluster)

        # disk_name = config.spec.template.spec.volumes[0].gcePersistentDisk.pdName
        # snap = self.gcloud.get_last_snapshot(self.network)
        # if snap:
        #     snap.create_disk(disk_name)
        # else:
        #     self.gcloud.create_disk(disk_name)

        # pool = self.kube.get_pool(network)
        # if not pool:
        #     self.kube.create_pool(network)
        print('Creating service for {0}'.format(name))

        service = await self.kube.create_service(config.get_service())

        if 'encloudify' not in self.cluster:
            service = await self.kube.get_service('service-'+name)
            while service.ip == '':
                print('NO IP!', service.ip)
                service = await self.kube.get_service('service-'+name)
                await asyncio.sleep(5)
            print('IP!', service.ip)

            config.set_env('EXTERNAL_IP', service.ip)

        volume = config.get_volume_claim()

        if volume is not None:
            print('Creating volume for {0}'.format(name))
            pvc = await self.kube.create_volume(volume)

        print('Creating deployment for {0}'.format(name))
        deployment = await self.kube.create_deployment(config)

        return {
            'service': service,
            'volume': volume,
            'deployment': deployment,
        }

    async def delete_deployment(self, name):
        try:
            await self.kube.delete_service('service-' + name)
        except Exception as e:
            print('warning: could not delete service ' + 'service-' + name + ': ' +
                  str(e))
        try:
            await self.kube.delete_volume_claim(name+'-pd')
        except Exception as e:
            print('warning: could not delete volume claim ' + name + '-pd : ' +
                  str(e))
        await self.kube.delete_deployment(name)

    async def list_deployments(self, network=None):
        if network is None:
            network = self.network

        deployments = await self.kube.list_deployments(network=network)
        #table(deployments, 'name')

        return deployments

    async def get_deployment(self, name):
        deployment = await self.kube.get_deployment(name)
        table([deployment], 'name')

        return deployment

    async def list_services(self, network=None):
        if network is None:
            network = self.network

        services = await self.kube.list_services(network=network)
        #table(services, 'name', 'ip', 'ports')

        return services

    async def get_service(self, name):
        service = await self.kube.get_service('service-' + name)
        table([service], 'name', 'ip', 'ports')

        return service

    async def get_block_number(self, name):
        pod = await self.kube.get_pod(name)
        print(pod.block_number())

    # Cluster
    def create_cluster(self):
        """
        Create a new cluster for a specific chain on a specific network of that
        chain.  Ex. geth-mainnet
        """

        print(self.gcloud.create_cluster(self.chain.get_name(), self.network,
                                         self.zone))

    def delete_cluster(self):
        """
        Delete a cluster for a specific chain on a specific network of that
        chain.  Ex. geth-mainnet
        """

        chain_name = self.chain.get_name()

        print(self.gcloud.delete_cluster(self.cluster))

    def list_clusters(self):
        table(self.gcloud.list_clusters(), 'name', 'status', 'ip',
              'node_count', 'version')

    def get_cluster(self):
        print(self.gcloud.get_cluster(self.cluster))

    # Scaling
    def scale_up(args):
        pass

    def scale_down(args):
        pass
