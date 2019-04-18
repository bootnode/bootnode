#!/bin/bash
curl -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"net_version\",\"params\":[],\"id\":67}" localhost:8545
