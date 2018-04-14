#!/usr/bin/env python3

from kubernetes import client, config
import argparse
import subprocess
import sys

REGION = 'us-central1'
ZONE   = 'us-central1-a'


class Pod(object):
    def __init__(self, pod):
        name = pod.metadata.name
        self.name = name

        bits = name.split('-')
        self.client  = bits[0]
        self.network = bits[1]
        self.number  = int(bits[2])

    def __repr__(self):
        return self.name


class Snapshot(object):
    def __init__(self, line):
        name = line.split(' ')[0]
        self.name = name

        bits = name.split('-')
        self.client  = bits[0]
        self.network = bits[1]
        self.block   = int(bits[2])

    def __repr__(self):
        return self.name


def gcloud(args):
    res = subprocess.check_output('gcloud ' + args, shell=True)
    return [s.decode() for s in res.strip().split(b'\n')[1:]]


def kubectl():
    config.load_kube_config('config/cluster.yaml')

    return client.CoreV1Api()


def create_disk_from_snapshot(disk, snapshot, zone=ZONE):
    return gcloud('compute disks create {0} --source-snapshot={1} --type=pd-ssd --zone={2}'.format(disk, snapshot, zone))


def list_snapshots(network=None):
    snaps = [Snapshot(s) for s in gcloud('compute snapshots list')]

    if not network:
        return snaps

    return [s for s in snaps if s.network == network]


def last_snapshot(network):
    return max(list_snapshots(network), key=lambda x: x.block)


def list_pods(network=None):
    pods = [Pod(p) for p in kubectl().list_namespaced_pod('default').items]

    if not network:
        return pods

    return [p for p in pods if p.network == network]


def last_pod(network):
    return max(list_pods(network), key=lambda x: x.number)


# Snapshot commands
def cmd_list_snapshots(args):
    print(list_snapshots(args.network))


def cmd_last_snapshot(args):
    print(last_snapshot(args.network))


def cmd_update_snapshot(args):
    pass


# Pod commands
def cmd_list_pods(args):
    for pod in list_pods(args.network):
        print('%s\t%s\t%s' % (pod.metadata.name,
                              pod.status.phase,
                              pod.status.pod_ip))


def cmd_last_pod(args):
    print(last_pod(args.network))


# Scaling commands
def cmd_scale_up(args):
    pass


def cmd_scale_down(args):
    pass


if __name__ == '__main__':
    parser     = argparse.ArgumentParser(description='Cluster management commands')
    parser.add_argument('--network', help='Ethereum network')
    subparsers = parser.add_subparsers()

    # Snapshots
    list_parser = subparsers.add_parser('snapshots', help='List snapshots')
    list_parser.set_defaults(command=cmd_list_snapshots)

    last_parser = subparsers.add_parser('snapshot', help='Last snapshot')
    last_parser.set_defaults(command=cmd_last_snapshot)

    update_parser = subparsers.add_parser('snapshot-update', help='Update snapshot')
    update_parser.set_defaults(command=cmd_update_snapshot)

    # Pods
    list_parser = subparsers.add_parser('pods', help='List pods')
    list_parser.set_defaults(command=cmd_list_pods)

    last_parser = subparsers.add_parser('pod', help='Last pod')
    last_parser.set_defaults(command=cmd_last_pod)

    # Scale up
    scale_up_parser = subparsers.add_parser('scale-up', help='Scale up Ethereum nodes')
    scale_up_parser.set_defaults(command=cmd_scale_up)

    # Scale down
    scale_down_parser = subparsers.add_parser('scale-down', help='Scale down Ethereum nodes')
    scale_down_parser.set_defaults(command=cmd_scale_down)

    args = parser.parse_args()

    try:
        cmd = args.command
    except AttributeError:
        parser.print_help()
        sys.exit(1)

    cmd(args)
