#!/usr/bin/env python3
import sys
import argparse
from bootnode import Bootnode


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


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Cluster management commands')
    parser.add_argument('--network', help='Ethereum network')
    subparsers = parser.add_subparsers()

    # Disks
    list_parser = subparsers.add_parser('disks', help='List disks')
    list_parser.set_defaults(command='list_disks')

    last_parser = subparsers.add_parser('disk', help='Get last disk')
    last_parser.set_defaults(command='get_last_disk')

    # Snapshots
    list_parser = subparsers.add_parser('snapshots', help='List snapshots')
    list_parser.set_defaults(command='list_snapshots')

    last_parser = subparsers.add_parser('snapshot', help='Get last snapshot')
    last_parser.set_defaults(command='get_last_snapshot')

    snapshot_pod_parser = subparsers.add_parser('snapshot-pod', help='Snapshot pod')
    snapshot_pod_parser.add_argument('name', help='Name of pod to snapshot')
    snapshot_pod_parser.set_defaults(command='snapshot_pod')

    snapshot_disk_parser = subparsers.add_parser('snapshot-disk', help='Snapshot disk')
    snapshot_disk_parser.add_argument('name', help='Name of disk to snapshot')
    snapshot_disk_parser.set_defaults(command='snapshot_disk')

    update_snapshot_parser = subparsers.add_parser('update-snapshot',
                                                   help='Update snapshot for a given network')
    update_snapshot_parser.add_argument('network', help='Network to update snapshot for')
    update_snapshot_parser.set_defaults(command='update_snapshot')

    # Pods
    list_parser = subparsers.add_parser('pods', help='List pods')
    list_parser.set_defaults(command='list_pods')

    last_parser = subparsers.add_parser('pod', help='Last pod')
    last_parser.set_defaults(command='get_last_pod')

    last_parser = subparsers.add_parser('synced-pod', help='Get any synced pod')
    last_parser.set_defaults(command='get_synced_pod')

    # Scale up
    scale_up_parser = subparsers.add_parser('scale-up', help='Scale up Ethereum nodes')
    scale_up_parser.set_defaults(command='scale_up')

    # Scale down
    scale_down_parser = subparsers.add_parser('scale-down', help='Scale down Ethereum nodes')
    scale_down_parser.set_defaults(command='scale_down')

    args = parser.parse_args()

    try:
        cmd = args.command
    except AttributeError:
        parser.print_help()
        sys.exit(1)

    run_command(cmd, args)
