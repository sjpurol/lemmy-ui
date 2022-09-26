#!/bin/bash
set -e

sudo docker build . --tag sjpurol/lemmy-ui:dev
sudo docker push sjpurol/lemmy-ui:dev
