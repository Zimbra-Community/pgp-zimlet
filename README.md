pgp-zimlet
==========

This file is part of the Zimbra OpenPGP Zimlet project.
Copyright (C) 2014  Barry de Graaff

Bugs and feedback: https://github.com/barrydegraaff/pgp-zimlet/issues

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

========================================================================

Zimbra OpenPGP Zimlet

INSTALL INSTRUCTION --- THIS IS A DEVELOPMENT - ALPHA VERSION

su zimbra

cd /tmp

rm tk_barrydegraaff_zimbra_openpgp*

wget https://github.com/barrydegraaff/pgp-zimlet/raw/master/test/tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp.zip

zmzimletctl deploy tk_barrydegraaff_zimbra_openpgp.zip

If you have a LOT of Internet Explorer users, they will see an error message, you can disable this zimlet via COS:

https://github.com/barrydegraaff/pgp-zimlet/blob/master/test/tk_barrydegraaff_zimbra_openpgp/zimlet-cos-for-internet-explorer.png

And then only enable it on a per-user basis.

========================================================================

Known issues

DEALING WITH PUBLIC KEYS LONGER THAN 5120 CHARS

Sometimes people generate public keys that are to long for Zimba to store in zimbraZimletUserProperties.

Saving long pubkeys will trow an warning message, but the key is saved correctly.

To resolve this you can:
A - Ask for a shorter pubkey

B - Ignore the message

C - Edit zimbra-attrs.xml (at your own risk) !MIGRATION?! like this:

   As root:
   nano /opt/zimbra/conf/attrs/zimbra-attrs.xml
   Find the line: 
   name="zimbraZimletUserProperties" type="cstring" max="5120"
   and change it to
   name="zimbraZimletUserProperties" type="cstring" max="15120"
   
   As zimbra:
   zmcontrol restart
