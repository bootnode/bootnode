import os.path


class Dict(dict):
    def __init__(self, **kwargs):
        dict.__init__(self, **kwargs)
        self.__dict__ = self


class Selector(Dict):
    def __init__(self, matchLabels={}, match_expressions=[]):
        Dict.__init__(self, matchLabels=matchLabels,
                match_expressions=match_expressions)

        self.matchLabels = matchLabels
        self.match_expressions=[]

class ExecAction(Dict):
    def __init__(self, command=[]):
        Dict.__init__(self, command=command)

        self.command=command

class Probe(Dict):
    def __init__(self, exec=None, failureThreshold=3, initialDelaySeconds=10,
            periodSeconds=10, successThreshold=1, timeoutSeconds=1):
        Dict.__init__(self, exec=exec,
                failureThreshold=failureThreshold,
                initialDelaySeconds=initialDelaySeconds,
                periodSeconds=periodSeconds,
                successThreshold=successThreshold,
                timeoutSeconds=timeoutSeconds)

        self.exec=exec
        self.failureThreshold=failureThreshold
        self.initialDelaySeconds=initialDelaySeconds
        self.periodSeconds=periodSeconds
        self.successThreshold=successThreshold
        self.timeoutSeconds=timeoutSeconds

class Metadata(Dict):
    def __init__(self, name='', cluster='', blockchain='', network='',
            labels=None, annotations=None):
        Dict.__init__(self, name=name, cluster=cluster, blockchain=blockchain,
                network=network, labels=labels)
        self.name        = name
        self.cluster     = cluster
        self.blockchain  = blockchain
        self.network     = network
        self.annotations = annotations
        self.labels      = labels

class PodSpec(Dict):
    def __init__(self, containers=(), volumes=(), ports=(), selector=None,
            backend=None):
        Dict.__init__(self, selector=selector, containers=containers,
                      volumes=volumes)
        self.containers = containers
        self.selector   = selector
        self.volumes    = volumes
        self.backend    = backend

class Resources(Dict):
    def __init__(self, requests=None, limits=None):
        Dict.__init__(self, requests=requests, limits=limits)
        self.requests = requests
        self.limits   = limits


class Container(Dict):
    def __init__(self, name, image, command, args, resources=None,
                 volumeMounts=None, livenessProbe=None, readinessProbe=None):
        Dict.__init__(self, name=name, image=image, command=command, args=args,
                      resources=resources, livenessProbe=livenessProbe,
                      readinessProbe=readinessProbe)
        self.name            = name
        self.image           = image
        self.command         = command
        self.args            = args
        self.resources       = resources
        self.volumeMounts    = volumeMounts
        self.livenessProbe   = livenessProbe
        self.readinessProbe  = readinessProbe


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


class Backend(Dict):
    def __init__(self, serviceName, servicePort):
        Dict.__init__(self, serviceName=serviceName, servicePort=servicePort)
        self.serviceName = serviceName
        self.servicePort = servicePort


class ServicePort(Dict):
    def __init__(self, name=None, node_port=None, port=None, protocol='TCP',
            targetPort=None):
        Dict.__init__(self, port=port, protocol=protocol,
                targetPort=targetPort)
        self.name       = name
        self.node_port  = node_port
        self.port       = port
        self.protocol   = protocol
        self.targetPort = targetPort


class BaseTemplateSpec(Dict):
    def __init__(self, apiVersion='v1', kind=None, metadata=Metadata(),
                 spec=PodSpec()):
        Dict.__init__(self, apiVersion=apiVersion, kind=kind,
                      metadata=metadata, spec=spec)
        self.apiVersion = apiVersion
        self.kind       = kind
        self.metadata   = metadata
        self.spec       = spec

class Ingress(BaseTemplateSpec):
    def __init__(self, metadata=None, spec=None):
        super(Ingress, self).__init__(apiVersion='extensions/extensions/v1beta1beta1',
                kind='Ingress', metadata=metadata, spec=spec)


class Service(BaseTemplateSpec):
    def __init__(self, metadata=None, spec=None):
        super(Service, self).__init__(apiVersion='v1', kind='Service',
                                  metadata=metadata, spec=spec)

