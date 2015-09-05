#!/bin/bash

# This file is part of the Zimbra OpenPGP Zimlet project.
# Copyright (C) 2014-2015  Barry de Graaff
# 
# Bugs and feedback: https://github.com/barrydegraaff/pgp-zimlet/issues
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see http://www.gnu.org/licenses/.


# This script does some checks and creates a zip file for zimlet release

# check number of parameters in command
PARAMS=1
if [ $# -ne "$PARAMS" ]
then
  echo
  echo "Please specify version number, for example: 1.2.3"
  echo
  exit 1
fi



if grep --quiet $1 README.md; then
  echo "OK version number found in README.md" 
else
  echo "FAIL version number not found in README.md" 
  exit 0
fi

if grep --quiet $1 tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp.xml; then
  echo "OK version number found in tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp.xml" 
else
  echo "FAIL version number not found in tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp.xml" 
  exit 0
fi

echo "Make a copy of the source"
rm -Rf /tmp/tk_barrydegraaff_zimbra_openpgp
mkdir /tmp/tk_barrydegraaff_zimbra_openpgp
cp -r -v tk_barrydegraaff_zimbra_openpgp /tmp/

echo "Remove _dev prefix"
grep -lZr -e "_dev/" "/tmp/tk_barrydegraaff_zimbra_openpgp/" | xargs -0 sed -i "s^_dev/^^g"

echo "Build release zip"
cd /tmp/tk_barrydegraaff_zimbra_openpgp
zip -r tk_barrydegraaff_zimbra_openpgp.zip *

rm /tmp/tk_barrydegraaff_zimbra_openpgp.zip
mv /tmp/tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp.zip /tmp/tk_barrydegraaff_zimbra_openpgp.zip
rm -Rf /tmp/tk_barrydegraaff_zimbra_openpgp

echo 'All done, your release zip should be here: /tmp/tk_barrydegraaff_zimbra_openpgp.zip'


exit 0

# choose ^ for seperation of sed command, so ^ cannot be used to search and replace
#The character you put after ’s’ (s being substitute command) determines delimiter you want to use. So you can always specify delimiter that is not contained in your search string to avoid errors, and provide better readability compared to escaping forward slashes. In your case to search for http://www.example.com/oldpage.html and replace it with http://www.example.com/newpage.html you could use ‘_’ as separator:
#sed ’s_http://www.example.com/oldpage.html_http://www.example.com/newpage.html_g’



