export KUBECONFIG=config/cluster.yaml

sha1 := $(shell git rev-parse --short=8 HEAD)
geth := /go-ethereum/build/bin/geth --datadir=/ethereum
net  ?= testnet
cfg  := geth/config/$(net)

all: deploy

build:
	gcloud container builds submit -t gcr.io/hanzo.ai/geth -t gcr.io/hanzo-ai/geth:$(sha1) geth

deploy: build
	kubectl set image deployment/geth-$(net) geth-$(net)=gcr.io/hanzo-ai/geth:$(sha1)

create: build create-volume create-pod

create-volume:
	kubectl apply -f $(cfg)/sc.yaml
	kubectl apply -f $(cfg)/pvc.yaml
	gcloud compute disks create --size=1000GB --zone=us-central1-a geth-$(net)-disk

create-pod:
	kubectl apply -f $(cfg)/pod.yaml

delete-pod:
	kubectl delete -f $(cfg)/pod.yaml

delete:
	kubectl delete -f $(cfg)/pod.yaml || echo not running
	kubectl delete -f $(cfg)/pvc.yaml || echo not running
	kubectl delete -f $(cfg)/sc.yaml  || echo not running
	gcloud compute disks delete --zone=us-central1-a geth-$(net)-disk

status:
	kubectl get pod geth-$(net) -o yaml

logs:
	kubectl logs geth-$(net) -f

ssh:
	kubectl exec -it geth-$(net) -- /bin/bash

attach:
	kubectl exec -it geth-$(net) -- $(geth) attach

nodeinfo:
	kubectl exec -it geth-$(net) -- $(geth) attach --exec 'admin.nodeInfo'

syncstatus:
	kubectl exec -it geth-$(net) -- $(geth) attach --exec 'eth.syncing'

# Add secret for hanzo-ai gcr.io. This enables our cluster to pull images from
# our shared image repo. This should only be run once after cluster creation.
add-gcr-key:
	kubectl create -f config/secret.yaml
	kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "gcr-secret"}]}'

# Get credentials for kubectl for current cluster
get-credentials:
	gcloud container clusters get-credentials ethereum --zone us-central1-a --project hanzo-ai
