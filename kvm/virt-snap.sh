#!/bin/bash

virsh destroy zimbra-dev
virsh undefine zimbra-dev

lvremove -f /dev/fedorab/zimbra-dev-snap

lvcreate -L10G -s -n /dev/fedorab/zimbra-dev-snap /dev/fedorab/zimbra-dev-disk1

virt-install \
--connect qemu:///system \
--hvm \
--virt-type kvm \
--network=default,model=virtio,mac=52:54:00:d4:22:bf \
--noautoconsole \
--name zimbra-dev \
--disk path=/dev/fedorab/zimbra-dev-snap,bus=virtio,cache=none \
--ram 8000 \
--vcpus=4 \
--vnc \
--os-type linux \
--os-variant rhel7.0 \
--import

