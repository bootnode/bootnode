from google.cloud import container_v1
from oauth2client.client import GoogleCredentials
from protobuf_to_dict import protobuf_to_dict as pbd
from googleapiclient import discovery
import re

PROJECT = 'hanzo-ai'
REGION  = 'us-central1'
ZONE    = 'us-central1-a'


def project_zone_from_disk(s):
    """
    Helper to pull project id and zone off a disk URI.
    """
    match = re.match(r'.*v1/projects/(.*)/zones/(.*)/disk', s)
    return match[1], match[2]


def type_from_url(s):
    """
    Get disk type from disk URI.
    """
    match = re.match(r'.*diskTypes/(.*)', s)
    return match[1]


def ssd_type(project, zone):
    """
    Return URI for SSD Disk type formatted to match gcloud requirements.
    """
    return "projects/{0}/zones/{1}/diskTypes/pd-ssd".format(project, zone)


class NodePool(object):
    """
    GKE NodePool, annotated with values we care about.
    """

    def __init__(self, obj, api=None):
        self.gke_api            = api
        self.name               = obj['name']
        self.id                 = obj['name']  # NodePools do not seem to have an ID
        self.link               = obj['self_link']
        self.status             = obj['status']
        self.config             = obj['config']
        self.autoscaling        = obj['autoscaling']
        self.initial_node_count = obj['initial_node_count']
        self.management         = obj['management']
        self.version            = obj['version']
        self.instance_group     = obj['instance_group_urls']


class Cluster(object):
    """
    GKE Cluster, annotated with values we care about.
    """

    def __init__(self, obj, api=None):
        self.gke_api            = api
        self.name               = obj['name']
        self.id                 = obj['name']  # Clusters do not seem to have an ID
        self.created_at         = obj['create_time']
        self.link               = obj['self_link']
        self.status             = obj['status']
        self.zone               = obj['zone']
        self.endpoint           = obj['endpoint']
        self.ip                 = obj['endpoint']
        self.version            = obj['current_master_version']
        self.master_version     = obj['current_master_version']
        self.node_version       = obj['current_node_version']
        self.node_count         = obj['current_node_count']
        self.node_config        = obj['node_config']
        self.master_auth        = obj['master_auth']
        self.maintenance_policy = obj['maintenance_policy']
        self.locations          = obj['locations']
        self.instance_groupl    = obj['instance_group_urls']

        self.node_pools = [NodePool(o, api) for o in obj['node_pools']]


class Disk(object):
    """
    GCE Disk, annotated with values we care about.
    """

    def __init__(self, obj, api=None):
        self.gce_api    = api
        self.name       = obj['name']
        self.id         = obj['id']
        self.created_at = obj['creationTimestamp']
        self.link       = obj['selfLink']
        self.status     = obj['status']
        self.size       = obj['sizeGb']
        self.type       = type_from_url(obj['type'])

        labels = obj.get('labels', None)
        if labels:
            self.pod = labels['pod-name']
        else:
            self.pod = None

        self.project, self.zone = project_zone_from_disk(self.link)

        self.source_image    = None
        self.source_image_id = None

        if 'sourceImage' in obj:
            self.source_image    = obj['sourceImage']
            self.source_image_id = obj['sourceImageId']


class Snapshot(object):
    """
    GCE Snapshot, annotated with values we care about.
    """

    def __init__(self, obj, api=None):
        self.gce_api = api
        self.name    = obj['name']

        bits = self.name.split('-')
        self.client  = bits[0]
        self.network = bits[1]
        self.block   = int(bits[2])

        labels = obj.get('labels', None)
        if labels:
            self.pod = labels['pod-name']
        else:
            self.pod = None

        self.id         = obj['id']
        self.created_at = obj['creationTimestamp']
        self.disk_size  = obj['diskSizeGb'] + 'Gi'

        self.link                = obj['selfLink']
        self.source_disk         = obj['sourceDisk']
        self.source_disk_id      = obj['sourceDiskId']
        self.status              = obj['status']
        self.storage_bytes       = obj['storageBytes']
        self.storage_byts_status = obj['storageBytesStatus']

        self.project, self.zone = project_zone_from_disk(self.source_disk)

    def __repr__(self):
        return self.name

    def create_disk(self, name):
        return self.gce_api.create_disk(name, self, self.project, self.zone)


