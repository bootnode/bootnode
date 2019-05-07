sha1    	:= $(shell git rev-parse --short=8 HEAD)
geth    	:= /bin/geth --datadir=/data
net     	?= testnet
cfg     	:= config/$(net)
region  	:= us-central1
zone    	?= us-central1-a
number  	?= 657758440341
node    	?= geth
project_id 	?= hanzo-ai
pod			?= $(node)-$(net)-$(number)

export KUBECONFIG=config/$(node)-$(net)-$(zone)/cluster.yaml

all: deploy

### GCLOUD SPECIFIC COMMANDS ###

# authenticate gcloud
gcloud-auth:
	gcloud auth application-default login
	gcloud config set project $(project_id)

# Add secret for hanzo-ai gcr.io. This enables our cluster to pull images from
# our shared image repo. This should only be run once after cluster creation.
gcloud-add-gcr-key:
	kubectl create -f config/secret.yaml
	kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "gcr-secret"}]}'

# Default to whatever zone you launched your cluster in to reduce key strokes
gcloud-region-zone-defaults:
	gcloud compute project-info add-metadata --metadata=google-compute-default-region=$(region)
	gcloud compute project-info add-metadata --metadata=google-compute-default-zone=$(zone)

# Get credentials for kubectl for current cluster
gcloud-get-credentials:
	gcloud container clusters get-credentials $(node)-$(net) --zone $(zone) --project $(project_id)
	# rm -rf config/$(node)-$(net)-$(zone)
	# mv -f config/$(node)-$(net) config/$(node)-$(net)-$(zone)
	@echo "KUBECONFIG=$(KUBECONFIG)" > kubeconfig
	echo "`source kubeconfig` to update KUBECONFIG environemental variable"

#build image
build:
	gcloud builds submit \
		--machine-type n1-highcpu-8 \
		--timeout 30m \
		-t gcr.io/$(project_id)/$(node):$(sha1) \
		-t gcr.io/$(project_id)/$(node):latest \
		$(node)

# deploy: build
# 	kubectl set image deployment/$(node)-$(net) $(node)-$(net)=gcr.io/$(project_id)/$(node):$(sha1)

### KUBERNETES SPECIFIC COMMANDS ###

create: build create-volume create-pod

# Setup a high-performance persistent disk. Use SSDs, and at least 500 GB of storage for adequate IO performance
# Ensure proper flags for ext4:
# 	mkfs.ext4 -m 0 -F -E lazy_itable_init=0,lazy_journal_init=0,discard /dev/sdb
# create-disk:
# 	gcloud compute disks create --size=500GB --type=pd-ssd --zone=us-central1-a geth-$(net)-data

create-volume:
	kubectl apply -f config/sc.yaml
	kubectl apply -f $(cfg)/pvc.yaml

create-snapshot:
	gcloud compute disks snapshot $(disk) --snapshot-names=$(snapshot) --zone=$(zone)

create-disk-from-snapshot:
	gcloud compute disks create $(disk) --source-snapshot=$(snapshot) --type=pd-ssd --zone=$(zone)

create-pod:
	kubectl apply -f $(cfg)/pod.yaml

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
	kubectl logs $(pod) -f

ssh:
	kubectl exec -it $(pod) -- /bin/bash

attach:
	kubectl exec -it $(pod) -- $(geth) attach

nodeinfo:
	kubectl exec -it $(pod) -- $(geth) attach --exec 'admin.nodeInfo'

syncstatus:
	kubectl exec -it $(pod) -- $(geth) attach --exec 'eth.syncing'

blocknumber:
	kubectl exec -it $(pod) -- $(geth) attach --exec 'eth.blockNumber'

kubeconfig:
	source kubeconfig

deps:
	pip install - ./requirements.txt

# Run Server
serve: kubeconfig
	python api.py

serve-prod: kubeconfig
	python app.py
