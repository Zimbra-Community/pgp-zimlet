#!/bin/bash

# This file is part of the Zimbra OpenPGP Zimlet project.
# Copyright (C) 2014-2016  Barry de Graaff
# 
# Bugs and feedback: https://github.com/Zimbra-Community/pgp-zimlet/issues
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see http://www.gnu.org/licenses/.

# This script checks for language strings and counts the number of times they are used
# a 0 count indicates that some clean-up may needed

echo
echo This script checks for language strings and counts the number of times they are used a 0 count indicates that some clean-up may needed
echo
echo string count
 

for i in {1..100}; do 
echo -n $i ' '; 
cat tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp.js | grep "tk_barrydegraaff_zimbra_openpgp.lang\[tk_barrydegraaff_zimbra_openpgp.settings\['language'\]\]\[$i\]" | wc -l

done
