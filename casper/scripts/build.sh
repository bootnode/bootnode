#!/usr/bin/env bash

mkdir /.casperlabs
cd CasperLabs
sbt -mem 5000 client/universal:stage
sbt -mem 5000 node/universal:stage
cd execution-engine
bash -c "source $HOME/.cargo/env; cargo build"

