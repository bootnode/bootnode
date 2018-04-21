from .gcloud import Gcloud
from .kubernetes import Kubernetes


class Bootnode(object):
    def __init__(self):
        self.gcloud = Gcloud()
        self.kube   = Kubernetes()

    # Disks
    def list_disks(self, network=None):
        for disk in self.gcloud.list_disks(network=network):
            print('{0}\t{1}\t{2}'.format(disk.name, disk.link, disk.status))

    def get_disk(self, name):
        disk = self.gcloud.get_disk(name)
        print('{0}\t{1}\t{2}'.format(disk.name, disk.link, disk.status))

    def get_last_disk(self, network=None):
        disk = self.gcloud.last_disk(network=network)
        print('{0}\t{1}\t{2}'.format(disk.name, disk.link, disk.status))

    # Snapshots
    def list_snapshots(self, network=None):
        for snap in self.gcloud.list_snapshots(network=network):
            print('{0}\t{1}\t{2}'.format(snap.name, snap.link, snap.status))

    def get_last_snapshot(self, network=None):
        snap = self.gcloud.get_last_snapshot(network=network)
        print('{0}\t{1}\t{2}'.format(snap.name, snap.link, snap.status))

    # def snapshot_disk(self, name):
    #     disk = self.gcloud.get_disk(name)
    #     pod = self.kube.get_pod(name)
    #     if pod.syncing():
    #         raise Exception('Pod not synced: ""' % pod.name)
    #     name = "{0}-{1}-{2}".format(pod.client, pod.network, pod.block_number())
    #     print(self.gcloud.snapshot_disk(pod.disk, name, pod_name=pod.name))

    def snapshot_pod(self, name):
        pod = self.kube.get_pod(name)
        if pod.syncing():
            raise Exception('Pod not synced: ""' % pod.name)
        name = "{0}-{1}-{2}".format(pod.client, pod.network, pod.block_number())
        print(self.gcloud.snapshot_disk(pod.disk, name, pod_name=pod.name))

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
    def list_pods(self, network=None):
        for pod in self.kube.list_pods(network=network):
            print('{0}\t{1}\t{2}'.format(pod.name, pod.phase, pod.ip))

    def get_pod(self, name):
        pod = self.kube.get_pod(name)
        print('{0}\t{1}\t{2}'.format(pod.name, pod.phase, pod.ip))

    def get_last_pod(self, network=None):
        pod = self.kube.get_last_pod(network=network)
        print('{0}\t{1}\t{2}'.format(pod.name, pod.phase, pod.ip))

    def get_synced_pod(self, network=None):
        pod = self.kube.get_synced_pod(network=network)
        print('{0}\t{1}\t{2}\t{3}'.format(pod.name, pod.phase,
                                          pod.block_number(), pod.ip))

    def get_block_number(self, name):
        pod = self.kube.get_pod(name)
        print(pod.block_number())

    # Scaling
    def scale_up(args):
        pass

    def scale_down(args):
        pass
