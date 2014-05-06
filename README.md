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

INSTALL INSTRUCTION

Currently the PGP Zimlet for Zimbra runs in dev mode, this because I 
still have to analyze the Zimbra Javascript optimizer 
(That currently breaks openpgp.js).

THIS IS A DEVELOPMENT - ALPHA VERSION

To install

su zimbra
cd $ZIMBRA_HOME/zimlets-deployed/ 
mkdir _dev 
cd _dev 
mkdir tk_barrydegraaff_zimbra_openpgp 
cd tk_barrydegraaff_zimbra_openpgp 
wget https://raw.githubusercontent.com/barrydegraaff/pgp-zimlet/master/test/tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp.xml
wget https://raw.githubusercontent.com/barrydegraaff/pgp-zimlet/master/test/tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp.js
wget https://raw.githubusercontent.com/barrydegraaff/pgp-zimlet/master/test/tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp.css
wget https://raw.githubusercontent.com/barrydegraaff/pgp-zimlet/master/test/tk_barrydegraaff_zimbra_openpgp/icon.png
wget https://raw.githubusercontent.com/barrydegraaff/pgp-zimlet/master/test/tk_barrydegraaff_zimbra_openpgp/openpgp.min.js

