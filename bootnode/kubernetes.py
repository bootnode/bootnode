from kubernetes import client, config

POD_NAMESPACE = 'default'


class Pod(object):
    def __init__(self, pod):
        name = pod.metadata.name
        self.name = name

        self.phase = pod.status.phase
        self.ip    = pod.status.pod_ip

        # Pod names should follow client-network-number scheme
        bits = name.split('-')
        self.client  = bits[0]
        self.network = bits[1]

        # Pod may not follow correct naming scheme
        if len(bits) > 2:
            self.number = int(bits[2])
        else:
            self.number = -1

    def __repr__(self):
        return self.name


class Kubernetes(object):
    def __init__(self, config_path):
        self.config_path = config_path

        config.load_kube_config(config_path)
        self.api = client.CoreV1Api()

    def list_pods(self, network=None):
        pods = [Pod(p) for p in
                self.api.list_namespaced_pod(POD_NAMESPACE).items]

        if not network:
            return pods

        return [p for p in pods if p.network == network]

    def last_pod(self, network=None):
        return max(self.list_pods(network), key=lambda x: x.number)
