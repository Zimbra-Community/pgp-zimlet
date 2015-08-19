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

If you are looking for a version that works with Zimbra 8.0 go here:
https://github.com/barrydegraaff/pgp-zimlet/tree/1.1.5

This Zimlet is not available for use in Zimbra Desktop.

Bugs and feedback: https://github.com/barrydegraaff/pgp-zimlet/issues

========================================================================

### Installing

    su zimbra
    cd /tmp
    rm tk_barrydegraaff_zimbra_openpgp*
    wget https://github.com/barrydegraaff/pgp-zimlet-binaries/raw/master/1.7.5/tk_barrydegraaff_zimbra_openpgp.zip
    zmzimletctl deploy tk_barrydegraaff_zimbra_openpgp.zip
    (wait 15 minutes for the deploy to propagate; or zmprov fc all && zmmailboxdctl restart)

Please be warned, if you undeploy this Zimlet after some time Zimbra will truncate your users preferences (public keys) of this Zimlet.

For debugging in production I recommend to disable the Zimlet via user preferences or via COS.

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

### License

Copyright (C) 2014-2015  Barry de Graaff

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.
