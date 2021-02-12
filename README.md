Zimbra OpenPGP Zimlet
==========

Demo video: https://youtu.be/-fMe5Xab11Y

User manual: https://zetalliance.org/pgp-zimlet/

Feature list: https://github.com/Zimbra-Community/pgp-zimlet/wiki

Adding PGP support to Zimbra Collaboration Suite, currently tested on:
- Windows: Google Chrome, Chromium, Firefox
- Linux: Google Chrome, Chromium, Firefox
- MacOS OSX: Google Chrome, Safari

This Zimlet ONLY WORKS with Zimbra version 8.8.15 and above.

This Zimlet is not available for use in Zimbra Desktop.

Bugs and feedback: https://github.com/Zimbra-Community/pgp-zimlet/issues

Report security issues to info@barrydegraaff.tk (PGP fingerprint: 97f4694a1d9aedad012533db725ddd156d36a2d0)


========================================================================

### Install Zimbra OpenPGP Zimlet

    [root@myzimbra ~]# rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_zimbra_openpgp/
    [root@myzimbra ~]# su zimbra       
    [zimbra@myzimbra ~] wget https://github.com/Zimbra-Community/pgp-zimlet/releases/download/2.7.6/tk_barrydegraaff_zimbra_openpgp.zip -O /tmp/tk_barrydegraaff_zimbra_openpgp.zip
    [zimbra@myzimbra ~] zmzimletctl deploy /tmp/tk_barrydegraaff_zimbra_openpgp.zip
    [zimbra@myzimbra ~] zmmailboxdctl restart

With translations support:

- https://github.com/Zimbra-Community/pgp-zimlet/wiki/Install-via-zmzimletctl

Without translations support:

- https://github.com/Zimbra-Community/pgp-zimlet/wiki/Install-from-git

========================================================================

### `***UNCHECKED***` gets added to the subject of encrypted mail

    As root su to the root.
    nano /opt/zimbra/common/sbin/amavisd
    or if you are on 8.6 and before: 
    nano /opt/zimbra/amavisd/sbin/amavisd
    
    change the line:
    $undecipherable_subject_tag = '***UNCHECKED*** ';
    to:
    $undecipherable_subject_tag = '';
     
    As zimbra:
    zmamavisdctl restart
    
========================================================================

### About private key security

When you generate a private key with this zimlet or copy-paste it when signing or decrypting, it is NOT being sent to the server and it is NOT stored on the server.

As of version 1.2.4 you can optionally store your private key in your browsers local storage. If you do not store your private key the server will ask you to provide it for each session. Also you can optionally store your passphrase to the Zimbra server. If you do not store your passphrase the server will ask you to provide it every time it is needed.

As of version 1.5.8 your private key is automatically encrypted with AES-256 when stored in your browsers local storage.

========================================================================

### An unknown error (account.INVALID_ATTR_VALUE) has occurred.

When storing public keys > 5120 in ZCS 8.6:

As root:

    nano /opt/zimbra/conf/attrs/zimbra-attrs.xml
    Find the line: name="zimbraZimletUserProperties" type="cstring" max="5120"
    and change it to: name="zimbraZimletUserProperties" type="cstring" max="51200"
    then as user zimbra: zmcontrol restart

"zimbraZimletUserProperties" will be increased by default in ZCS 8.7 (to 51200)

### Keyserver lookup
As of version 2.2.6 keyserver lookup is supported, the admin can set the keyserver to be queried in:

    nano /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_zimbra_openpgp/config_template.xml
    <property name="keyserver">https://sks-keyservers.net</property>

If you can use your keyserver from a browser, but not from the Zimlet (0 undefined response), you may need to enable CORS. See: http://enable-cors.org/server.html and https://github.com/Zimbra-Community/pgp-zimlet/issues/205

### X-Mailer header for Thunderbird/Enigmail support
Thunderbird/Enigmail has some built in hacks to support email servers that do not support pgp/mime. Unfortunately that means that Zimbra OpenPGP Zimlet is identified wrongly as being Exchange server. This is fixed in Enigmail version 1.9.2. For compatibilty the X-Mailer header `X-Mailer: ... ZimbraWebClient ...` should be present in outgoing email. The sending of X-Mailer is enabled by default. If you changed the default you have to re-enable it using `zmprov mcf zimbraSmtpSendAddMailer "TRUE";`.

See: https://sourceforge.net/p/enigmail/bugs/600/

### This zimlet does not work when composing in a new window
See: https://bugzilla.zimbra.com/show_bug.cgi?id=97496


### License

Copyright (C) 2014-2020  Barry de Graaff

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