class Gcloud(object):
    """
    Client for both Google Compute Engine and Google Container Engine.
    """

    def __init__(self, project=PROJECT, region=REGION, zone=ZONE):
        self.project = project
        self.region  = region
        self.zone    = zone
        self.gce_api = discovery.build('compute', 'v1')
        self.gke_api = container_v1.ClusterManagerClient()

    # Disks
    def create_disk(self, name, snapshot, project=None, zone=None):
        """
        Create a new disk from a given snapshot.
        """
        if not project:
            project = snapshot.project
        if not zone:
            zone = snapshot.zone

        body = {
            'name': name,
            'description': 'from-pod: {0} from-snapshot: {1}'.format(snapshot.pod, snapshot.name),
            'labels': {
                'snapshot-name': snapshot.name,
                'pod-name':      snapshot.pod,
                'project':       project,
                'zone':          zone,
            },
            'sourceSnapshot': snapshot.link,
            'zone': zone,
            'type': ssd_type(project, zone),
        }
        return self.gce_api.disks().insert(project=project, zone=zone,
                                           body=body).execute()

    def get_disk(self, name):
        """
        Get a specific disk by name.
        """
        for disk in self.list_disks():
            if disk.name == name:
                return disk

    def get_last_disk(self, network=None):
        """
        Get last disk created.
        """
        return max(self.list_disks(network), key=lambda x: x.created_at)

    def list_disks(self, network=None):
        """
        List disks for project / zone, optionally filter by network.
        """
        disks = [Disk(s, self) for s in
                 self.gce_api.disks().list(project=self.project, zone=self.zone).execute()['items']]

        if not network:
            return disks

        return [s for s in disks if s.network == network]

    # Snapshots
    def get_snapshot(self, name):
        """
        Get a snapshot by name.
        """
        for snap in self.list_snapshots():
            if snap.name == name:
                return snap

    def get_last_snapshot(self, network=None):
        """
        Get snapshot with highest block number.
        """
        return max(self.list_snapshots(network), key=lambda x: x.block)

    def list_snapshots(self, network=None):
        """
        List all snapshots for a given network.
        """
        snaps = [Snapshot(s, self) for s in
                 self.gce_api.snapshots().list(project=self.project).execute()['items']]

        if not network:
            return snaps

        return [s for s in snaps if s.network == network]

    def snapshot_disk(self, disk, name, pod_name=None, project=None, zone=None):
        """
        Create a snapshot of a given disk. Optionally label with Pod disk is
        associated.
        """

        if not project:
            project = self.project
        if not zone:
            zone = self.zone

        body = {
            'name': name,
            'labels': {
                'pod-name': pod_name,
                'project':  project,
                'zone':     zone,
            },
            'description': 'from-pod: {0}'.format(pod_name)
        }

        return self.gce_api.disks().createSnapshot(project=project, zone=zone,
                                                   disk=disk,
                                                   body=body).execute()

    def snapshot_pod(self, pod, project=None, zone=None):
        """
        Snapshot a running pod, as long as it is synced.
        """
        if pod.syncing():
            raise Exception('Pod not synced: ""' % pod.name)

        name = "{0}-{1}-{2}".format(pod.client, pod.network, pod.block_number())
        return self.snapshot_disk(pod.disk, name, pod_name=pod.name)

    def create_cluster(self, chain, network, zone=None, retry=None, timeout=None):
        """
        Creates a new GKE cluster using NEG.
        """
        # gcloud container clusters create neg-demo-cluster \
        #     --enable-ip-alias \
        #     --create-subnetwork="" \
        #     --network=default \
        #     --zone=us-central1-a
        if not zone:
            zone = self.zone

        name = "{}-{}".format(chain, network)

        body = {
            "cluster": {
                "name": name,
                "description": "Boonode created and managed cluster for {} chain, {} network".format(chain, network),
                "nodePools": [{
                    "name": "default-pool",
                    "initialNodeCount": 1,
                    "autoscaling": {
                        "enabled": True,
                        "minNodeCount": 1,
                        "maxNodeCount": 10,
                    },
                    "management": {
                        "autoRepair": True,
                        "autoUpgrade": True,
                    },
                    "config": {
                        "machineType": "n1-standard-2",
                        "diskSizeGb": 100,
                        "diskType": "pd-ssd",
                        "minCpuPlatform": "Intel Skylake",
                        "oauthScopes": [
                            "https://www.googleapis.com/auth/compute",
                            "https://www.googleapis.com/auth/devstorage.read_only",
                        ],
                    },
                }],
                "loggingService": "logging.googleapis.com",
                "monitoringService": "monitoring.googleapis.com",
                "ipAllocationPolicy": {
                    "useIpAliases": True,
                    "createSubnetwork": True,
                },
                # "addons_config": {
                #     "horizontal_pod_autoscaling": {
                #         "disabled": False,
                #     },
                #     "http_load_balancing": {
                #         "disabled": False,
                #     },
                #     "kubernetes_dashboard": {
                #         "disabled": False,
                #     },
                # },
            },
        }

        credentials = GoogleCredentials.get_application_default()
        service = discovery.build('container', 'v1', credentials=credentials)
        return service.projects().zones().clusters().create(projectId=self.project, zone=zone, body=body).execute()
        # self.gke_api.create_cluster(self.project, zone, cluster)

    # Clusters
    def list_clusters(self, project=None, zone=None, retry=None, timeout=None):
        """
        Lists all clusters owned by a project in either the specified zone or
        all zones.
        """
        return [Cluster(c, self) for c in
                pbd(self.gke_api.list_clusters(self.project, self.zone, retry,
                                               timeout))['clusters']]

    def get_cluster(self, cluster_id, zone, retry=None, timeout=None):
        """
        Gets the details of a specific cluster.
        """
        return self.gke_api.list_clusters(self.project, zone, cluster_id, retry, timeout)

    # Misc operations
    def cancel_operation(self, operation_id, retry=None, timeout=None):
        """
        Cancels the specified operation.
        """
        return self.gke_api.cancel_operation(self.project, self.zone,
                                             operation_id, retry, timeout)
