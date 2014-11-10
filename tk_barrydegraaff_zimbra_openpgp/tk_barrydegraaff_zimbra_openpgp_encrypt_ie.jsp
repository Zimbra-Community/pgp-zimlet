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
<script src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp-ie.js"></script>
</head>
<body style="font-family:sans-serif">
<textarea style="display:none" readonly id="publicKeys" rows="20" cols="100"><%= request.getParameter("publicKeys")%></textarea>

<script type="text/javascript">
var openpgp = window.openpgp;
var publicKeys = document.getElementById('publicKeys').value;
var combinedPublicKeys = publicKeys.split("<tk_barrydegraaff_zimbra_openpgp>");

var index;
var result = '<select style="width:100%" id="pubKeySelect" multiple>';

for (index = 0; index < combinedPublicKeys.length; ++index) {
   if(combinedPublicKeys[index]) {
      try {
         entry = openpgp.key.readArmored(combinedPublicKeys[index]);
         userid = entry.keys[0].users[0].userId.userid.replace(/\</g,"&lt;");
         userid = userid.replace(/\>/g,"&gt;") ;
         result = result + '<option value="'+entry.keys[0].armor()+'">'+userid+'</option>';
      } catch (err) { }
   }
};

result = result + '</select>';

function encrypt()
{
   var publicKey = openpgp.key.readArmored(document.getElementById('pubKeySelect').value);
   var pgpMessage = openpgp.encryptMessage(publicKey.keys, document.getElementById('message').value);
   document.getElementById('result').value = pgpMessage;
}

document.write('<table><tr><td colspan="2"><b>Please compose a message below to be encrypted<b><br><br></td></tr><tr><td>Recipient:</td><td>'+result+'</td></tr><tr><td>Message:</td><td><textarea id="message" rows="20" cols="100"></textarea></td></tr><tr><td></td><td><button type="button" onclick="encrypt()">Encrypt</button></td></tr><tr><td>Result:</td><td><textarea id="result" rows="20" cols="100"></textarea></td></tr><tr><td colspan="2">Please copy/paste the result to a new E-mail.</td></tr></table>');

</script>
<br><br><small>Tip: CTRL+W to close this tab.</small>
</body>
</html>
