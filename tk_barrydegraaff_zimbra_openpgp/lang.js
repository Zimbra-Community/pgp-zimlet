/* When adding a language for translation, you may git clone and copy paste a language (.properties) file.
* Do your translations and send your copy to lorenzo.milesi@yetopen.it
* 
* When editing, please open files in Geany http://www.geany.org/ or use and UTF-8 aware editor
* mode = Unix LF
* Unicode needs conversion see: http://itpro.cz/juniconv/
* Additionally you may wish to translate /help/index.html
* 
* New languages will be added to the Zimlet after review.
*/

/*
This file is part of the Zimbra OpenPGP Zimlet project.
Copyright (C) 2014-2016 Barry de Graaff

Bugs and feedback: https://github.com/Zimbra-Community/pgp-zimlet/issues

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see http://www.gnu.org/licenses/.
*/


OpenPGPZimlet.prototype.lang = function () {
   var english = [];
   english[0] = 'OpenPGP message extension for Zimbra Collaboration Suite.';
   english[1] = 'Sign message';
   english[2] = 'Encrypt message';
   english[3] = 'Manage Keys';
   english[4] = 'Generate key pair';
   english[5] = 'Help / About';
   english[6] = 'Still loading contacts, ignoring your addressbook';
   english[7] = 'Could not read armored message!';
   english[8] = 'Please provide private key and passphrase for decryption';
   english[9] = 'Close';
   english[10] = 'Version';
   english[11] = 'Help';
   english[12] = 'No PGP message detected';
   english[13] = 'Could not parse your trusted public keys!';
   english[14] = 'Got a good signature';
   english[15] = 'Got a BAD signature';
   english[16] = 'Signed message';
   english[17] = 'Error verifying signature';
   english[18] = 'Your private key will remain in memory until you reload your browser.';
   english[19] = 'Private Key';
   english[20] = 'Passphrase';
   english[21] = 'Message';
   english[22] = '<li>Copy-paste ASCII armored keys below. </li><li>You can also use the notes field from contacts added to your Zimbra address book.</li><li>You can put comments before each key as long as you start on a new line for your public key.</li>'; 
   english[23] = 'Language';
   english[24] = 'If you save your passphrase below it is stored in plain text in the Zimbra LDAP. If you do not store your passphrase the server will ask you to provide it every time it is needed.';
   english[25] = 'If you save your private key below it is stored in your browsers <a href=\"http://diveintohtml5.info/storage.html\" target=\"_blank\" >local storage</a> using AES-256 encryption. If you do not store your private key the server will ask you to provide it for each session.';
   english[26] = 'Public Key';
   english[27] = 'Scan contacts';
   english[28] = '';
   english[29] = 'Please provide your name, email address and passphrase for new key pair.';
   english[30] = 'User ID';
   english[31] = 'Key length';
   english[32] = 'Higher key length is better security, but slower.';
   english[33] = 'Store and overwrite current Private Key, Passphrase and Public Key 1.';
   english[34] = 'Generate passphrase';
   english[35] = 'Recipients';
   english[36] = 'First time users may want to read the';
   english[37] = 'Optional: Sign your encrypted message by entering private key and passphrase.';
   english[38] = 'Could not parse private key!';
   english[39] = 'was not signed';
   english[40] = 'Attachments';
   english[41] = 'Decrypted message';
   english[42] = 'original message';
   english[43] = 'Decryption failed!';
   english[44] = 'Wrong passphrase!';
   english[45] = 'Signing failed!';
   english[46] = 'You must provide a name, email address and passphrase';
   english[47] = 'Now generating your key pair';
   english[48] = 'Please be patient generating can take some time.<br><br>If you have trouble generating a key pair choose a lower key length or use an external program.';
   english[49] = 'Please make sure to store this information in a safe place';
   english[50] = 'Your new key pair';
   english[51] = 'Please select recipient(s).';
   english[52] = 'Could not encrypt message!';
   english[53] = 'with OpenPGP';
   english[54] = 'Print';
   english[55] = 'show/hide';
   english[56] = 'Please compose message first';
   english[57] = '';
   english[58] = '';
   english[59] = 'Encrypt file';
   english[60] = 'Decrypt file';
   english[61] = 'Enable multiple private keys';
   english[62] = '';
   english[63] = '';
   english[64] = 'Decrypt using';
   english[65] = 'File';
   english[66] = 'Auto decrypt';
   english[67] = 'Forget all other public keys (set new AES password)';
   english[68] = 'ZmSetting MAX_MESSAGE_SIZE';
   english[69] = 'Advanced settings';
   english[70] = 'Please format as plain text and try again.'; 
   english[71] = 'Store passphrase in browsers local storage';
   english[72] = 'This should be your own public key, it is selected by default when encrypting.'; 
   english[73] = 'Import public key'; 
   english[74] = 'Do you wish to import this public key? Please <a target="_blank" href="https://barrydegraaff.github.io/help/#fingerprint">verify the fingerprint</a>.'; 
   english[75] = 'Imported';
   english[76] = 'Failed to import this public key';
   english[77] = 'Send someone my public key';
   english[78] = 'Public key already in your list of trusted keys';
   english[79] = 'Name';
   english[80] = 'Email address';
   english[81] = 'You can specify multiple email addresses, separated by comma (,)';
   english[82] = 'Reply';
   english[83] = 'Reply All';
   english[84] = '<b>WARNING: DO NOT SEND YOUR PRIVATE KEY VIA EMAIL!! <br>Click <span style="color: red">CANCEL</span>!!</b><br><br>Perhaps you wanted to send your public key?';
   english[85] = '<b>WARNING: DO NOT SEND YOUR PRIVATE KEY VIA EMAIL!!</b>';
   english[86] = 'Submit to keyserver';
   english[87] = 'Keyserver lookup';
   english[88] = 'Search';

   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_zimbra_openpgp').handlerObject;
   OpenPGPZimlet.lang = [];
   for (i = 0; i < 100; i++) {
         OpenPGPZimlet.lang[i] = zimletInstance.getMessage(i.toString());
   }
   
   if(OpenPGPZimlet.lang[1].indexOf('???') == 0)
   {
      //Seems we are running from dev folder on the server, but not passed ?dev=1 in the browser, fallback to english
      OpenPGPZimlet.lang = english;            
   }}
