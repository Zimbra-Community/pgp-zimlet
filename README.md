Zimbra OpenPGP Zimlet
==========

If you find Zimbra OpenPGP Zimlet useful and want to support its continued development, you can make donations via:
- PayPal: info@barrydegraaff.tk
- Bank transfer: IBAN NL55ABNA0623226413 ; BIC ABNANL2A

Demo video: https://www.youtube.com/watch?v=APLFSEO7QXg

User manual: https://barrydegraaff.github.io/help/

Adding PGP support to Zimbra Collaboration Suite, currently tested on:
- Windows: Internet Explorer 11, Google Chrome, Chromium, Firefox
- Linux: Google Chrome, Chromium, Firefox, Iceweasel
- OSX: Safari

This Zimlet ONLY WORKS with Zimbra version 8.5 and above.

This Zimlet is not available for use in Zimbra Desktop.

Bugs and feedback: https://github.com/Zimbra-Community/pgp-zimlet/issues

========================================================================

### Install Zimbra OpenPGP Zimlet

The recommended method is to deploy using git. (I no longer support zmzimletctl, although that still works.)

    [root@myzimbra ~]# su zimbra
    [zimbra@myzimbra ~]# zmzimletctl undeploy tk_barrydegraaff_zimbra_openpgp
    [zimbra@myzimbra ~]# exit
    [root@myzimbra ~]# yum install -y git 
    [root@myzimbra ~]# apt-get -y install git
    [root@myzimbra ~]# cd ~
    [root@myzimbra ~]# rm pgp-zimlet -Rf
    [root@myzimbra ~]# git clone https://github.com/Zimbra-Community/pgp-zimlet
    [root@myzimbra ~]# cd pgp-zimlet
    [root@myzimbra pgp-zimlet]# git checkout 2.0.1
    [root@myzimbra pgp-zimlet]# chmod +rx install-dev.sh
    [root@myzimbra pgp-zimlet]# ./install-dev.sh
    [root@myzimbra pgp-zimlet]# su zimbra
    [zimbra@myzimbra pgp-zimlet] zmprov mc default zimbraPrefZimletTreeOpen TRUE
    [zimbra@myzimbra pgp-zimlet] zmcontrol restart
    
Please be warned, if you undeploy this Zimlet after some time Zimbra will truncate your users preferences (public keys) of this Zimlet.

========================================================================

### About private key security

When you generate a private key with this zimlet or copy-paste it when signing or decrypting, it is NOT being send to the server and it is NOT stored on the server.

As of version 1.2.4 you can optionally store your private key in your browsers local storage. If you do not store your private key the server will ask you to provide it for each session. Also you can optionally store your passphrase to the Zimbra server. If you do not store your passphrase the server will ask you to provide it every time it is needed.

As of version 1.5.8 your private key is automatically encrypted with AES-256 when stored in your browsers local storage.

========================================================================

### An unknown error (account.INVALID_ATTR_VALUE) has occurred.

When storing public keys > 5120 in ZCS 8.6:

As root:

    nano /opt/zimbra/conf/attrs/zimbra-attrs.xml
    Find the line: name="zimbraZimletUserProperties" type="cstring" max="5120"
    and change it to: name="zimbraZimletUserProperties" type="cstring" max="15120"
    then as user zimbra: zmcontrol restart

"zimbraZimletUserProperties" will be increased by default in ZCS 8.7

### This zimlet does not work when composing in a new window
See: https://bugzilla.zimbra.com/show_bug.cgi?id=97496


### License

Copyright (C) 2014-2016  Barry de Graaff

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.
