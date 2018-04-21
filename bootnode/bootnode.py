from .gcloud import Gcloud
from .kubernetes import Kubernetes


class Bootnode(object):
    def __init__(self):
        self.gcloud = Gcloud()
        self.kube   = Kubernetes()

    def list_disks(self, network=None):
        for disk in self.gcloud.list_disks(network=network):
            print('{0}\t{1}\t{2}'.format(disk.name, disk.link, disk.status))

    def last_disk(self, network=None):
        disk = self.gcloud.last_disk(network=network)
        print('{0}\t{1}\t{2}'.format(disk.name, disk.link, disk.status))

    def list_snapshots(self, network=None):
        for snap in self.gcloud.list_snapshots(network=network):
            print('{0}\t{1}\t{2}'.format(snap.name, snap.link, snap.status))

    def last_snapshot(self, network=None):
        snap = self.gcloud.last_snapshot(network=network)
        print('{0}\t{1}\t{2}'.format(snap.name, snap.link, snap.status))

    def update_snapshot(self, args):
        pass

    def list_pods(self, network=None):
        for pod in self.gcloud.list_pods(network=network):
            print('{0}\t{1}\t{2}'.format(pod.name, pod.phase, pod.ip))

    def last_pod(self, network=None):
        pod = self.gcloud.last_pod(network=network)
        print('{0}\t{1}\t{2}'.format(pod.name, pod.phase, pod.ip))

    def scale_up(args):
        pass

    def scale_down(args):
        pass
