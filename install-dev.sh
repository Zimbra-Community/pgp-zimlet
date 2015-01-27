#!/bin/bash
rm -Rf /opt/zimbra/zimlets-deployed/_dev/
mkdir /opt/zimbra/zimlets-deployed/_dev/
cp -rv tk_barrydegraaff_zimbra_openpgp/ /opt/zimbra/zimlets-deployed/_dev/
su zimbra -c "/opt/zimbra/bin/zmprov fc all"
