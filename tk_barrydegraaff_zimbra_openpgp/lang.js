/* When adding a language for translation, you may git clone this file and send a pull request OR
 * just download it using https://raw.githubusercontent.com/barrydegraaff/pgp-zimlet/master/tk_barrydegraaff_zimbra_openpgp/lang.js
 * do your translations and send your copy to info@barrydegraaff.tk 
 * 
 * When editing, please open this file in Geany http://www.geany.org/ or use and UTF-8 aware editor
 * mode = Unix LF
 * encoding = UTF-8
 * Additionally you may wish to translate /help/index.html
 * 
 * New languages will be added to the Zimlet after review.
 */
 
/*
This file is part of the Zimbra OpenPGP Zimlet project.
Copyright (C) 2014-2015  Barry de Graaff

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
*/

tk_barrydegraaff_zimbra_openpgp.prototype.lang = function () {
   tk_barrydegraaff_zimbra_openpgp.lang = [];

   tk_barrydegraaff_zimbra_openpgp.lang['english'] = [];
   tk_barrydegraaff_zimbra_openpgp.lang['english'][0] = 'OpenPGP message extension for Zimbra Collaboration Suite.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][1] = 'Sign message';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][2] = 'Encrypt message';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][3] = 'Manage Keys';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][4] = 'Generate key pair';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][5] = 'Help / About';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][6] = 'Still loading contacts, ignoring your addressbook';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][7] = 'Could not read armored message!';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][8] = 'Please provide private key and passphrase for decryption';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][9] = 'Close';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][10] = 'Version';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][11] = 'Help';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][12] = 'No PGP message detected';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][13] = 'Could not parse your trusted public keys!';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][14] = 'Got a good signature';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][15] = 'Got a BAD signature';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][16] = 'Signed message';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][17] = 'Error verifying signature';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][18] = 'Your private key will remain in memory until you reload your browser.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][19] = 'Private Key';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][20] = 'Passphrase';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][21] = 'Message';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][22] = '<li>Copy-paste ASCII armored keys below. </li><li>You can also use the notes field from contacts added to your Zimbra address book.</li><li>You can put comments before each key as long as you start on a new line for your public key.</li>';   
   tk_barrydegraaff_zimbra_openpgp.lang['english'][23] = 'Language';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][24] = 'If you save your passphrase below it is stored in plain text in the Zimbra LDAP. If you do not store your passphrase the server will ask you to provide it every time it is needed.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][25] = 'If you save your private key below it is stored in your browsers <a href=\"http://diveintohtml5.info/storage.html\" target=\"_blank\" >local storage</a> using AES-256 encryption. If you do not store your private key the server will ask you to provide it for each session.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][26] = 'Public Key';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][27] = 'Scan contacts';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][28] = 'Please compose a message below to be signed with your private key.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][29] = 'Please enter User ID (example: Firstname Lastname &lt;your@email.com&gt;) and passphrase for new key pair.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][30] = 'User ID';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][31] = 'Key length';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][32] = 'Higher key length is better security, but slower.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][33] = 'Store and overwrite current Private Key, Passphrase and Public Key 1.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][34] = 'Generate passphrase';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][35] = 'Recipients';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][36] = 'Please compose a message below to be encrypted. First time users may want to read the';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][37] = 'Optional: Sign your encrypted message by entering private key and passphrase.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][38] = 'Could not parse private key!';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][39] = 'was not signed';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][40] = 'Attachments';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][41] = 'Decrypted message';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][42] = 'original message';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][43] = 'Decryption failed!';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][44] = 'Wrong passphrase!';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][45] = 'Signing failed!';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][46] = 'You must provide a user ID and passphrase';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][47] = 'Now generating your key pair';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][48] = 'Please be patient generating can take some time.<br><br>If you have trouble generating a key pair choose a lower key length or use an external program.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][49] = 'Please make sure to store this information in a safe place';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][50] = 'Your new key pair';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][51] = 'Please select recipient(s).';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][52] = 'Could not encrypt message!';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][53] = 'with OpenPGP';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][54] = 'Please disable your email signature';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][55] = 'Sorry, Zimbra OpenPGP Zimlet does not work well with HTML email signatures. Please disable them for this message like this';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][56] = 'Please compose message first';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][57] = 'OpenPGP scanning contacts completed';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][58] = 'OpenPGP scanning contacts in progress';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][59] = 'Encrypt file';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][60] = 'Decrypt file';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][61] = 'Please select a file to be encrypted.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][62] = 'Optional: Sign your encrypted file by entering private key and passphrase.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][63] = 'Please select a file to be decrypted.';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][64] = 'Decrypt using';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][65] = 'File';
   tk_barrydegraaff_zimbra_openpgp.lang['english'][66] = 'Auto decrypt';
   
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'] = [];
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][0] = 'OpenPGP berichten uitbreiding voor Zimbra Collaboration Suite.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][1] = 'Onderteken bericht';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][2] = 'Versleutel bericht';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][3] = 'Beheer sleutels';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][4] = 'Genereer sleutelpaar';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][5] = 'Help / Over';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][6] = 'Bezig met laden van contacten, adresboek genegeerd';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][7] = 'Fout bij het lezen van gecodeerd bericht!';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][8] = 'Privé sleutel en wachtwoordzin invoeren voor ontsleutelen';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][9] = 'Sluiten';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][10] = 'Versie';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][11] = 'Help';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][12] = 'Geen PGP bericht gedetecteerd';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][13] = 'Kan de lijst met vertrouwde publieke sleutels niet verwerken!';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][14] = 'Ondertekening in orde';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][15] = 'Ondertekening NIET in orde';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][16] = 'Ondertekend bericht';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][17] = 'Fout bij het verifiëren van de ondertekening';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][18] = 'Privé sleutel blijft beschikbaar in het geheugen tot herladen van uw browser.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][19] = 'Privé sleutel';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][20] = 'Wachtwoordzin';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][21] = 'Bericht';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][22] = '<li>Hieronder kunt u ASCII gecodeerde sleutels kopiëren en plakken.</li><li>U kunt ook het notities veld gebruiken in het Zimbra adresboek.</li><li>U kunt ook commentaar bij elke sleutel plaatsen, zolang de sleutel maar begint op een nieuwe regel.</li>';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][23] = 'Taal';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][24] = 'Indien u uw wachtwoordzin hieronder opslaat, wordt deze in platte tekst opgeslagen in de Zimbra LDAP. Indien u uw wachtwoordzin niet opslaat, zal de server hier telkens naar vragen indien nodig.';   
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][25] = 'Indien u hieronder uw privé sleutel opslaat, wordt deze met AES-256 versleuteld en opgeslagen in uw browsers  <a href=\"http://diveintohtml5.info/storage.html\" target=\"_blank\" >lokale opslag</a>. Indien u uw privé sleutel niet opslaat, zal der server hiernaar vragen voor iedere sessie.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][26] = 'Publieke sleutel';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][27] = 'Scan contactpersonen';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][28] = 'Stel uw bericht op om te ondertekenen met uw privé sleutel.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][29] = 'Graag de gebruikers ID invoeren (bijvoorbeeld: Voornaam Achternaam &lt;mijn@email.nl&gt;) en de wachtwoordzin voor nieuw sleutelpaar.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][30] = 'Gebruikers ID';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][31] = 'Sleutel lengte';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][32] = 'Hogere sleutel lengte is veiliger, maar ook langzamer.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][33] = 'Opslaan en overschrijf huidige Privé sleutel, Wachtwoordzin en Publieke sleutel 1.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][34] = 'Genereer wachtwoordzin';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][35] = 'Geadresseerden';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][36] = 'Stel uw bericht op om te versleutelen. Voor nieuwe gebruikers is er de';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][37] = 'Optioneel: Onderteken uw versleuteld bericht door uw privé sleutel en wachtwoordzin in te voeren.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][38] = 'Kan de privé sleutel niet verwerken!';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][39] = 'is niet ondertekend';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][40] = 'Bijlagen';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][41] = 'Ontsleuteld bericht';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][42] = 'origineel bericht';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][43] = 'Ontsleutelen mislukt!';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][44] = 'Wachtwoordzin onjuist!';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][45] = 'Ondertekenen mislukt!';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][46] = 'Gebruikers ID en wachtwoordzin zijn verplicht';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][47] = 'Bezig met genereren van sleutels';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][48] = 'Even geduld a.u.b. genereren kost wat tijd.<br><br>Indien u problemen ondervind met genereren, kunt u een lagere sleutellengte kiezen of een extern programma gebruiken.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][49] = 'Bewaar deze gegevens op een veilige plek';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][50] = 'Uw nieuwe sleutelpaar'
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][51] = 'Selecteer geadresseerde(n).';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][52] = 'Versleuteling van bericht mislukt!';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][53] = 'met OpenPGP';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][54] = 'Zet uw email handtekening uit a.u.b.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][55] = 'Sorry, Zimbra OpenPGP Zimlet werkt niet goed met HTML email handtekeningen. Zet deze uit voor dit bericht zoals in dit voorbeeld';   
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][56] = 'Stel a.u.b. eerst uw bericht op';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][57] = 'OpenPGP scannen van contactpersonen gereed';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][58] = 'OpenPGP bezig met scannen van contactpersonen';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][59] = 'Versleutel bestand';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][60] = 'Ontsleutel bestand';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][61] = 'Selecteer een bestand voor versleutelen.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][62] = 'Optioneel: Onderteken uw versleutelde bestand door uw privé sleutel en wachtwoordzin in te voeren.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][63] = 'Selecteer een bestand voor ontsleutelen.';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][64] = 'Ontsleutel met';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][65] = 'Bestand';
   tk_barrydegraaff_zimbra_openpgp.lang['dutch'][66] = 'Auto decrypt';

   tk_barrydegraaff_zimbra_openpgp.lang['spanish'] = [];
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][0] = 'Extensión de mensajes OpenPGP para Zimbra Collaboration Suite.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][1] = 'Firmar mensaje';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][2] = 'Encriptar mensaje';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][3] = 'Administrar Llaves';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][4] = 'Generar un par de llaves';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][5] = 'Ayuda / Acerca de';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][6] = 'Cargando contactos, se ignorará su Agenda de Contactos';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][7] = '¡No se puede leer el mensaje blindado!';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][8] = 'Por favor, adjunte su llave Privada y su clave para desencriptar';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][9] = 'Cerrar';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][10] = 'Versión';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][11] = 'Ayuda';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][12] = 'No se ha detectado ningún mensaje PGP';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][13] = '¡No se pueden procesar sus llaves públicas de confianza!';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][14] = 'La firma es buena';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][15] = 'La firma es mala';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][16] = 'Mensaje firmado';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][17] = 'Se ha encontrado un error verificando la firma';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][18] = 'Su llave privada se almacenará en memoria hasta que refresque su navegador web.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][19] = 'Llave Privada';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][20] = 'Clave';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][21] = 'Mensaje';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][22] = '<li>Copie-pegue la siguiente llave ASCII blindada. </li><li>Puede usar además el campo notas dentro de sus contactos en su Agenda de Zimbra.</li><li>Puede añadir comentarios antes de cada llave siempre que la llave pública empiece en una nueva línea.</li>';   
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][23] = 'Lenguaje';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][24] = 'Si guarda su clave aquí, se almacenará en texto plano en el LDAP Zimbra. Si no almacena la clave, el servidor le pedirá que la proporcione cada vez que sea necesario.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][25] = 'Si guarda su clave aquí, se almacenará en el almacenamiento local de su navegador usando encriptación AES-256, <a href=\"http://diveintohtml5.info/storage.html\" target=\"_blank\" >más info</a>. Si no almacena su llave privada, el servidor le pedirá que la proporcione en cada nueva sesión.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][26] = 'Llave Pública';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][27] = 'Escanear Contactos';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][28] = 'Por favor, escriba un mensage a continuación que será firmado con su llave Privada.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][29] = 'Por favor, escriba un User ID (ejemplo: Nombre Apellido &lt;your@email.com&gt;) y una clave para el nuevo par de llaves.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][30] = 'User ID';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][31] = 'Longitud de la Llave';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][32] = 'Una longitud más larga de la llave, es más segura, pero más lenta.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][33] = 'Almacene y borre la actual llave Privada, Clave y llave Pública 1.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][34] = 'Generar clave';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][35] = 'Destinatarios';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][36] = 'Por favor, escriba un mensage a continuación que será enciptado. Para usuarios nuevos, quizá quieran leer el';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][37] = 'Opcional: Firme su mensaje encriptado introduciendo su llave Privada y su clave.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][38] = 'No se puede procesar su llave Privada!';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][39] = 'no fué firmado';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][40] = 'Adjuntos';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][41] = 'Mensaje desencriptado';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][42] = 'mensaje original';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][43] = 'Falló la desencriptación!';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][44] = '¡Clave erronea!';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][45] = '¡Falló el firmado!';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][46] = 'Necesita introducir el user ID y la clave';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][47] = 'Generando su par de claves';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][48] = 'Por favor, sea paciente mientras se generan, puede demorar cierto tiempo.<br><br>Si tiene algún problema generando el par de claves, puede seleccionar una clave más corta, o incluso usar un programa externo.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][49] = 'Por favor, guarde esta información en un lugar seguro';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][50] = 'Su nuevo par de Claves';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][51] = 'Por favor seleccione destinataio(s).';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][52] = '¡No se puedo encriptar el mensaje!';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][53] = 'con OpenPGP';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][54] = 'Por favor, deshabilite su firma';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][55] = 'Lo sentimos, el Zimlet Zimbra OpenPGP no funciona muy bien si usted tiene una firma en HTML muy larga en su configuración. Por favor deshabilite esta firma en mensajes de este tipo';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][56] = 'Por favor, escriba un mensaje primero';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][57] = 'OpenPGP ha finalizado el escaneo de contactos satisfactoriamente';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][58] = 'OpenPGP está escaneando los contactos';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][59] = 'Encriptar fichero';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][60] = 'Desencriptar fichero';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][61] = 'Por favor, seleccione el fichero que será encriptado.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][62] = 'Opcional: Firme su fichero encriptado introduciendo su llave Privada y su clave.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][63] = 'Por favor, seleccione el fichero que ser´desencriptado.';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][64] = 'Desencriptar usando';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][65] = 'Fichero';
   tk_barrydegraaff_zimbra_openpgp.lang['spanish'][66] = 'Auto decrypt';
   
   tk_barrydegraaff_zimbra_openpgp.lang['italian'] = [];
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][0] = 'Estensione per messaggi OpenPGP per Zimbra Collaboration Suite.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][1] = 'Firma messaggio';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][2] = 'Cripta messaggio';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][3] = 'Gestisci chiavi';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][4] = 'Genera coppia di chiavi';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][5] = 'Aiuto / Info su';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][6] = 'Contatti ancora in caricamento, rubrica ignorata';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][7] = 'Impossibile leggere messaggio con armatura!';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][8] = 'Per favore fornisci una chiave privata e una passphrase per decriptare';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][9] = 'Chiudi';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][10] = 'Versione';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][11] = 'Aiuto';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][12] = 'Nessun messaggio PGP rilevato';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][13] = 'Impossibile fare il parsing delle tue chiavi pubbliche fidate!';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][14] = 'Trovata una firma valida';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][15] = 'Trovata una firma NON valida';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][16] = 'Messaggio firmato';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][17] = 'Errore nella verifica della firma';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][18] = 'La tua chiave privata rimarr&agrave; in memoria fino al prossimo caricamento della pagina.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][19] = 'Chiave privata';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][20] = 'Passphrase';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][21] = 'Messaggio';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][22] = '<li>Copia ed incolla le chiavi ASCII con armatura qui sotto. </li><li>Puoi anche usare il campo Note del contatto nella tua rubrica.</li><li>Puoi mettere comunque dei commenti prima di ogni chiave, purch&eacute; la chiave pubblica inizi su una nuova linea.</li>';   
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][23] = 'Lingua';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][24] = 'Se salvi la tua passphrase qui sotto verr&agrave; memorizzata in chiaro nell\'LDAP di Zimbra. Se non memorizzi la passphrase ti verr&agrave; richiesta ogni volta.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][25] = 'Se salvi la tua chiave privata qui sotto verr&agrave; memorizzata nel <a href=\"http://diveintohtml5.info/storage.html\" target=\"_blank\" >local storage</a> del tuo browser cifrata in AES-256. Se non memorizzi la chiave privata ti verr&agrave; richiesta ad ogni sessione.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][26] = 'Chiave pubblica';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][27] = 'Scansiona contatti';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][28] = 'Per favore componi il messaggio da firmare con la tua chiave privata qui sotto.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][29] = 'Per favore inserisci l\'ID utente (ad esempio: Nome Cognome &lt;tuo@email.it&gt;) e la passphrase per una nuova coppia di chiavi.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][30] = 'ID utente';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][31] = 'Lunghezza chiave';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][32] = 'Una lunghezza di chiave maggiore corrisponde a maggiore sicurezza, ma minor velocit&agrave;.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][33] = 'Memorizza e sovrascrivi la chiave privata corrente, passphrase e chiave pubblica 1.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][34] = 'Genera passphrase';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][35] = 'Destinatari';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][36] = 'Per favore componi qui sotti il messaggio da criptare. Se &egrave; la prima volta potresti voler leggere l\'';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][37] = 'Opzionale: firma il tuo messaggio criptato inserendo una chiave privata e la passphrase.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][38] = 'Impossibile effettuare il parsing della chiave privata!';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][39] = 'non &egrave; stato firmato';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][40] = 'Allegati';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][41] = 'Messaggio decriptato';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][42] = 'messaggio originale';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][43] = 'Impossibile decriptare!';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][44] = 'Passphrase sbagliata!';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][45] = 'Impossibile firmare!';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][46] = 'Devi fornire un ID utente e una passphrase';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][47] = 'Coppia di chiavi in generazione';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][48] = 'Per favore attendi, la generazione pu&ograve; richiedere molto tempo.<br><br>Se hai problemi nella generazione delle chiavi prova a rifare l\'operazione scegliendo una lunghezza minore per la chiave o ad usare un programma esterno.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][49] = 'Assicurati di memorizzare queste informazioni in una posizione sicura';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][50] = 'La tua nuova coppia di chiavi';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][51] = 'Per favore seleziona il/i destinatario/i.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][52] = 'Impossibile criptare il messaggio!';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][53] = 'con OpenPGP';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][54] = 'Per favore disabilita la firma';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][55] = 'Spiacente ma la zimlet OpenPGP non funziona correttamente con le firme HTML. Per favore disabilita la firma per questo messaggio in questo modo';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][56] = 'Per favore prima componi il messaggio';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][57] = 'Scansione contatti per firme OpenPGP completata';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][58] = 'Scansione contatti per firme OpenPGP in corso';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][59] = 'Cripta file';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][60] = 'Decripta file';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][61] = 'Per favore seleziona un file da criptare.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][62] = 'Opzionale: firma il file criptato inserendo chiave privata e passphrase.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][63] = 'Per favore seleziona un file da decriptare.';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][64] = 'Decripta usando';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][65] = 'File';
   tk_barrydegraaff_zimbra_openpgp.lang['italian'][66] = 'Auto decrypt';

   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'] = [];
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][0] = 'Phần mở rộng thư OpenPGP cho Zimbra Collaboration Suite.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][1] = 'Ký điện tử thư';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][2] = 'Mã hóa thư';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][3] = 'Quản lý khóa';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][4] = 'Sinh cặp khóa';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][5] = 'Trợ giúp / Giới thiệu';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][6] = 'Vẫn đang nạp địa chỉ, bỏ qua sổ địa chỉ';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][7] = 'Không đọc được thư mã!';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][8] = 'Hãy cung cấp khóa bí mật và mật mã để giải mã';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][9] = 'Đóng';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][10] = 'Phiên bản';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][11] = 'Trợ giúp';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][12] = 'Không tìm thấy thư PGP';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][13] = 'Không thể đọc khóa công khai!';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][14] = 'Chữ ký số ĐÚNG';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][15] = 'Chữ ký số SAI';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][16] = 'Thư được ký số';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][17] = 'Lỗi kiểm tra chữ ký số';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][18] = 'Khóa bí mật sẽ tồn tại trong bộ nhớ cho đến khi nạp lại trình duyệt.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][19] = 'Khóa bí mật';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][20] = 'Mật mã';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][21] = 'Thư điện tử';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][22] = '<li>Cắt-dán khóa mã ASCII bên dưới. </li><li>Bạn cũng có thể sử dụng trường Notes trong địa chỉ lưu trong sổ địa chỉ riêng của bạn.</li><li>Bạn có thể đặt ghi chú trên dòng riêng phía trên mỗi khóa công khai.</li>';   
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][23] = 'Ngôn ngữ';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][24] = 'Nếu bạn chọn lưu mật mã bên dưới, mật mã sẽ được lưu dưới dạng văn bản thường trong Zimbra LDAP. Nếu bạn chọn không lưu mật mã, hệ thống sẽ hỏi lại bạn mỗi khi cần.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][25] = 'Nếu bạn chọn lưu khóa bí mật bên dưới, khóa bí mật sẽ được mã hóa kiểu AES-256 và lưu trong <a href=\"http://diveintohtml5.info/storage.html\" target=\"_blank\" >vùng lưu trữ riêng</a> trên trình duyệt trong máy bạn. Nếu bạn chọn không lưu khóa bí mật, hệ thống sẽ hỏi lại trong mỗi phiên làm việc.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][26] = 'Khóa công khai';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][27] = 'Quét địa chỉ';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][28] = 'Hãy ký thư bên dưới với khóa bí mật.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][29] = 'Hãy nhập định danh người sử dụng (ví dụ: Tên Họ &lt;your@email.com&gt;) và mật mã cho cặp khóa mới.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][30] = 'Định danh người sử dụng';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][31] = 'Độ dài khóa';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][32] = 'Độ dài khóa dài hơn sẽ an toàn, nhưng chậm hơn.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][33] = 'Lưu và ghi đè lên khóa bí mật, mật mã và khóa công khai 1 hiện tại.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][34] = 'Sinh mật mã';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][35] = 'Người nhận';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][36] = 'Hãy mã hóa thư bên dưới. Người sử dụng lần đầu có thể muốn đọc';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][37] = 'Tùy chọn: Ký thư mã hóa bằng cách nhập khóa bí mật và mật mã.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][38] = 'Không thể đọc được khóa bí mật!';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][39] = 'đã không được ký';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][40] = 'Tệp đính kèm';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][41] = 'Thư đã giải mã';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][42] = 'thư gốc';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][43] = 'Giải mã thất bại!';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][44] = 'Sai mật mã!';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][45] = 'Ký thất bại!';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][46] = 'Bạn phải cung cấp định danh người sử dụng và mật mã';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][47] = 'Đang sinh cặp khóa';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][48] = 'Hãy kiên nhẫn, sinh khóa có thể mất chút thời gian.<br><br>Nếu bạn gặp vấn đề khi sinh cặp khóa, thử chọn độ dài khóa ngắn hơn hoặc sử dụng công cụ bên ngoài.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][49] = 'Hãy chắc chắn lưu thông tin này vào nơi an toàn';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][50] = 'Cặp khóa mới';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][51] = 'Hãy chọn người nhận.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][52] = 'Không thể mã hóa thư!';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][53] = 'với OpenPGP';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][54] = 'Hãy tắt chữ ký cuối thư';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][55] = 'Xin lỗi, Zimbra OpenPGP Zimlet làm việc không tốt với chữ ký HTML cuối thư. Hãy tắt chữ ký với thư này như thế này';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][56] = 'Hãy tạo thư đầu tiên';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][57] = 'OpenPGP đã hoàn thành quét địa chỉ';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][58] = 'OpenPGP đang quét địa chỉ';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][59] = 'Mã hóa tệp tin';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][60] = 'Giải mã tệp tin';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][61] = 'Hãy chọn tệp tin để mã hóa.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][62] = 'Tùy chọn: Ký tệp tin mã hóa bằng cách nhập khóa bí mật và mật mã.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][63] = 'Hãy chọn tệp tin để giải mã.';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][64] = 'Giải mã bằng';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][65] = 'Tệp tin';
   tk_barrydegraaff_zimbra_openpgp.lang['vietnamese'][66] = 'Auto decrypt';   
}
