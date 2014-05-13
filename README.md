pgp-zimlet
==========

Demo video: https://drive.google.com/file/d/0B_lMZlQY3S2lNXJfUjlrMU1faXM/edit?usp=sharing

Adding PGP support to Zimbra Collaboration Suite, currently tested on:
- Windows Internet Explorer 10, 11, Google Chrome, Chromium, Firefox
- Linux, Google Chrome, Chromium, Firefox, Iceweasel
- OSX, Safari

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


DEALING WITH LARGE ENCRYPTED MESSAGES 

If you receive a large encrypted message and Zimbra displays "This message is too large to display properly." You cannot
immediately drop your message in the Zimlet. You have to click "View entire message" and drop it onto the Zimlet
again after a minute or so. If you are in a hurry you can copy paste the message text to the text input field in 
the decrypt dialog.

DEALING WITH LARGE ENCRYPTED MESSAGES IN INTERNET EXPLORER

All the above and you must change, as root:

nano /opt/zimbra/jetty-distribution-[buildnumber here]/etc/jetty.xml

nano /opt/zimbra/jetty-distribution-[buildnumber here]/etc/jetty.xml.in

And add:

 <Call name="setAttribute">
    <Arg>org.eclipse.jetty.server.Request.maxFormContentSize</Arg>
    <Arg>2000000</Arg>
  </Call>
  
Under: 

<Configure id="Server" class="org.eclipse.jetty.server.Server">

Then issue: zmmailboxdctl restart


