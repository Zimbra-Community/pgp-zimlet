#!/bin/bash

# install using Kickstart:
# For this to work your KVM host and your workstation should be able to resolve 
# and connect to https://raw.githubusercontent.com

lvcreate -L 11G -n zimbra-dev-disk1 vg_dev

virt-install \
  --connect qemu:///system \
  --hvm \
  --virt-type kvm \
  --network=default,model=virtio,mac=52:54:00:93:28:27 \
  --noautoconsole \
  --name windows7 \
  --disk path=/dev/vg_dev/windows7-disk1,bus=ide,cache=none \
  --ram 2048 \
  --vcpus=4\
  --vnc \
  --os-type windows \
  --os-variant win7 \
  --cdrom /dev/sr0
  --location http://ftp.tudelft.nl/centos.org/7/os/x86_64/ \
  -x "ks=https://raw.githubusercontent.com/barrydegraaff/pgp-zimlet/master/kvm/centos7.cfg"
