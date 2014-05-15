<%/*
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

Zimbra caches jsp files that will persist until you issue:
zmmailboxdctl restart
Normal cache flush does NOT work 
*/
%><!DOCTYPE html>
<html><head>
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Zimbra OpenPGP Zimlet</title>
<script src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.js"></script>
</head>
<body style="font-family:sans-serif">
<textarea style="display:none" readonly id="message" rows="20" cols="100"><%= request.getParameter("message")%></textarea>
<textarea style="display:none" readonly id="publicKeys" rows="20" cols="100"><%= request.getParameter("publicKeys")%></textarea>

<script type="text/javascript">   
var openpgp = window.openpgp;
var publicKeys = document.getElementById('publicKeys').value;
var combinedPublicKeys = publicKeys.split("<tk_barrydegraaff_zimbra_openpgp>");
try {
var message = openpgp.cleartext.readArmored(document.getElementById('message').value);
} catch (err) { }

var result = 0;
var index;

for (index = 0; index < combinedPublicKeys.length; ++index) {
   if(combinedPublicKeys[index]) {
      try {
      keyObj= openpgp.key.readArmored(combinedPublicKeys[index]);
      } catch (err) { }
      result += do_verify(message, keyObj.keys);
   }
};

if(result > 0) {
   document.write("<b>Got a good signature.</b>");
   document.body.style.backgroundColor="#00ff00";
}
else {
   document.write("<b>Got a BAD signature.</b>");
   document.body.style.backgroundColor="#ff0000";
};

/* do_verify method calls openpgp.verifyClearSignedMessage, returns boolean 1 for good signature or 0 for bad signature
 * */
function do_verify (message, keyObj) {
   try {
      var verified = openpgp.verifyClearSignedMessage(keyObj, message);
   }
   catch(err) {
     return 0;
   }

   try {
      if(verified.signatures[0].valid==true) {
         return 1;
      }
   }
   catch(err) {  
      return 0;
   } 
};

</script>   
<br><br><small>Tip: CTRL+W to close this tab.</small>
</body>
</html>
