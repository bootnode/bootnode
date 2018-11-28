#!/usr/bin/env python3
import sys
import argparse
from bootnode import Bootnode, complete


def run_command(cmd, args):
    bootnode = Bootnode()

    # Get argument names
    keys = [k for k in dir(args) if not k.startswith('_') and not k == 'command']

    # Create kwargs from args specified
    kwargs = dict(map(lambda k: (k, getattr(args, k)), keys))

    # Clear out any default args that are unspecified
    kwargs = {k: v for k, v in kwargs.items() if v is not None}

    # Call relevant method on Bootnode
    getattr(bootnode, cmd)(**kwargs)


def parser():
    parser = argparse.ArgumentParser(description='Cluster management commands')
    parser.add_argument('--network', help='Ethereum network')
    subparsers = parser.add_subparsers()

    # Disks
    create_disk = subparsers.add_parser('create-disk', help='Create disk')
    create_disk.add_argument('snapshot', help='Name of snapshot to use as source')
    create_disk.add_argument('name', help='Name of disk')
    create_disk.set_defaults(command='create_disk')

    get_disk = subparsers.add_parser('disk', help='Get disk')
    get_disk.add_argument('name', help='Name of disk')
    get_disk.set_defaults(command='get_disk')

    list_disks = subparsers.add_parser('disks', help='List disks')
    list_disks.set_defaults(command='list_disks')

    get_last_disk = subparsers.add_parser('last-disk', help='Get last disk')
    get_last_disk.set_defaults(command='get_last_disk')

    # Snapshots
    get_snapshot = subparsers.add_parser('snapshot', help='Get snapshot')
    get_snapshot.add_argument('name', help='Name of snapshot')
    get_snapshot.set_defaults(command='get_snapshot')

    list_snapshots = subparsers.add_parser('snapshots', help='List snapshots')
    list_snapshots.set_defaults(command='list_snapshots')

    get_last_snapshot = subparsers.add_parser('last-snapshot', help='Get last snapshot')
    get_last_snapshot.set_defaults(command='get_last_snapshot')

    snapshot_pod = subparsers.add_parser('snapshot-pod', help='Snapshot pod')
    snapshot_pod.add_argument('name', help='Pod to snapshot')
    snapshot_pod.set_defaults(command='snapshot_pod')

    snapshot_disk = subparsers.add_parser('snapshot-disk', help='Snapshot disk')
    snapshot_disk.add_argument('name', help='Disk to snapshot')
    snapshot_disk.set_defaults(command='snapshot_disk')

    update_snapshot = subparsers.add_parser('update-snapshot', help='Update snapshot for a given network')
    update_snapshot.add_argument('network', help='Network to snapshot')
    update_snapshot.set_defaults(command='update_snapshot')

    # Pods
    create_pod = subparsers.add_parser('create-pod', help='Create pod')
    create_pod.add_argument('chain', help='Name of blockchain to create')
    create_pod.add_argument('network', help='Name of network to use')
    create_pod.add_argument('name', help='Name of pod')
    create_pod.set_defaults(command='create_pod')

    delete_pod = subparsers.add_parser('delete-pod', help='Delete pod')
    create_pod.add_argument('chain', help='Name of blockchain to delete')
    delete_pod.add_argument('network', help='Name of network to use')
    delete_pod.add_argument('name', help='Name of pod')
    delete_pod.set_defaults(command='delete_pod')

    list_pods = subparsers.add_parser('pods', help='List pods')
    list_pods.set_defaults(command='list_pods')

    get_pod = subparsers.add_parser('pod', help='Get pod')
    get_pod.add_argument('name', help='Name of pod')
    get_pod.set_defaults(command='get_pod')

    get_last_pod = subparsers.add_parser('last-pod', help='Last pod')
    get_last_pod.set_defaults(command='get_last_pod')

    last_parser = subparsers.add_parser('synced-pod', help='Get any synced pod')
    last_parser.set_defaults(command='get_synced_pod')

    get_block_number = subparsers.add_parser('block-number', help='Get block number for pod')
    get_block_number.add_argument('name', help='Name of pod')
    get_block_number.set_defaults(command='get_block_number')

    # Clusters
    list_clusters = subparsers.add_parser('clusters', help='List clusters')
    list_clusters.set_defaults(command='list_clusters')

    # Scale up
    scale_up = subparsers.add_parser('scale-up', help='Scale up blockchain nodes')
    scale_up.add_argument('network', help='Network to scale')
    scale_up.set_defaults(command='scale_up')

    # Scale down
    scale_down = subparsers.add_parser('scale-down', help='Scale down blockchain nodes')
    scale_down.add_argument('network', help='Network to scale')
    scale_down.set_defaults(command='scale_down')

    return parser


if __name__ == '__main__':
    parser = parser()
    complete(sys.argv, parser)
    args = parser.parse_args()

    try:
        cmd = args.command
    except AttributeError:
        parser.print_help()
        sys.exit(1)

    run_command(cmd, args)
