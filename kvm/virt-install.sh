#!/bin/bash

# To install using Kickstart:
# For this to work your KVM host and your workstation should be able to resolve 
# webserver1.hivos.nl. You can also use http://192.168.200.24:8081/centos7.cfg

lvcreate -L 11G -n zimbra-dev-disk1 vg_dev

virt-install \
  --connect qemu:///system \
  --hvm \
  --virt-type kvm \
  --network=network:virbr0,model=virtio,mac=52:54:00:d4:22:bf \
  --noautoconsole \
  --name zimbra-dev \
  --disk path=/dev/vg_dev/zimbra-dev-disk1,bus=virtio,cache=none \
  --ram 2048 \
  --vcpus=4\
  --vnc \
  --os-type linux \
  --os-variant rhel6 \
  --location http://ftp.tudelft.nl/centos.org/7/os/x86_64/ \
  -x "ks=https://raw.githubusercontent.com/barrydegraaff/pgp-zimlet/master/kvm/centos7.cfg"
