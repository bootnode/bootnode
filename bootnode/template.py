from collections import namedtuple


Config = namedtuple('Config', [
    'apiVersion',
    'kind',
    'metadata',
    'spec',
])

Metadata = namedtuple('Metadata', [
    'name',
    'blockchain',
    'network',
])

Spec = namedtuple('Spec', [
    'nodeSelector',
    'containers',
    'volumes',
])

Container = namedtuple('Container', [
    'name',
    'image',
    'resources',
    'command',
    'args',
    'volumeMounts',
])

Resources = namedtuple('Resources', [
    'requests',
    'limits',
])

Requests = namedtuple('Requests', [
    'cpu',
    'memory',
])

Limits = namedtuple('Limits', [
    'cpu',
    'memory',
])

VolumeMount = namedtuple('VolumeMount', [
    'name',
    'mountPath',
])

Volume = namedtuple('Volume', [
    'name',
    'gcePersistentDisk',
])

GcePersistentDisk = namedtuple('GcePersistentDisk', [
    'pdName',
    'fsType',
])


class PodTemplate(object):
    def __init__(self, name, blockchain, network, image, command, args, path,
                 resources=None, limits=None):

        cfg = Config(apiVersion='v1', kind='Pod')

        cfg.metadata = Metadata(name=name, blockchain=blockchain, network=network)

        cfg.spec = Spec(
            nodeSelector={
                "cloud.google.com/gke-nodepool": network,
            },
            containers=[],
            volumes=[],
        )

        container = Container(
            name=name,
            image=image,
            command=[command],
            args=args,
            volumeMounts=[
                Volume(mountPath=path, name=name + '-pv'),
            ],
        )

        if resources:
            container.resources.request = resources
        if limits:
            container.resources.limits = limits

        mount = VolumeMount(
            mountPath=path,
            name=name + '-pv',
        )
        container.volumeMounts.append(mount)

        cfg.spec.containers.append(container)

        volume = Volume(
            name=name + '-pv',
            gcePersistentDisk=GcePersistentDisk(
                pdName=name + '-pd',
                fsType='ext4',
            )
        )

        cfg.spec.volumes.append(volume)


# apiVersion: v1
# kind: Pod
# metadata:
#   name: geth-mainnet-000
#   network: mainnet
# spec:
#   nodeSelector:
#     cloud.google.com/gke-nodepool: geth-mainnet
#   containers:
#     - name: geth-mainnet-000
#       image: gcr.io/hanzo-ai/geth:latest
#       resources:
#         requests:
#           cpu: 3
#           memory: 8Gi
#       command:
#         - /bin/geth
#       args:
#         - --datadir=/data
#         - --ethash.dagdir=/data/geth/chaindata/dag
#         - --cache=4096
#         - --rpc
#         - --rpcaddr=0.0.0.0
#         - --rpcport=8545
#         - --rpccorsdomain="*"
#         - --ws
#         - --wsaddr=0.0.0.0
#         - --wsport=8546
#         - --wsorigins="*"
#         - --syncmode=fast
#         - --maxpeers=50
#       volumeMounts:
#         - mountPath: '/data/geth/chaindata'
#           name: geth-mainnet-000-pv
#   volumes:
#     - name: geth-mainnet-000-pv
#       gcePersistentDisk:
#         pdName: geth-mainnet-000-pd
#         fsType: ext4
