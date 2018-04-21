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

    # Call relevant method on Bootnode
    getattr(bootnode, cmd)(**kwargs)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Cluster management commands')
    parser.add_argument('--network', help='Ethereum network')
    subparsers = parser.add_subparsers()

    # Disks
    list_parser = subparsers.add_parser('disks', help='List disks')
    list_parser.set_defaults(command='list_disks')

    last_parser = subparsers.add_parser('disk', help='Last disk')
    last_parser.set_defaults(command='last_disk')

    # Snapshots
    list_parser = subparsers.add_parser('snapshots', help='List snapshots')
    list_parser.set_defaults(command='list_snapshots')

    last_parser = subparsers.add_parser('snapshot', help='Last snapshot')
    last_parser.set_defaults(command='last_snapshot')

    update_parser = subparsers.add_parser('snapshot-update', help='Update snapshot')
    update_parser.set_defaults(command='update_snapshot')

    # Pods
    list_parser = subparsers.add_parser('pods', help='List pods')
    list_parser.set_defaults(command='list_pods')

    last_parser = subparsers.add_parser('pod', help='Last pod')
    last_parser.set_defaults(command='last_pod')

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
