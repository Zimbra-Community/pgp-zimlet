Zimbra OpenPGP Zimlet
==========

If you find Zimbra OpenPGP Zimlet useful and want to support its continued development, you can make donations via:
- PayPal: info@barrydegraaff.tk
- Bitcoin: 1BaRRyS7wvGarEGgDwmPgRCygzcvocyxJt
- Bank transfer: IBAN NL55ABNA0623226413 ; BIC ABNANL2A

Demo video: https://drive.google.com/a/barrydegraaff.tk/file/d/0B_lMZlQY3S2lR2FaUjdlR1hCQW8/view

User manual: http://htmlpreview.github.io/?https://github.com/barrydegraaff/pgp-zimlet/blob/master/tk_barrydegraaff_zimbra_openpgp/help/index.html

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
    wget https://github.com/barrydegraaff/pgp-zimlet-binaries/raw/master/1.3.8/tk_barrydegraaff_zimbra_openpgp.zip
    zmzimletctl deploy tk_barrydegraaff_zimbra_openpgp.zip
    (wait 15 minutes for the deploy to propagate; or zmprov fc all)

Please be warned, if you undeploy this Zimlet after some time Zimbra will truncate your users preferences (public keys) of this Zimlet.

For debugging in production I recommend to disable the Zimlet via user preferences or via COS.

========================================================================

### About private key security

When you generate a private key with this zimlet or copy-paste it when signing or decrypting, it is NOT being send to the server and it is NOT stored on the server.

As of version 1.2.4 you can optionally store your private key in your browsers local storage. If you do not store your private key the server will ask you to provide it for each session. Also you can optionally store your passphrase to the Zimbra server. If you do not store your passphrase the server will ask you to provide it every time it is needed.

========================================================================

### DEALING WITH LARGE ENCRYPTED MESSAGES

If you receive a large encrypted message and Zimbra displays "This message is too large to display properly." 
You have to click "View entire message" and then drag/drop it onto the Zimlet again after a minute or so. 

========================================================================

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
