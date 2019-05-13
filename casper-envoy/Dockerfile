FROM envoyproxy/envoy:latest
COPY config /envoy
ADD casper-envoy.crt /etc/casper-envoy.crt
ADD casper-envoy.key /etc/casper-envoy.key
WORKDIR /envoy
