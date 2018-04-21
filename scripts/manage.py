#!/usr/bin/env python3
import sys
import admin
import argparse


# Snapshot commands
def cmd_list_snapshots(args):
    print(admin.list_snapshots(args.network))


def cmd_last_snapshot(args):
    print(admin.last_snapshot(args.network))


def cmd_update_snapshot(args):
    pass


# Pod commands
def cmd_list_pods(args):
    for pod in admin.list_pods(args.network):
        print('%s\t%s\t%s' % (pod.name,
                              pod.phase,
                              pod.ip))


def cmd_last_pod(args):
    print(admin.last_pod(args.network))


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
