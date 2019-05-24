FROM envoyproxy/envoy:latest
COPY config /envoy
COPY scripts /scripts
RUN apt-get update
RUN apt-get install gettext-base -y
ADD casper-envoy.crt /etc/casper-envoy.crt
ADD casper-envoy.key /etc/casper-envoy.key
WORKDIR /envoy
