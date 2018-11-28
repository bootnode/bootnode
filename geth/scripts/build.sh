#!/usr/bin/env bash

# Clone geth repo
git clone https://github.com/ethereum/go-ethereum
cd go-ethereum
git checkout v1.8.18

make geth

# Make sure geth is on $PATH
ln -s /go-ethereum/build/bin/geth /bin/geth
