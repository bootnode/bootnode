#!/bin/bash

cat /envoy/envoyConfigTemplate.yaml | envsubst \$GRPC_PORT > /envoy/envoyConfig.yaml
envoy $@
