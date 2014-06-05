Zimbra OpenPGP Zimlet
==========

Now accepting donations for the continued development of this Zimlet please see:

https://www.indiegogo.com/projects/zimbra-openpgp-zimlet-stage-2


Demo video: https://drive.google.com/file/d/0B_lMZlQY3S2lNXJfUjlrMU1faXM/edit?usp=sharing

Adding PGP support to Zimbra Collaboration Suite, currently tested on:
- Windows: Internet Explorer 11, Google Chrome, Chromium, Firefox
- Linux: Google Chrome, Chromium, Firefox, Iceweasel
- OSX: Safari

This Zimlet is developed for and tested with Zimbra version 8.0.7.

Bugs and feedback: https://github.com/barrydegraaff/pgp-zimlet/issues

========================================================================

### Installing

    su zimbra
    cd /tmp
    rm tk_barrydegraaff_zimbra_openpgp*
    wget https://github.com/barrydegraaff/pgp-zimlet-binaries/raw/master/1.0.0/tk_barrydegraaff_zimbra_openpgp.zip
    zmzimletctl deploy tk_barrydegraaff_zimbra_openpgp.zip

Please be warned, if you undeploy this Zimlet after some time Zimbra will truncate your users preferences (public keys) of this Zimlet.

For debugging in production I recommend to disable the Zimlet via user preferences or via COS.

========================================================================

### Esc keyboard shortcut

This Zimlet redefines the behavior of the Escape key. This is done for security reasons.
(Normally when a user hits the Escape key in a dialog, the dialogs gets removed from display,
but the content of the dialog remains in the page source.)

With zimlet deployed:

Login to Zimbra: press Esc => page reloads

Compose new message, press Esc => page reloads


Without zimlet deployed:

Login to Zimbra, press Esc => nothing

Compose new message, press Esc => New message tab closes

========================================================================

### Known issues

### DEALING WITH PUBLIC KEYS LONGER THAN 5120 CHARS

Sometimes people generate public keys that are too long for Zimba to store in zimbraZimletUserProperties.
Saving long pubkeys will trow a warning message, but the key is saved correctly.

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


### DEALING WITH LARGE ENCRYPTED MESSAGES

If you receive a large encrypted message and Zimbra displays "This message is too large to display properly." You cannot
immediately drop your message in the Zimlet. You have to click "View entire message" and drop it onto the Zimlet
again after a minute or so. If you are in a hurry you can copy paste the message text to the text input field in
the decrypt dialog.

### DEALING WITH LARGE ENCRYPTED MESSAGES IN INTERNET EXPLORER

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

Then issue:

    zmmailboxdctl restart

========================================================================

### License

Copyright (C) 2014  Barry de Graaff

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
