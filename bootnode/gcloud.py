import googleapiclient.discovery
import re

PROJECT = 'hanzo-ai'
REGION  = 'us-central1'
ZONE    = 'us-central1-a'


def project_zone_from_disk(s):
    match = re.match(r'.*v1/projects/(.*)/zones/(.*)/disk', s)
    return match[1], match[2]


def ssd_type(project, zone):
    return "projects/{0}/zones/{1}/diskTypes/pd-ssd".format(project, zone)


class Snapshot(object):
    def __init__(self, obj, api=None):
        self.api  = api
        self.name = obj['name']

        bits = self.name.split('-')
        self.client  = bits[0]
        self.network = bits[1]
        self.block   = int(bits[2])

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
        return self.api.create_disk(name, self.link, self.project, self.zone)


class Gcloud(object):
    def __init__(self, project=PROJECT, region=REGION, zone=ZONE):
        self.project = project
        self.region  = region
        self.zone    = zone
        self.api     = googleapiclient.discovery.build('compute', 'v1')

    def list_snapshots(self, network=None):
        snaps = [Snapshot(s, self) for s in
                 self.api.snapshots().list(project=self.project).execute()['items']]

        if not network:
            return snaps

        return [s for s in snaps if s.network == network]

    def last_snapshot(self, network=None):
        return max(self.list_snapshots(network), key=lambda x: x.block)

    def create_disk(self, name, snapshot_link, project=PROJECT, zone=ZONE):
        return self.api.disks().insert(project=project, zone=zone, body={
            'name': name,
            'sourceSnapshot': snapshot_link,
            'zone': zone,
            'type': ssd_type(project, zone),
        }).execute()