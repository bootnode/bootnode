from .gcloud import Gcloud
from .kubernetes import Kubernetes
from .template import Ethereum, Service, Ingress, Backend, Port
from .table import table
import secrets

blockchains = [Ethereum]

class Bootnode(object):
    def __init__(self, chain, network):
        self.gcloud = Gcloud()

        self.chain = self.find_blockchain(chain)
        self.network, id = self.chain.normalize_network(network)

        if c is None:
            raise Exception('Blockchain "" does not exist' % chain)

        self.cluster = '{0}-{1}'.format(c.get_name(), network)
        self.kube    = Kubernetes('config/{0}/cluster.yaml'.format(self.cluster))

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

    def snapshot_disk(self, name):
        disk = self.gcloud.get_disk(name)
        pod  = self.kube.get_pod(disk.pod)
        print(self.gcloud.snapshot_pod(pod))

    def snapshot_pod(self, name):
        pod = self.kube.get_pod(name)
        print(self.gcloud.snapshot_pod(pod))

    def update_snapshot(self):
        if not network:
            raise Exception('Network must be specified')

        # Re-use last snapshot so subsequent snapshots are just deltas,
        # otherwise find any sync'd pod and start there
        snap = self.gcloud.get_last_snapshot(network=self.network)
        if snap:
            pod = self.kube.get_pod(snap.pod)
        else:
            pod = self.kube.get_synced_pod(self.network)

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

    def create_pod(self, name=None):
        """
        Create a new pod for a specific chain on a specific network of that
        chain.  Ex. geth-mainnet
        """

        if not name:
            name = '{0}-{1}-{2}'.format(self.chain.get_name(), self.network, secrets.randbelow(1000000000000))

        print('Creating pod {0}'.format(name))
        config = self.chain(name, self.network, self.cluster)

        disk_name = config.spec.volumes[0].gcePersistentDisk.pdName
        snap = self.gcloud.get_last_snapshot(self.network)
        if snap:
            snap.create_disk(disk_name)
        else:
            self.gcloud.create_disk(disk_name)

        # pool = self.kube.get_pool(network)
        # if not pool:
        #     self.kube.create_pool(network)
        print(self.kube.create_pod(config))

    def create_load_balancer(self, name=None):
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
                ports=[Port(port=80, protocol='TCP', targetPort=9376)])
            ),
        )

        ingress = Ingress(
            metadata=Metadata(
                name=ingress_name,
            ),
            spec=Spec(
                backend=Backend(
                    serviceName=service_name,
                    servicePort=80,
                )
            )
        )

        self.kube.create_service(service)
        self.kube.create_ingress(ingress)

    def delete_pod(self, name):
        self.kube.delete_pod(name)

    def list_pods(self, network=None):
        table(self.kube.list_pods(network=network), 'name', 'phase', 'block_number', 'ip')

    def get_pod(self, name):
        table(self.kube.get_pod(name), 'name', 'phase', 'ip')

    def get_last_pod(self):
        table(self.kube.get_last_pod(network=self.network), 'name', 'phase', 'block_number', 'ip')

    def get_synced_pod(self):
        table(self.kube.get_synced_pod(network=self.network), 'name', 'phase', 'block_number', 'ip')

    def get_block_number(self, name):
        pod = self.kube.get_pod(name)
        print(pod.block_number())

    # Cluster
    def create_cluster(self):
        """
        Create a new cluster for a specific chain on a specific network of that
        chain.  Ex. geth-mainnet
        """

        print(self.gcloud.create_cluster(self.cluster))

    def delete_cluster(self):
        """
        Delete a cluster for a specific chain on a specific network of that
        chain.  Ex. geth-mainnet
        """

        chain_name = self.chain.get_name()

        print(self.gcloud.delete_cluster(self.network))

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
