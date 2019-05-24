#!/bin/bash

# echo "---------- Starting Execution Engine ----------"
# cd /CasperLabs/execution-engine
# $HOME/.cargo/bin/cargo run --bin casperlabs-engine-grpc-server /.casperlabs/.casper-node.sock &

# echo "---------- Start Bootstrapping Node ----------"
# cd /CasperLabs
# ./node/target/universal/stage/bin/casperlabs-node run -s --server-data-dir /.casperlabs &
# while ! [ -s /.casperlabs/genesis/bonds.txt ]; do
#     sleep 5
# done
# sleep 5
# echo "---------- Finish Bootstrapping Node ----------"
# killall -9 java
# sleep 5
echo "---------- Creating Socket File ----------"

echo "touch /.casperlabs/.casper-node.sock"
touch /.casperlabs/.casper-node.sock

echo "---------- Starting Execution Engine ----------"
cd /CasperLabs/execution-engine

echo "$HOME/.cargo/bin/cargo run --bin casperlabs-engine-grpc-server /.casperlabs/.casper-node.sock &"
$HOME/.cargo/bin/cargo run --bin casperlabs-engine-grpc-server /.casperlabs/.casper-node.sock &

sleep 10

echo "---------- Starting Node ----------"
cd /CasperLabs

# KEY_FILE=$(find /.casperlabs -type f -name *.sk | sort | tail -n 1 | head -n 1)
# CL_VALIDATOR_PUBLIC_KEY=$(echo "$KEY_FILE" | awk -F '[/.]' '{print $(NF-1)}')
# CL_VALIDATOR_PRIVATE_KEY=$(cat "$KEY_FILE")

# echo "./node/target/universal/stage/bin/casperlabs-node run --server-data-dir /.casperlabs --casper-validator-public-key $CL_VALIDATOR_PUBLIC_KEY --casper-validator-private-key $CL_VALIDATOR_PRIVATE_KEY --tls-certificate /.casperlabs/node.certificate.pem --tls-key /.casperlabs/node.key.pem --server-host 0.0.0.0 $@"
# ./node/target/universal/stage/bin/casperlabs-node run --server-data-dir /.casperlabs --casper-validator-public-key $CL_VALIDATOR_PUBLIC_KEY --casper-validator-private-key $CL_VALIDATOR_PRIVATE_KEY --tls-certificate /.casperlabs/node.certificate.pem --tls-key /.casperlabs/node.key.pem --server-host 0.0.0.0 $@

# echo "./node/target/universal/stage/bin/casperlabs-node run --server-data-dir /.casperlabs --casper-validator-public-key 4387a0089d7cbf53493d39923bc182a17edfd70279fdfbd992e97073ffd62bfb --casper-validator-private-key e08d66a68ea53857a61abfd998fb9f741e62f1390788bc3a1dbb0190665bbc3d --tls-certificate /.casperlabs/node.certificate.pem --tls-key /.casperlabs/node.key.pem -b \"casperlabs://09d114f3c82fd081a7a20818aa9ac89789a1303c@13.59.27.228?protocol=40400&discovery=40404\" --server-host $EXTERNAL_IP"
# ./node/target/universal/stage/bin/casperlabs-node run --server-data-dir /.casperlabs --casper-validator-public-key 4387a0089d7cbf53493d39923bc182a17edfd70279fdfbd992e97073ffd62bfb --casper-validator-private-key e08d66a68ea53857a61abfd998fb9f741e62f1390788bc3a1dbb0190665bbc3d --tls-certificate /.casperlabs/node.certificate.pem --tls-key /.casperlabs/node.key.pem -b "casperlabs://09d114f3c82fd081a7a20818aa9ac89789a1303c@13.59.27.228?protocol=40400&discovery=40404" --server-host $EXTERNAL_IP

echo "./node/target/universal/stage/bin/casperlabs-node run --server-use-gossiping --server-data-dir /.casperlabs --casper-validator-public-key f54ed73c39ae8984c44d7cf6462cd5b2c1caca6a5ced726cbb1ef82e214c1b2f  --casper-validator-private-key 2cf8669fe6ba9b38d2dd51dae7f34eda047b9c1a720eb2f6d9172a34e7262cb4 --tls-certificate /.casperlabs/node.certificate.pem --tls-key /.casperlabs/node.key.pem -b \"casperlabs://a7872da15fa8adf08932a67d1c09ff30440d0245@35.238.69.155?protocol=40400&discovery=40404\" --server-host $EXTERNAL_IP $PORTS"
./node/target/universal/stage/bin/casperlabs-node run --server-use-gossiping --server-data-dir /.casperlabs --casper-validator-public-key f54ed73c39ae8984c44d7cf6462cd5b2c1caca6a5ced726cbb1ef82e214c1b2f --casper-validator-private-key 2cf8669fe6ba9b38d2dd51dae7f34eda047b9c1a720eb2f6d9172a34e7262cb4 --tls-certificate /.casperlabs/node.certificate.pem --tls-key /.casperlabs/node.key.pem -b "casperlabs://a7872da15fa8adf08932a67d1c09ff30440d0245@35.238.69.155?protocol=40400&discovery=40404" --server-host $EXTERNAL_IP $PORTS
