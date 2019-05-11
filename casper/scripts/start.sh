#!/bin/bash

echo "---------- Starting Execution Engine ----------"
cd /CasperLabs/execution-engine
$HOME/.cargo/bin/cargo run --bin casperlabs-engine-grpc-server /.casperlabs/.casper-node.sock &
echo "---------- Start Bootstrapping Node ----------"
cd /CasperLabs
./node/target/universal/stage/bin/casperlabs-node run -s --server-data-dir /.casperlabs &
while ! [ -s /.casperlabs/genesis/bonds.txt ]; do
    sleep 5
done
sleep 5
echo "---------- Finish Bootstrapping Node ----------"
killall -9 java
sleep 5
echo "---------- Starting Node ----------"
KEY_FILE=$(find /.casperlabs -type f -name *.sk | sort | tail -n 1 | head -n 1)
CL_VALIDATOR_PUBLIC_KEY=$(echo "$KEY_FILE" | awk -F '[/.]' '{print $(NF-1)}')
CL_VALIDATOR_PRIVATE_KEY=$(cat "$KEY_FILE")

echo "./node/target/universal/stage/bin/casperlabs-node run --server-data-dir /.casperlabs --casper-validator-public-key $CL_VALIDATOR_PUBLIC_KEY --casper-validator-private-key $CL_VALIDATOR_PRIVATE_KEY --tls-certificate /.casperlabs/node.certificate.pem --tls-key /.casperlabs/node.key.pem --server-host 0.0.0.0 $@"

./node/target/universal/stage/bin/casperlabs-node run --server-data-dir /.casperlabs --casper-validator-public-key $CL_VALIDATOR_PUBLIC_KEY --casper-validator-private-key $CL_VALIDATOR_PRIVATE_KEY --tls-certificate /.casperlabs/node.certificate.pem --tls-key /.casperlabs/node.key.pem --server-host 0.0.0.0 $@
