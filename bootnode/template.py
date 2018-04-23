class Dict(dict):
    def __init__(self, **kwargs):
        dict.__init__(self, **kwargs)
        self.__dict__ = self


class Metadata(Dict):
    def __init__(self, name='', blockchain='', network=''):
        Dict.__init__(self, name=name, blockchain=blockchain, network=network)
        self.name       = name
        self.blockchain = blockchain
        self.network    = network


class Spec(dict):
    def __init__(self, nodeSelector=None, containers=(), volumes=()):
        Dict.__init__(self, nodeSelector=nodeSelector, containers=containers,
                      volumes=volumes)
        self.__dict__ = self
        self.nodeSelector = nodeSelector
        self.containers   = containers
        self.volumes      = volumes


class Config(dict):
    def __init__(self, apiVersion='v1', kind=None, metadata=Metadata(),
                 spec=Spec()):
        Dict.__init__(self, apiVersion=apiVersion, kind=kind,
                      metadata=metadata, spec=spec)
        self.apiVersion = apiVersion
        self.kind       = kind
        self.metadata   = metadata
        self.spec       = spec


class Resources(dict):
    def __init__(self, requests=None, limits=None):
        Dict.__init__(self, requests=requests, limits=limits)
        self.requests = requests
        self.limits   = limits


class Container(dict):
    def __init__(self, name, image, command, args, resources=None,
                 volumeMounts=None):
        Dict.__init__(self, name=name, image=image, command=command, args=args,
                      resources=resources)
        self.name         = name
        self.image        = image
        self.command      = command
        self.args         = args
        self.resources    = resources
        self.volumeMounts = volumeMounts


class Requests(dict):
    def __init__(self, cpu=None, memory=None):
        Dict.__init__(self, cpu=cpu, memory=memory)
        self.cpu    = cpu
        self.memory = memory


class Limits(dict):
    def __init__(self, cpu=None, memory=None):
        Dict.__init__(self, cpu=cpu, memory=memory)
        self.cpu    = cpu
        self.memory = memory


class VolumeMount(dict):
    def __init__(self, name, mountPath):
        Dict.__init__(self, name=name, mountPath=mountPath)
        self.name      = name
        self.mountPath = mountPath


class Volume(dict):
    def __init__(self, name, gcePersistentDisk):
        Dict.__init__(self, name=name, gcePersistentDisk=gcePersistentDisk)
        self.name              = name
        self.gcePersistentDisk = gcePersistentDisk


class GcePersistentDisk(dict):
    def __init__(self, pdName, fsType):
        Dict.__init__(self, pdName=pdName, fsType=fsType)
        self.pdName = pdName
        self.fsType = fsType


class Pod(Config):
    def __init__(self, name, blockchain, network, image, command, args, path,
                 resources=None, limits=None):

        self.name       = name
        self.blockchain = blockchain
        self.network    = network
        self.image      = image
        self.command    = command
        self.args       = args
        self.path       = path
        self.resources  = resources
        self.limits     = limits

        self.metadata = Metadata(name=name, blockchain=blockchain, network=network)

        self.spec = Spec(
            nodeSelector={"cloud.google.com/gke-nodepool": network},
            containers=[],
            volumes=[],
        )

        container = Container(
            name=name,
            image=image,
            command=[command],
            args=args,
            volumeMounts=[VolumeMount(mountPath=path, name=name + '-pv')],
        )

        if resources:
            container.resources.request = resources
        if limits:
            container.resources.limits = limits

        self.spec.containers.append(container)

        volume = Volume(
            name=name + '-pv',
            gcePersistentDisk=GcePersistentDisk(
                pdName=name + '-pd',
                fsType='ext4',
            )
        )

        self.spec.volumes.append(volume)

        super(Pod, self).__init__(apiVersion='v1', kind='Pod',
                                  metadata=self.metadata, spec=self.spec)


class Ethereum(Pod):
    pass


class Bitcoin(Pod):
    pass

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