class ServiceSpec(Dict):
    def __init__(self, clusterIp=None, externalIPs=None, externalName=None,
            externalTrafficPolicy=None, healthCheckNodePort=None,
            loadBalancerIp=None, loadBalancerSourceRanges=None, ports=None,
            publishNotReadyAddresses=False, selector=Selector(),
            sessionAffinity=None, sessionAffinityConfig=None, type='LoadBalancer'):
        Dict.__init__(self, clusterIp=clusterIp,
                externalIPs=externalIPs, externalName=externalName,
                externalTrafficPolicy=externalTrafficPolicy,
                healthCheckNodePort=healthCheckNodePort,
                loadBalancerIp=loadBalancerIp,
                loadBalancerSourceRanges=loadBalancerSourceRanges,
                ports=ports, publishNotReadyAddresses=publishNotReadyAddresses,
                selector=selector, sessionAffinity=sessionAffinity,
                sessionAffinityConfig=sessionAffinityConfig, type=type)

        self.externalIPs=externalIPs
        self.externalName=externalName
        self.externalTrafficPolicy=externalTrafficPolicy
        self.healthCheckNodePort=healthCheckNodePort
        self.loadBalancerIp=loadBalancerIp
        self.loadBalancerSourceRanges=loadBalancerSourceRanges
        self.ports=ports
        self.publishNotReadyAddresses=publishNotReadyAddresses
        self.selector=selector
        self.sessionAffinity=sessionAffinity
        self.sessionAffinityConfig=sessionAffinityConfig
        self.type=type

class Pod(BaseTemplateSpec):
    def __init__(self, metadata=None, spec=None):
        super(Pod, self).__init__(apiVersion='v1', kind='Pod',
                                  metadata=metadata, spec=spec)

class DeploymentStrategy(Dict):
    def __init__(self, type='RollingUpdate'):
        Dict.__init__(self, type=type)

        self.type = type

class DeploymentSpec(Dict):
    def __init__(self,
                 minReadySeconds=0,
                 paused=False,
                 progressDeadlineSeconds=600,
                 replicas=1,
                 revisionHistoryLimit=10,
                 selector={},
                 strategy=DeploymentStrategy(),
                 template=BaseTemplateSpec()):
        Dict.__init__(self,
                      minReadySeconds=minReadySeconds,
                      paused=paused,
                      progressDeadlineSeconds=progressDeadlineSeconds,
                      replicas=replicas,
                      revisionHistoryLimit=revisionHistoryLimit,
                      selector=selector,
                      strategy=strategy,
                      template=template)

        self.minReadySeconds            = minReadySeconds
        self.paused                     = paused
        self.progressDeadlineSeconds    = progressDeadlineSeconds
        self.replicas                   = replicas
        self.revisionHistoryLimit       = revisionHistoryLimit
        self.selector                   = selector
        self.strategy                   = strategy
        self.template                   = template

class Deployment(BaseTemplateSpec):
    def __init__(self, metadata=None, spec=None):
        super(Deployment, self).__init__(apiVersion='apps/v1', kind='Deployment',
                                  metadata=metadata, spec=spec)

class Blockchain(Deployment):
    def __init__(self, name, cluster, blockchain, network, image, command, args, path,
                 requests=None, limits=None):

        """
        Takes blockchain parameters and generates a DeploymentSpec json
        """

        self.name       = name
        self.cluster    = cluster
        self.blockchain = blockchain
        self.network    = network
        self.image      = image
        self.command    = command
        self.args       = args
        self.path       = path

        self.deploymentMetadata = Metadata(
                name=name,
                cluster=cluster,
                blockchain=blockchain,
                network=network)

        self.podMetadata = Metadata(
                name='pod-' + name,
                cluster=cluster,
                blockchain=blockchain,
                network=network,
                labels={
                    'app': name
                })

        client = os.path.basename(command)

        self.podSpec = PodSpec(
            selector={},
            containers=[],
            volumes=[],
        )

        self.deploymentSpec = DeploymentSpec(
            selector=Selector(
                matchLabels={
                    'app': name
                }
            ),
            template=BaseTemplateSpec(
                metadata=self.podMetadata,
                spec=self.podSpec,
            )
        )

        container = Container(
            name=name,
            image=image,
            command=[command],
            args=args,
            volumeMounts=[VolumeMount(mountPath=path, name=name + '-pv')],
            resources=Resources(),
            readinessProbe=Probe(
                exec=ExecAction(
                    command=['./scripts/alive.sh']
                )
            ),
            livenessProbe=Probe(
                exec=ExecAction(
                    command=['./scripts/alive.sh']
                )
            )
        )

        if requests:
            container.resources.request = requests
        if limits:
            container.resources.limits = limits

        self.podSpec.containers.append(container)

        volume = Volume(
            name=name + '-pv',
            gcePersistentDisk=GcePersistentDisk(
                pdName=name + '-pd',
                fsType='ext4',
            )
        )

        self.podSpec.volumes.append(volume)

        # Create a PodSpec
        super(Blockchain, self).__init__(metadata=self.deploymentMetadata, spec=self.deploymentSpec)

        self.name       = name
        self.cluster    = cluster
        self.blockchain = blockchain
        self.network    = network

    def get_service(self, ports):
        return Service(
            metadata=Metadata(
                name='service-' + self.name,
                cluster=self.cluster,
                blockchain=self.blockchain,
                network=self.network
            ),
            spec=ServiceSpec(
                selector={
                    'app': self.name
                },
                type='LoadBalancer',
                ports=ports,
            )
        )

    @classmethod
    def to_network_id(cls, network):
        return 0

    @classmethod
    def to_network(cls, network_id):
        return

    @classmethod
    def normalize_network(cls, network):
        return None, 0

    @classmethod
    def is_blockchain(cls, chain):
        return

    @classmethod
    def get_name(cls):
        return "none"

