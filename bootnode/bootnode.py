from .gcloud import Gcloud
from .kubernetes import Kubernetes
from .template import Ethereum
from .table import table


class Bootnode(object):
    def __init__(self):
        self.gcloud = Gcloud()
        self.kube   = Kubernetes()

    # Cluster
    def list_clusters(self):
        table(self.gcloud.list_clusters(), 'name', 'status', 'link')

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
    def create_pod(self, network, name):
        network = Ethereum.normalize_network(network)
        # snap = self.gcloud.get_last_snapshot(network)
        # if snap:
        #     snap.create_disk(name)
        # else:
        #     self.gcloud.create_disk(name)

        # config = Ethereum(name, network)
        # pool = self.kube.get_pool(network)
        # if not pool:
        #     self.kube.create_pool(network)
        # self.gcloud.create_pod(disk, name, config)

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

    # Scaling
    def scale_up(args):
        pass

    def scale_down(args):
        pass
