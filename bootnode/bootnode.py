from .gcloud import Gcloud
from .kubernetes import Kubernetes
from .template import Ethereum
from .table import table

blockchains = [Ethereum]

class Bootnode(object):
    def __init__(self):
        self.gcloud = Gcloud()
        self.kube   = Kubernetes()

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

    def update_snapshot(self, network=None):
        if not network:
            raise Exception('Network must be specified')

        # Re-use last snapshot so subsequent snapshots are just deltas,
        # otherwise find any sync'd pod and start there
        snap = self.gcloud.get_last_snapshot(network=network)
        if snap:
            pod = self.kube.get_pod(snap.pod)
        else:
            pod = self.kube.get_synced_pod(network)

        if not pod or pod.syncing():
            raise Exception('Pod not synced: ""' % pod.name)

        name = "{0}-{1}-{2}".format(pod.client, pod.network, pod.block_number())
        print(self.gcloud.snapshot_disk(pod.disk, name, pod_name=pod.name))

    # Pods
    def find_blockchain(self, chain):
        for blockchain in blockchains:
            if blockchain.is_blockchain(chain):
                return blockchain

    def create_pod(self, chain, network, name):
        c = self.find_blockchain(chain)

        if c is None:
            raise Exception('Blockchain "" does not exist' % chain)

        network, id = c.normalize_network(network)
        config = c(name, network)

        disk_name = config.spec.volumes[0].gcePersistentDisk.pdName
        snap = self.gcloud.get_last_snapshot(network)
        if snap:
            snap.create_disk(disk_name)
        else:
            self.gcloud.create_disk(disk_name)

        # pool = self.kube.get_pool(network)
        # if not pool:
        #     self.kube.create_pool(network)
        self.kube.create_pod(config)

    def delete_pod(self, network, name):
        self.kube.delete_pod(name)

    def list_pods(self, network=None):
        table(self.kube.list_pods(network=network), 'name', 'phase', 'block_number', 'ip')

    def get_pod(self, name):
        table(self.kube.get_pod(name), 'name', 'phase', 'ip')

    def get_last_pod(self, network=None):
        table(self.kube.get_last_pod(network=network), 'name', 'phase', 'block_number', 'ip')

    def get_synced_pod(self, network=None):
        table(self.kube.get_synced_pod(network=network), 'name', 'phase', 'block_number', 'ip')

    def get_block_number(self, name):
        pod = self.kube.get_pod(name)
        print(pod.block_number())

    # Cluster
    def create_cluster(self, chain, network):
        print(self.gcloud.create_cluster(chain, network))

    def list_clusters(self):
        table(self.gcloud.list_clusters(), 'name', 'status', 'ip',
              'node_count', 'version')

    # Scaling
    def scale_up(args):
        pass

    def scale_down(args):
        pass