class Ethereum(Blockchain):
    def __init__(self, name, network='mainnet', cluster=None,
                 image='gcr.io/hanzo-ai/geth:latest', command='/bin/geth',
                 args=None, datadir='/data', path='/data/geth/chaindata',
                 size=None, rpc=True, ws=True, rpcport=8545, wsport=8546,
                 rpccorsdomain='*', wsorigins='*', requests=None, limits=None):

        """
        Takes Ethereum parameters and generates a DeploymentSpec json
        """

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
                    '--rpcapi="eth,net,web3"',
                    '--rpcport={0}'.format(rpcport),
                    '--rpccorsdomain="{0}"'.format(rpccorsdomain),
                ])

            if ws:
                args.extend([
                    '--ws',
                    '--wsaddr=0.0.0.0',
                    '--wsapi="eth,net,web3"',
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
                requests = Requests(cpu='2', memory='1Gi')
                limits   = Limits(cpu='2',   memory='1536Mi')
                args.extend([
                    '--cache=512',
                    '--maxpeers=15',
                ])

            elif size == 'medium':
                requests = Requests(cpu='2', memory='2Gi')
                limits   = Limits(cpu='2',   memory='3Gi')
                args.extend([
                    '--cache=1024',
                    '--maxpeers=25',
                ])

            elif size == 'large':
                requests = Requests(cpu='2', memory='4Gi')
                limits   = Limits(cpu='2',   memory='6Gi')
                args.extend([
                    '--cache=2048',
                    '--maxpeers=50',
                ])

            elif size == 'huge':
                requests = Requests(cpu='2', memory='8Gi')
                limits   = Limits(cpu='2',   memory='12Gi')
                args.extend([
                    '--cache=4096',
                    '--maxpeers=100',
                ])

        # Generate a PodSpec
        super(Ethereum, self).__init__(name, cluster, 'ethereum', network, image,
                                       command, args, path, requests, limits)

    def get_service(self):
        ports = []
        ports.append(
            ServicePort(
                name='rpc',
                protocol='TCP',
                port=8545,
                targetPort=8545
            ))
        ports.append(
            ServicePort(
                name='ws',
                protocol='TCP',
                port=8546,
                targetPort=8546
            ))

        print(ports)
        service = super(Ethereum, self).get_service(ports)
        print(service)

        return service

    @classmethod
    def to_network_id(cls, network):
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

    @classmethod
    def to_network(cls, network_id):
        return {
            1: 'mainnet',
            2: 'morden',
            3: 'testnet',
            4: 'rinkeby'
        }.get(network_id)

    @classmethod
    def normalize_network(cls, network):
        network_id = Ethereum.to_network_id(network)
        network    = Ethereum.to_network(network_id)
        return network, network_id

    @classmethod
    def is_blockchain(cls, chain):
        return chain in ['ethereum', 'eth', 'geth']

    @classmethod
    def get_name(cls):
        return 'geth'

class Bitcoin(Blockchain):
    def __init__(self, name, network, image, command, args, path,
                 resources=None, limits=None):
        """
        Takes Bitcoin parameters and generates a DeploymentSpec json
        """

        #Generate PodSpec
        super(Bitcoin, self).__init__(name, 'bitcoin', network, image, command,
                                      args, path, resources, limits)

    @classmethod
    def to_network_id(cls, network):
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

    @classmethod
    def to_network(cls, network_id):
        return {
            1: 'mainnet',
            2: 'testnet',
        }.get(network_id)

    @classmethod
    def normalize_network(cls, network):
        network_id = Ethereum.to_network_id(network)
        network    = Ethereum.to_network(network_id)
        return network, network_id

    @classmethod
    def is_blockchain(cls, chain):
        return chain in ['bitcoin']
