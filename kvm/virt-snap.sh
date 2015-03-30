#!/bin/bash

virsh destroy zimbra-dev
virsh undefine zimbra-dev

lvremove -f /dev/vg_dev/zimbra-dev-snap

lvcreate -L5G -s -n /dev/vg_dev/zimbra-dev-snap /dev/vg_dev/zimbra-dev-disk1

virt-install \
--connect qemu:///system \
--hvm \
--virt-type kvm \
--network=default,model=virtio,mac=52:54:00:d4:22:bf \
--noautoconsole \
--name zimbra-dev \
--disk path=/dev/vg_dev/zimbra-dev-snap,bus=virtio,cache=none \
--ram 2048 \
--vcpus=4 \
--vnc \
--os-type linux \
--os-variant rhel6 \
--import

