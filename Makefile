sha1    	:= $(shell git rev-parse --short=8 HEAD)
geth    	:= /bin/geth --datadir=/data
net     	?= testnet
cfg     	:= config/$(net)
region  	:= us-central1
zone    	:= us-central1-a
number  	?= 657758440341
node    	?= geth
project_id 	:= hanzo-ai

export KUBECONFIG=config/$(node)-$(net)/cluster.yaml

all: deploy

# authenticate gcloud
gcloud-auth:
	gcloud auth application-default login
	gcloud config set project $(project_id)

#build image
build:
	gcloud builds submit \
		-t gcr.io/$(project_id)/$(node):$(sha1) \
		-t gcr.io/$(project_id)/$(node):latest \
		geth

deploy: build
	kubectl set image deployment/$(node)-$(net) $(node)-$(net)=gcr.io/$(project_id)/$(node):$(sha1)

create: build create-volume create-pod

# Setup a high-performance persistent disk. Use SSDs, and at least 500 GB of storage for adequate IO performance
# Ensure proper flags for ext4:
# 	mkfs.ext4 -m 0 -F -E lazy_itable_init=0,lazy_journal_init=0,discard /dev/sdb
# create-disk:
# 	gcloud compute disks create --size=500GB --type=pd-ssd --zone=us-central1-a geth-$(net)-data

create-volume:
	kubectl apply -f config/sc.yaml
	kubectl apply -f $(cfg)/pvc.yaml

create-pod:
	kubectl apply -f $(cfg)/pod.yaml

create-snapshot:
	gcloud compute disks snapshot $(disk) --snapshot-names=$(snapshot) --zone=$(zone)

create-disk-from-snapshot:
	gcloud compute disks create $(disk) --source-snapshot=$(snapshot) --type=pd-ssd --zone=$(zone)

delete-pod:
	kubectl delete -f $(cfg)/pod.yaml

delete:
	kubectl delete -f $(cfg)/pod.yaml || echo not running
	kubectl delete -f $(cfg)/pvc.yaml || echo not running
	kubectl delete -f $(cfg)/sc.yaml  || echo not running
	gcloud compute disks delete --zone=$(zone) $(node)-$(net)-disk

status:
	kubectl get pods -o yaml

logs:
	kubectl logs $(node)-$(net)-$(number) -f

ssh:
	kubectl exec -it $(node)-$(net)-$(number) -- /bin/bash

attach:
	kubectl exec -it $(node)-$(net)-$(number) -- $(geth) attach

nodeinfo:
	kubectl exec -it $(node)-$(net)-$(number) -- $(geth) attach --exec 'admin.nodeInfo'

syncstatus:
	kubectl exec -it $(node)-$(net)-$(number) -- $(geth) attach --exec 'eth.syncing'

blocknumber:
	kubectl exec -it $(node)-$(net)-$(number) -- $(geth) attach --exec 'eth.blockNumber'

# Add secret for hanzo-ai gcr.io. This enables our cluster to pull images from
# our shared image repo. This should only be run once after cluster creation.
add-gcr-key:
	kubectl create -f config/secret.yaml
	kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "gcr-secret"}]}'

# Get credentials for kubectl for current cluster
get-credentials:
	gcloud container clusters get-credentials $(node)-$(net) --zone $(zone) --project $(project_id)

# Default to whatever zone you launched your cluster in to reduce key strokes
region-zone-defaults:
	gcloud compute project-info add-metadata --metadata=google-compute-default-region=$(region)
	gcloud compute project-info add-metadata --metadata=google-compute-default-zone=$(zone)
