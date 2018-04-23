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


class Spec(Dict):
    def __init__(self, nodeSelector=None, containers=(), volumes=()):
        Dict.__init__(self, nodeSelector=nodeSelector, containers=containers,
                      volumes=volumes)
        self.__dict__ = self
        self.nodeSelector = nodeSelector
        self.containers   = containers
        self.volumes      = volumes


class Resources(Dict):
    def __init__(self, requests=None, limits=None):
        Dict.__init__(self, requests=requests, limits=limits)
        self.requests = requests
        self.limits   = limits


class Container(Dict):
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


class Requests(Dict):
    def __init__(self, cpu=None, memory=None):
        Dict.__init__(self, cpu=cpu, memory=memory)
        self.cpu    = cpu
        self.memory = memory


class Limits(Dict):
    def __init__(self, cpu=None, memory=None):
        Dict.__init__(self, cpu=cpu, memory=memory)
        self.cpu    = cpu
        self.memory = memory


class VolumeMount(Dict):
    def __init__(self, name, mountPath):
        Dict.__init__(self, name=name, mountPath=mountPath)
        self.name      = name
        self.mountPath = mountPath


class Volume(Dict):
    def __init__(self, name, gcePersistentDisk):
        Dict.__init__(self, name=name, gcePersistentDisk=gcePersistentDisk)
        self.name              = name
        self.gcePersistentDisk = gcePersistentDisk


class GcePersistentDisk(Dict):
    def __init__(self, pdName, fsType):
        Dict.__init__(self, pdName=pdName, fsType=fsType)
        self.pdName = pdName
        self.fsType = fsType


class Config(Dict):
    def __init__(self, apiVersion='v1', kind=None, metadata=Metadata(),
                 spec=Spec()):
        Dict.__init__(self, apiVersion=apiVersion, kind=kind,
                      metadata=metadata, spec=spec)
        self.apiVersion = apiVersion
        self.kind       = kind
        self.metadata   = metadata
        self.spec       = spec


class Pod(Config):
    def __init__(self, metadata=None, spec=None):
        super(Pod, self).__init__(apiVersion='v1', kind='Pod',
                                  metadata=metadata, spec=spec)


class Blockchain(Pod):
    def __init__(self, name, blockchain, network, image, command, args, path,
                 requests=None, limits=None):

        self.name       = name
        self.blockchain = blockchain
        self.network    = network
        self.image      = image
        self.command    = command
        self.args       = args
        self.path       = path

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
            resources=Resources(),
        )

        if requests:
            container.resources.request = requests
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

        super(Blockchain, self).__init__(self.metadata, self.spec)


class Ethereum(Blockchain):
    def __init__(self, name, network='mainnet',
                 image='gcr.io/hanzo-ai/geth:latest', command='/bin/geth',
                 args=None, datadir='/data', path='/data/geth/chaindata',
                 size=None, rpc=True, ws=True, rpcport=8545, wsport=8546,
                 rpccorsdomain='*', wsorigins='*', requests=None, limits=None):

        # Normalize networks
        network, network_id = Ethereum.normalize_network(network)

        if args is None:
            args = [
                '--networkid={0}'.format(network_id),
                '--datadir=/data',
                '--ethash.dagdir=/data/geth/chaindata/dag',
                '--syncmode=fast',
            ]

            if rpc:
                args.extend([
                    '--rpc',
                    '--rpcaddr=0.0.0.0',
                    '--rpcport={0}'.format(rpcport),
                    '--rpccorsdomain="{0}"'.format(rpccorsdomain),
                ])

            if ws:
                args.extend([
                    '--ws',
                    '--wsaddr=0.0.0.0',
                    '--wsport={0}'.format(wsport),
                    '--wsorigins="{0}"'.format(wsorigins),
                ])

            if size is None and requests is None:
                if network is 'mainnet':
                    size = 'large'
                elif network is 'testnet':
                    size = 'medium'
                else:
                    size = 'small'

            if size == 'small':
                requests = Requests(cpu='1', memory='1Gi')
                limits   = Limits(cpu='1',   memory='2Gi')
                args.extend([
                    '--cache=512',
                    '--maxpeers=15',
                ])

            elif size == 'medium':
                requests = Requests(cpu='2', memory='2Gi')
                limits   = Limits(cpu='2',   memory='4Gi')
                args.extend([
                    '--cache=1024',
                    '--maxpeers=25',
                ])

            elif size == 'large':
                requests = Requests(cpu='3', memory='8Gi')
                limits   = None
                args.extend([
                    '--cache=4096',
                    '--maxpeers=50',
                ])

        super(Ethereum, self).__init__(name, 'ethereum', network, image,
                                       command, args, path, requests, limits)

    @staticmethod
    def to_network_id(network):
        return {
            'mainnet':  1,
            'frontier': 1,
            '1':        1,

            'morden':   2,
            '2':        2,

            'testnet':  3,
            'ropsten':  3,
            '3':        3,

            'rinkeby':  4,
            '4':        4
        }.get(str(network).lower())

    @staticmethod
    def to_network(network_id):
        return {
            1: 'mainnet',
            2: 'morden',
            3: 'testnet',
            4: 'rinkeby'
        }.get(network_id)

    @staticmethod
    def normalize_network(network):
        network_id = Ethereum.to_network_id(network)
        network    = Ethereum.to_network(network_id)
        return network, network_id


class Bitcoin(Blockchain):
    def __init__(self, name, network, image, command, args, path,
                 resources=None, limits=None):
        super(Bitcoin, self).__init__(name, 'bitcoin', network, image, command,
                                      args, path, resources, limits)
