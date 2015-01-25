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

//Constructor
tk_barrydegraaff_zimbra_openpgp = function() {
   tk_barrydegraaff_zimbra_openpgp.privateKeyCache='';
   tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys = []; 
   tk_barrydegraaff_zimbra_openpgp.prototype.settings = {};
   
   //openpgp.js cannot be included via zimlet xml definition, 
   //will fail to work after deploy using zmzimletctl deploy
   var oHead = document.getElementsByTagName('HEAD').item(0);
   var oScript= document.createElement("script");
   oScript.type = "text/javascript";
   oScript.src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.js";
   oHead.appendChild( oScript);
};

tk_barrydegraaff_zimbra_openpgp.prototype = new ZmZimletBase;
tk_barrydegraaff_zimbra_openpgp.prototype.constructor = tk_barrydegraaff_zimbra_openpgp;

tk_barrydegraaff_zimbra_openpgp.prototype.toString =
function() {
   return "tk_barrydegraaff_zimbra_openpgp";
};

/* This method gets called when Zimbra Zimlet framework initializes
 */
tk_barrydegraaff_zimbra_openpgp.prototype.init = function() {
   tk_barrydegraaff_zimbra_openpgp.version=this._zimletContext.version;

   //Per user configuration options are jsonified from a single Zimbra userProperty
   try {
      tk_barrydegraaff_zimbra_openpgp.prototype.settings = JSON.parse(this.getUserProperty("zimbra_openpgp_options"));         
   } 
   catch(err) {   
      //Load default values
      tk_barrydegraaff_zimbra_openpgp.prototype.settings['enable_contacts_scanning'] = 'false';
   } 
   tk_barrydegraaff_zimbra_openpgp.prototype.readAddressBook();
};

/* The Zimlet API does not provide an onContactSave event, but we need to read the address book on changes.
 * So we combine onContactEdit and onShowView to have an event when a user edits the address book.
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.onContactEdit = function (view, contact, elementId) {
   tk_barrydegraaff_zimbra_openpgp.prototype.editAddressBookEvent = true;
}

tk_barrydegraaff_zimbra_openpgp.prototype.onShowView = function (view) {
   if ((tk_barrydegraaff_zimbra_openpgp.prototype.editAddressBookEvent == true) && ( view.indexOf('CN') < 0 ))
   {
      tk_barrydegraaff_zimbra_openpgp.prototype.editAddressBookEvent = false;
      tk_barrydegraaff_zimbra_openpgp.prototype.readAddressBook();
   }
}

/*This method is called when a message is viewed in Zimbra
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.onMsgView = function (msg, oldMsg, view) {
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
   
   if (tk_barrydegraaff_zimbra_openpgp.prototype.addressBookReadInProgress == true)
   {
      this.status("Still loading contacts, ignoring your addressbook", ZmStatusView.LEVEL_INFO);   
   }
   
   var bp = msg.getBodyPart(ZmMimeTable.TEXT_PLAIN);
   if (!bp)
   {
     //not a plain text message, means no PGP
     return;
   }
   var msg = bp.node.content;
   var msgSearch = msg.substring(0,60);
   
   if(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
   {
      console.log(msg);
   }

    if (msgSearch.indexOf("BEGIN PGP SIGNED MESSAGE") > 0 ) {          
      try {
         var message = openpgp.cleartext.readArmored(msg);
      }
      catch(err) {
         this.status("Could not read armored message!", ZmStatusView.LEVEL_CRITICAL);
         return;
      }
      this.verify(message);
   }
   else if (msgSearch.indexOf("BEGIN PGP MESSAGE") > 0 ) {
      this.displayDialog(1, "Please provide private key and passphrase for decryption", msg);
   }
   else {
      return;
   }   
};   

/* This method gets called by the Zimlet framework when single-click is performed.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.singleClicked =
function() {   
   if(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
   {
   } 
};

/* This method creates a Zimbra tab
 * - currently hardcoded to provide help
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.appLaunch =
function(appName) {
   var app = appCtxt.getApp(appName);
   app.setContent('<iframe style="width:100%; height:100%; border:0px;" src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/help/index.html">');

   var toolbar = app.getToolbar(); // returns ZmToolBar
   toolbar.setContent("<button style='margin:10px;' onclick='tk_barrydegraaff_zimbra_openpgp.prototype._resetApp()'>Close</button> <b>OpenPGP version: " + tk_barrydegraaff_zimbra_openpgp.version + "</b><br><br>");
};

/* This method destroys the Zimlet tab
 */
tk_barrydegraaff_zimbra_openpgp.prototype._resetApp=
function(appName) {
	app = appCtxt.getCurrentApp();
	app.reset(false) ;
	appCtxt.getAppController().activateApp("Mail") ;	
	appCtxt.getAppChooser().getButton(tk_barrydegraaff_zimbra_openpgp.openPGPApp).setVisible(false);
}   

/* This method gets called by the Zimlet framework when double-click is performed.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.doubleClicked =
function() {
	this.displayDialog(3, "Manage keys", null);
};

/* Context menu handler
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.menuItemSelected =
function(itemId) {
	switch (itemId) {
	case "sign":
      this.displayDialog(4, "Sign message", null);
		break;
	case "encrypt":
      this.displayDialog(6, "Encrypt message", null);
		break;
	case "pubkeys":
      this.displayDialog(3, "Manage keys", null);
		break;
	case "keypair":
      this.displayDialog(5, "Generate new key pair", null);
		break;
	case "help":
      tk_barrydegraaff_zimbra_openpgp.openPGPApp = this.createApp('OpenPGP Help', "tk_barrydegraaff_zimbra_openpgp-panelIcon", "Encrypt/Decrypt messages with OpenPGP");
      var app = appCtxt.getApp(tk_barrydegraaff_zimbra_openpgp.openPGPApp);	
      app.launch();      
		break;
   case "help-new":
      window.open("/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/help/index.html");
      break;
   }
};

/* doDrop handler for verify and decrypt messages
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.doDrop =
function(zmObject) {
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');

   if (tk_barrydegraaff_zimbra_openpgp.prototype.addressBookReadInProgress == true)
   {
      this.status("Still loading contacts, ignoring your addressbook", ZmStatusView.LEVEL_INFO);   
   }

   var msgObj = zmObject.srcObj;

   //if its a conversation i.e. "ZmConv" object, get the first loaded message "ZmMailMsg" object within that.
   if (zmObject.type == "CONV") {
      msgObj  = zmObject.getFirstHotMsg();
   }

   var clearSignedRegEx = new RegExp('[\-]*BEGIN PGP SIGNATURE[\-]*');
   var pgpMessageRegEx = new RegExp('[\-]*BEGIN PGP MESSAGE[\-]*');
   var msg = zmObject.body;
   
   if(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
   {
      console.log(zmObject);
      console.log(msgObj);
      console.log(msg);
   }

    if (msg.match(clearSignedRegEx)) {
      try {
         var message = openpgp.cleartext.readArmored(msg);
      }
      catch(err) {
         this.status("Could not read armored message!", ZmStatusView.LEVEL_CRITICAL);
         return;
      }
      this.verify(message);
   }
   else if (msg.match(pgpMessageRegEx)) {
      this.displayDialog(1, "Please provide private key and passphrase for decryption", msg);
   }
   else {
      this.status("No PGP message detected.", ZmStatusView.LEVEL_WARNING);
      return;
   }   
};

/* verify method checks against known public keys and
 * will update the status bar with the result (good/bad signature).
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.verify = function(message) {
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
   try {
      var publicKeys1 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value);
      var publicKeys2 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys2").value);
      var publicKeys3 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys3").value);
      var publicKeys4 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys4").value);
      var publicKeys5 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys5").value);
      var publicKeys6 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys6").value);
      var publicKeys7 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys7").value);
      var publicKeys8 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys8").value);
      var publicKeys9 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys9").value);
      var publicKeys10 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys10").value);
      var publicKeys11 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys11").value);
      var publicKeys12 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys12").value);
      var publicKeys13 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys13").value);
      var publicKeys14 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys14").value);
      var publicKeys15 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys15").value);
      var publicKeys16 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys16").value);
      var publicKeys17 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys17").value);
      var publicKeys18 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys18").value);
      var publicKeys19 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys19").value);
      var publicKeys20 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys20").value);
      var publicKeys21 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys21").value);
      var publicKeys22 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys22").value);
      var publicKeys23 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys23").value);
      var publicKeys24 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys24").value);
      var publicKeys25 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys25").value);
      var publicKeys26 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys26").value);
      var publicKeys27 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys27").value);
      var publicKeys28 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys28").value);
      var publicKeys29 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys29").value);
      var publicKeys30 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value);

      var combinedPublicKeys = [].concat(publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys, tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys);
   }
   catch(err) {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not parse your trusted public keys!", ZmStatusView.LEVEL_WARNING);
      return;
   }
   var myWindow = this;
   openpgp.verifyClearSignedMessage(combinedPublicKeys, message).then(
      function(signature) {
         var goodsigs = 0;
         var badsigs = 0;
         var sigStatus = '';
         for (var s=0 ; s < signature.signatures.length ; s++) {
            if (signature.signatures[s].valid == true) {
               goodsigs++;
            } else {
               badsigs++;
            }
         }
         if ( (goodsigs > 0) && (badsigs == 0) ) {
            myWindow.status("Got a good signature.", ZmStatusView.LEVEL_INFO);
            sigStatus ='<b style="color:green">got a good signature.</b>';
         } else {
            myWindow.status("Got a BAD signature.", ZmStatusView.LEVEL_CRITICAL);
            sigStatus ='<b style="color:red">got a BAD signature.</b>';
         }
         if (message.text.indexOf('<html><body>') > -1 ) 
         {       
            myWindow.displayDialog(2, 'Signed message ' + sigStatus, '<div style="width:650px; height: 350px; overflow-x: hidden; overflow-y: scroll; background-color:white; padding:5px;"><div contenteditable="true" class="barrydegraaff_zimbra_openpgp-msg" style="height:320px;">'+message.text+'</div></div>');
         }
      },
      function (err) {
         myWindow.status("Error verifying signature.", ZmStatusView.LEVEL_WARNING);
   });
}

/* status method show a Zimbra status message
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.status = function(text, type) {
   var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.FADE_OUT ];
   appCtxt.getAppController().setStatusMsg(text, type, null, transitions);
}; 

/* displays dialogs.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.displayDialog =
function(id, title, message) {
   switch(id) {
   case 1:
      if((localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()]) && (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()];
	   } 
      html = "<div style='width:650px; height: 180px; overflow-x: hidden; overflow-y: scroll;'><table><tr><td colspan='2'>" +
      "Please provide private key and passphrase for decryption. Your private key will remain in memory until you reload your browser.<br><br>" +
      "</td></tr><tr><td>" +
      "Private Key:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      "Passphrase:" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '') + "'>" +
      "</td></tr><tr><td>" +
      "Message:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" id='message'>"+message+"</textarea>" +
      "</td></tr></table></div>";
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      this._dialog.setContent(html);
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnDecrypt));
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));
      
      //If a private key is available and a password is stored, auto decrypt the message
      if((tk_barrydegraaff_zimbra_openpgp.privateKeyCache.length > 10) && 
      ((this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '').length > 0))
      {
         this.okBtnDecrypt();
      }   
      break;
   case 2:
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      this._dialog.setContent(message);
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.cancelBtn));
      break;
   case 3:
      html = "<div style='width:650px; height: 500px; overflow-x: hidden; overflow-y: scroll;'><table><tr><td colspan='2'>" +
      "<ul><li>Copy-paste ASCII armored keys below. </li><li>You can also use the notes field from contacts added to your Zimbra address book.</li><li>You can put comments before each key as long as you start on a new line for your public key.</li></ul><br>" +
      "</td></tr>" +      
      "<tr><td style=\"width:100px\">Private Key:</td><td style=\"width:500px\">If you save your private key below it is stored in your browsers <a href=\"http://diveintohtml5.info/storage.html\" target=\"_blank\" >local storage</a>. If you do not store your private key the server will ask you to provide it for each session.<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='privateKeyInput'/>" + (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] ? localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] : '') + "</textarea></td></tr>" +
      "<tr><td>Passphrase:</td><td><br>If you save your passphrase below it is stored in plain text in the Zimbra LDAP. If you do not store your passphrase the server will ask you to provide it every time it is needed.<input class=\"barrydegraaff_zimbra_openpgp-input\" id='privatePassInput' type='password' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '') + "'></td></tr>" +
      "<tr><td><br>Scan contacts:</td><td><br><input type='checkbox' title='If checked, read Public Keys from the notes field in the Zimbra addressbook' id='enable_contacts_scanning' name='enable_contacts_scanning' " + (tk_barrydegraaff_zimbra_openpgp.prototype.settings['enable_contacts_scanning']=='false' ? '' : 'checked') + " value='true'>" + "</td></tr>" +
      "<tr><td>Public Key 1:</td><td><br><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput1'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 2:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput2'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys2").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys2").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 3:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput3'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys3").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys3").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 4:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput4'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys4").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys4").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 5:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput5'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys5").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys5").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 6:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput6'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys6").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys6").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 7:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput7'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys7").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys7").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 8:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput8'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys8").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys8").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 9:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput9'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys9").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys9").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 10:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput10'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys10").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys10").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 11:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput11'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys11").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys11").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 12:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput12'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys12").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys12").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 13:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput13'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys13").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys13").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 14:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput14'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys14").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys14").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 15:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput15'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys15").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys15").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 16:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput16'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys16").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys16").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 17:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput17'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys17").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys17").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 18:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput18'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys18").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys18").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 19:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput19'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys19").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys19").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 20:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput20'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys20").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys20").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 21:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput21'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys21").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys21").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 22:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput22'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys22").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys22").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 23:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput23'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys23").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys23").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 24:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput24'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys24").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys24").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 25:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput25'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys25").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys25").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 26:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput26'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys26").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys26").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 27:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput27'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys27").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys27").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 28:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput28'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys28").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys28").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 29:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput29'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys29").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys29").value : '') + "</textarea></td></tr>" +
      "<tr><td>Public Key 30:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput30'/>" + (this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value ? this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value : '') + "</textarea></td></tr>" +
      "</table></div>";
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      this._dialog.setContent(html);
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnPubKeySave));
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));
      break;
   case 4:
      if((localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()]) && (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()];
	   }
      html = "<div style='width:650px; height: 350px; overflow-x: hidden; overflow-y: hidden;'><table style='width:100%'><tr><td colspan='2'>" +
      "Please compose a message below to be signed with your private key. Your private key will remain in memory until you reload your browser.<br><br>" +
      "</td></tr><tr><td style=\"width:100px;\">" +
      "Private Key:" +
      "</td><td style=\"width:500px\">" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      "Passphrase:" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '') + "'>" +
      "</td></tr><tr><td>" +
      "Message:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'>"+ (message ? message : '' ) +"</textarea>" +
      "</td></tr></table></div><input type='hidden' id='returnType' value=" + ( message ? 'existing-compose-window' : 'new-compose-window' )+">";
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      this._dialog.setContent(html);
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnSign));
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));
      break;
   case 5:
      if (appCtxt.get(ZmSetting.DISPLAY_NAME))
      {
         displayname = appCtxt.get(ZmSetting.DISPLAY_NAME);
      }
      else
      {
         displayname = appCtxt.getActiveAccount().name;
      }  
      html = "<div style='width:650px; height: 240px; overflow-x: hidden; overflow-y: hidden;'><table style='width:650px;'><tr><td colspan='2'>" +
      "Please enter User ID (example: Firstname Lastname &lt;your@email.com&gt;) and passphrase for new key pair.<br><br>" +
      "</td></tr><tr><td style=\"width:100px;\">" +
      "User ID:" +
      "</td><td style=\"width:500px\">" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='uid' value='" + displayname + ' <' +appCtxt.getActiveAccount().name+">'>" +
      "</td></tr><tr><td>" +
      "Passphrase:" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : tk_barrydegraaff_zimbra_openpgp.prototype.pwgen()) + "'>" +
      "</td></tr><tr><td></td><td><button type=\"button\" onclick='document.getElementById(\"passphraseInput\").value=tk_barrydegraaff_zimbra_openpgp.prototype.pwgen()'>Generate passphrase</button></td></tr><tr><td style=\"width:100px;\">" +
      "Key length:" +
      "</td><td style=\"width:500px\">" +
      "<select class=\"barrydegraaff_zimbra_openpgp-input\" id=\"keyLength\" name=\"keyLength\"><option value=\"512\">512</option><option selected=\"selected\" value=\"1024\">1024</option><option value=\"2048\">2048</option><option value=\"4096\">4096</option></select>" +
      "</td></tr><tr><td colspan='2'>" +
      "<br>Higher key length is better security, but slower.<br><br>" +
      "</td></tr><tr><td colspan='2'>" +
      "<input type='checkbox' checked='checked' name='keyStore' id='keyStore' value='yes'>Store and overwrite current Private Key, Passphrase and Public Key 1.<br>" +
      "</td></tr></table></div>";
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true  } );
      this._dialog.setContent(html);
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnKeyPair));
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));
      break;
   case 6:
      if((localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()]) && (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()];
	   }      
      html = "<div style='width:650px; height: 350; overflow-x: hidden; overflow-y: hidden;'><table style='width:100%'><tr><td colspan='2'>" +
      "Please compose a message below to be encrypted. First time users may want to read the <a style='color:blue; text-decoration: underline;' onclick=\"      tk_barrydegraaff_zimbra_openpgp.prototype.menuItemSelected('help-new')\">help</a>.<br><br>" +
      "</td></tr><tr><td>" +
      "Recipients:" +
      "</td><td>" + this.pubKeySelect() +
      "</td></tr><tr><td>" +
      "Message:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'>"+ (message ? message : '' ) +"</textarea>" +
      "</td></tr><tr><td colspan='2'><br><br>Optional: Sign your encrypted message by entering private key and passphrase.</td></tr><tr><td>" +
      "Private Key:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      "Passphrase:" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '') + "'>" +
      "</td></tr></table></div><input type='hidden' id='returnType' value=" + ( message ? 'existing-compose-window' : 'new-compose-window' )+">";      
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      this._dialog.setContent(html);
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnEncrypt));
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));
      break;
   }
	this._dialog.popup();
};

/* This method is called when the dialog "OK" button is clicked after private key has been entered.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnDecrypt =
function() {
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
   this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.cancelBtn));
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   
   var privateKeyInput = document.getElementById("privateKeyInput").value;
   tk_barrydegraaff_zimbra_openpgp.privateKeyCache = privateKeyInput;
   var passphraseInput = document.getElementById("passphraseInput").value;
   var msg = document.getElementById("message").value;

   try {
      var privKeys = openpgp.key.readArmored(privateKeyInput);
      var privKey = privKeys.keys[0];
      var success = privKey.decrypt(passphraseInput);
   }
   catch (err) {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not parse private key!", ZmStatusView.LEVEL_WARNING);
      return;
   }

   if (success) {
      try {
         var message = openpgp.message.readArmored(msg);
      }
      catch(err) {
         this.status("Could not read armored message!", ZmStatusView.LEVEL_CRITICAL);
         return;
      }
   try {
      var publicKeys1 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value);
      var publicKeys2 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys2").value);
      var publicKeys3 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys3").value);
      var publicKeys4 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys4").value);
      var publicKeys5 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys5").value);
      var publicKeys6 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys6").value);
      var publicKeys7 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys7").value);
      var publicKeys8 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys8").value);
      var publicKeys9 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys9").value);
      var publicKeys10 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys10").value);
      var publicKeys11 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys11").value);
      var publicKeys12 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys12").value);
      var publicKeys13 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys13").value);
      var publicKeys14 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys14").value);
      var publicKeys15 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys15").value);
      var publicKeys16 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys16").value);
      var publicKeys17 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys17").value);
      var publicKeys18 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys18").value);
      var publicKeys19 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys19").value);
      var publicKeys20 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys20").value);
      var publicKeys21 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys21").value);
      var publicKeys22 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys22").value);
      var publicKeys23 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys23").value);
      var publicKeys24 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys24").value);
      var publicKeys25 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys25").value);
      var publicKeys26 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys26").value);
      var publicKeys27 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys27").value);
      var publicKeys28 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys28").value);
      var publicKeys29 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys29").value);
      var publicKeys30 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value);
      var pubKey = [].concat(publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys, tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys);
   }
   catch(err) {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not parse your trusted public keys!", ZmStatusView.LEVEL_WARNING);
      return;
   }
      // There should be a cleaner way to do this than stashing 
      // the parent in myWindow but I've not worked it out yet!
      var myWindow = this;
        openpgp.decryptAndVerifyMessage(privKey, pubKey, message).then(
           function(decrypted) {               
               var sigStatus ='';
               try 
               {
                  if(decrypted.text+decrypted.signatures[0].valid)
                  {
                     if(decrypted.signatures[0].valid==true)
                     {
                        sigStatus ='<b style="color:green">got a good signature.</b>';
                        tk_barrydegraaff_zimbra_openpgp.prototype.status("Got a good signature.", ZmStatusView.LEVEL_INFO);
                     }
                     else
                     {
                        sigStatus ='<b style="color:red">got a BAD signature.</b>';
                        tk_barrydegraaff_zimbra_openpgp.prototype.status("Got a BAD signature.", ZmStatusView.LEVEL_CRITICAL);
                     }
                  }
               }
               catch (err) 
               {
                  sigStatus ='was not signed.';
               }                 
               myWindow._dialog.setTitle('Decrypted message '+ sigStatus);
               myWindow._dialog.setContent('<div style="width:650px; height: 350px; overflow-x: hidden; overflow-y: scroll; background-color:white; padding:5px;"><div contenteditable="true" class="barrydegraaff_zimbra_openpgp-msg" style="height:320px;">'+decrypted.text+'</div></div>');
            },
            function(err) {
               tk_barrydegraaff_zimbra_openpgp.prototype.status("Decryption failed!", ZmStatusView.LEVEL_WARNING);
            }
        );
   }
   else {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Wrong passphrase!", ZmStatusView.LEVEL_WARNING);
   }
};

/* This method stores values to html localstorage
 */
tk_barrydegraaff_zimbra_openpgp.prototype.localStorageSave = 
function() {
   var privKeyInput = document.getElementById("privateKeyInput").value;
   //Do not allow to store invalid private keys
   var pgpPrivKeyRegEx = new RegExp('[\-]*BEGIN PGP PRIVATE KEY BLOCK[\-]*');
   if (privKeyInput.match(pgpPrivKeyRegEx)) 
   {	   
      localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] = document.getElementById("privateKeyInput").value;
      tk_barrydegraaff_zimbra_openpgp.privateKeyCache=localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()];
   }
   else
   {
      localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] = '';
      tk_barrydegraaff_zimbra_openpgp.privateKeyCache='';
   }   
}

/* This method is called when the dialog "OK" button is clicked after public keys have been maintained
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnPubKeySave =
function() {
   tk_barrydegraaff_zimbra_openpgp.prototype.localStorageSave();
 
   //Per user configuration options are jsonified into a single Zimbra userProperty
   tk_barrydegraaff_zimbra_openpgp.prototype.settings['enable_contacts_scanning'] = (document.getElementById("enable_contacts_scanning").checked ? 'true' : 'false');

   //Store values to LDAP
   this.setUserProperty("zimbra_openpgp_options", JSON.stringify(tk_barrydegraaff_zimbra_openpgp.prototype.settings), false);
   this.setUserProperty("zimbra_openpgp_privatepass", document.getElementById("privatePassInput").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys1", document.getElementById("publicKeyInput1").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys2", document.getElementById("publicKeyInput2").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys3", document.getElementById("publicKeyInput3").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys4", document.getElementById("publicKeyInput4").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys5", document.getElementById("publicKeyInput5").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys6", document.getElementById("publicKeyInput6").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys7", document.getElementById("publicKeyInput7").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys8", document.getElementById("publicKeyInput8").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys9", document.getElementById("publicKeyInput9").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys10", document.getElementById("publicKeyInput10").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys11", document.getElementById("publicKeyInput11").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys12", document.getElementById("publicKeyInput12").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys13", document.getElementById("publicKeyInput13").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys14", document.getElementById("publicKeyInput14").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys15", document.getElementById("publicKeyInput15").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys16", document.getElementById("publicKeyInput16").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys17", document.getElementById("publicKeyInput17").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys18", document.getElementById("publicKeyInput18").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys19", document.getElementById("publicKeyInput19").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys20", document.getElementById("publicKeyInput20").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys21", document.getElementById("publicKeyInput21").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys22", document.getElementById("publicKeyInput22").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys23", document.getElementById("publicKeyInput23").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys24", document.getElementById("publicKeyInput24").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys25", document.getElementById("publicKeyInput25").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys26", document.getElementById("publicKeyInput26").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys27", document.getElementById("publicKeyInput27").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys28", document.getElementById("publicKeyInput28").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys29", document.getElementById("publicKeyInput29").value, false);
   this.setUserProperty("zimbra_openpgp_pubkeys30", document.getElementById("publicKeyInput30").value, true);
  
   tk_barrydegraaff_zimbra_openpgp.prototype.readAddressBook();  
   this._dialog.popdown();
};

/* This method is called for signing messages
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnSign =
function() {
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
   var privateKeyInput = document.getElementById("privateKeyInput").value;
   tk_barrydegraaff_zimbra_openpgp.privateKeyCache = privateKeyInput;
   var passphrase = document.getElementById("passphraseInput").value;
   var message = document.getElementById("message").value;
   var returnType = document.getElementById("returnType").value; 

   try {
      var privKeys = openpgp.key.readArmored(privateKeyInput);
      var privKey = privKeys.keys[0];
      var success = privKey.decrypt(passphrase);
   }
   catch (err) {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not parse private key!", ZmStatusView.LEVEL_WARNING);
      return;
   }

   if (success) {
      var myWindow = this;
        openpgp.signClearMessage(privKey, message).then(
           function(signed) {        
              if (returnType == 'existing-compose-window')
              {                 
                 tk_barrydegraaff_zimbra_openpgp.prototype.composeSign(signed);
              }
              else
              {
                 var composeController = AjxDispatcher.run("GetComposeController");
                 if(composeController) {
                    var appCtxt = window.top.appCtxt;
                    var zmApp = appCtxt.getApp();
                    var newWindow = zmApp != null ? (zmApp._inNewWindow ? true : false) : true;
                    var params = {action:ZmOperation.NEW_MESSAGE, inNewWindow:null, composeMode:Dwt.TEXT,
                    toOverride:null, subjOverride:null, extraBodyText:signed, callback:null}
                    composeController.doAction(params); // opens asynchronously the window.
                 }
              }   
              myWindow._dialog.popdown();
           },
           function(err) {
              tk_barrydegraaff_zimbra_openpgp.prototype.status("Signing failed!", ZmStatusView.LEVEL_WARNING);
           }
        );
   }
   else {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Wrong passphrase!", ZmStatusView.LEVEL_WARNING);
   }
};

/* This method is called when the dialog "OK" button is clicked for key pair generation.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnKeyPair =
function() {
	var userid = document.getElementById("uid").value;
   var keyLength = document.getElementById("keyLength").value;
   var passphrase = document.getElementById("passphraseInput").value;
   var keyStore = document.getElementById("keyStore").checked;

   if ((!userid) || (!passphrase)) {
      this.status("You must provide a user ID and passphrase", ZmStatusView.LEVEL_WARNING);
      return;
   }

   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
   this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.cancelBtn));
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);

   this._dialog.setTitle('Now generating your key pair');
   this._dialog.setContent('<div style="width:650px; height: 240px; overflow-x: hidden; overflow-y: hidden;">Please be patient generating can take some time.<br><br>If you have trouble generating a key pair choose a lower key length or use an external program.<br><br><br><br><img src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/loading.gif" style="width:48px; height:48px; display: block; margin-left: auto; margin-right: auto" alt="loading"></div>');

   var opt = {numBits: keyLength, userId: userid, passphrase: passphrase};
   var myWindow = this;
   openpgp.generateKeyPair(opt).then(function(key) {
      if((key.privateKeyArmored) && (key.publicKeyArmored))
      {
         if(keyStore)
         {
            localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] = key.privateKeyArmored;
            tk_barrydegraaff_zimbra_openpgp.privateKeyCache=localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()];               
            myWindow.setUserProperty("zimbra_openpgp_privatepass", passphrase, true);
            myWindow.setUserProperty("zimbra_openpgp_pubkeys1", key.publicKeyArmored, true);
         }
         myWindow._dialog.setTitle('Your new key pair');
         myWindow._dialog.setContent('<div style="width:650px; height: 240px; overflow-x: hidden; overflow-y: hidden;"><table style="width:650px;">Please make sure to store this information in a safe place:<br><br><textarea class="barrydegraaff_zimbra_openpgp-msg" style="height:320px;">Passphrase ' + passphrase + ' for ' + userid + '\r\n\r\n'+key.privateKeyArmored+'\r\n\r\n'+key.publicKeyArmored+'\r\n\r\nKey length: '+keyLength+' bits</textarea></div>');
         myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      }       
   });
};

/* This method generates an html select list with public keys
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.pubKeySelect =
function() {
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
   try {
      var publicKeys1 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value);
      var publicKeys2 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys2").value);
      var publicKeys3 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys3").value);
      var publicKeys4 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys4").value);
      var publicKeys5 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys5").value);
      var publicKeys6 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys6").value);
      var publicKeys7 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys7").value);
      var publicKeys8 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys8").value);
      var publicKeys9 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys9").value);
      var publicKeys10 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys10").value);
      var publicKeys11 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys11").value);
      var publicKeys12 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys12").value);
      var publicKeys13 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys13").value);
      var publicKeys14 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys14").value);
      var publicKeys15 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys15").value);
      var publicKeys16 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys16").value);
      var publicKeys17 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys17").value);
      var publicKeys18 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys18").value);
      var publicKeys19 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys19").value);
      var publicKeys20 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys20").value);
      var publicKeys21 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys21").value);
      var publicKeys22 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys22").value);
      var publicKeys23 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys23").value);
      var publicKeys24 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys24").value);
      var publicKeys25 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys25").value);
      var publicKeys26 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys26").value);
      var publicKeys27 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys27").value);
      var publicKeys28 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys28").value);
      var publicKeys29 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys29").value);
      var publicKeys30 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value);
      var combinedPublicKeys = [publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys, tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys];

      var result = '<select class="barrydegraaff_zimbra_openpgp-input" id="pubKeySelect" multiple>';

      combinedPublicKeys.forEach(function(entry) {
         if(entry[0]) {
				for (i = 0; i < entry[0].users.length; i++) {
					userid = entry[0].users[i].userId.userid.replace(/\</g,"&lt;");
					userid = userid.replace(/\>/g,"&gt;") ;
					result = result + '<option title="fingerprint: '+entry[0].primaryKey.fingerprint+' \r\ncreated: '+entry[0].primaryKey.created+'" value="'+entry[0].armor()+'">'+userid+'</option>';
				}
         }
      });
      result = result + '</select>';
   }
   catch(err) {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not parse your trusted public keys!", ZmStatusView.LEVEL_WARNING);
      return;
   }
   return result;
}

/* This method is called when OK is pressed in encrypt dialog
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnEncrypt =
function() {
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
   var pubKeySelect = document.getElementById("pubKeySelect");
   var msg = document.getElementById("message").value;
   var returnType = document.getElementById("returnType").value;
     
   var pubKeys = [];
   var addresses = '';

   // Build Public Keys list from selected
   for (k=0; k < pubKeySelect.options.length ; k++) {
      if (pubKeySelect.options[k].selected) {
         pubKeys=pubKeys.concat(openpgp.key.readArmored(pubKeySelect.options[k].value).keys);
         addresses=addresses + pubKeySelect.options[k].label + '; ';
      }   
   }
   
   var privateKeyInput = document.getElementById("privateKeyInput").value;

   // There should be a cleaner way to do this than stashing 
   // the parent in myWindow but I've not worked it out yet!
   var myWindow = this;
      
   if(privateKeyInput.length > 0)
   {
      tk_barrydegraaff_zimbra_openpgp.privateKeyCache = privateKeyInput;
      var passphrase = document.getElementById("passphraseInput").value;

      try {
         var privKeys = openpgp.key.readArmored(privateKeyInput);
         var privKey = privKeys.keys[0];
         var success = privKey.decrypt(passphrase);
      }
      catch (err) {
         tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not parse private key!", ZmStatusView.LEVEL_WARNING);
         return;
      }

      openpgp.signAndEncryptMessage(pubKeys, privKey, msg, addresses).then(
         function(pgpMessage) {
            if (returnType == 'existing-compose-window')
            {
               tk_barrydegraaff_zimbra_openpgp.prototype.composeEncrypt(addresses, pgpMessage);
            }
            else
            {
               var composeController = AjxDispatcher.run("GetComposeController");
               if(composeController) {
                  var appCtxt = window.top.appCtxt;
                  var zmApp = appCtxt.getApp();
                  var newWindow = zmApp != null ? (zmApp._inNewWindow ? true : false) : true;
                  var params = {action:ZmOperation.NEW_MESSAGE, inNewWindow:null, composeMode:Dwt.TEXT,
                  toOverride:addresses, subjOverride:null, extraBodyText:pgpMessage, callback:null}
                  composeController.doAction(params); // opens asynchronously the window.
               }
            }
            myWindow._dialog.popdown();
         }, 
         function(err) {
            if( pubKeySelect.selectedOptions.length==0)
            {
               tk_barrydegraaff_zimbra_openpgp.prototype.status("Please select recipient(s).", ZmStatusView.LEVEL_WARNING);
            }
            else
            {
               tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not encrypt message!", ZmStatusView.LEVEL_WARNING);
            }
        });      
   }
   else
   {   
      openpgp.encryptMessage(pubKeys, msg, addresses).then(
         function(pgpMessage) {            
            if (returnType == 'existing-compose-window')
            {
               tk_barrydegraaff_zimbra_openpgp.prototype.composeEncrypt(addresses, pgpMessage);
            }
            else
            {
               var composeController = AjxDispatcher.run("GetComposeController");
               if(composeController) {
                  var appCtxt = window.top.appCtxt;
                  var zmApp = appCtxt.getApp();
                  var newWindow = zmApp != null ? (zmApp._inNewWindow ? true : false) : true;
                  var params = {action:ZmOperation.NEW_MESSAGE, inNewWindow:null, composeMode:Dwt.TEXT,
                  toOverride:addresses, subjOverride:null, extraBodyText:pgpMessage, callback:null}
                  composeController.doAction(params); // opens asynchronously the window.
               }
            }
            myWindow._dialog.popdown();
         },
         function(err) {
            if( pubKeySelect.selectedOptions.length==0)
            {
               tk_barrydegraaff_zimbra_openpgp.prototype.status("Please select recipient(s).", ZmStatusView.LEVEL_WARNING);
            }
            else
            {
               tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not encrypt message!", ZmStatusView.LEVEL_WARNING);
            }
        });
     }   
};

/* This method is called when the dialog "CANCEL" button is clicked
 */
tk_barrydegraaff_zimbra_openpgp.prototype.cancelBtn =
function() {
   try{
      this._dialog.setContent('');
      this._dialog.popdown();
   }
      catch (err) {
  }
};

/* This method generates a password like passphrase for lazy users
 */
tk_barrydegraaff_zimbra_openpgp.prototype.pwgen =
function ()
{
   chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
   pass = "";

   for(x=0;x<25;x++)
   {
      i = Math.floor(Math.random() * 62);
      pass += chars.charAt(i);
   }
   return pass;
}

/* Compose window integration
 * Add buttons to compose window
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.initializeToolbar =
function(app, toolbar, controller, viewId) {
   // bug fix #7192 - disable detach toolbar button
   toolbar.enable(ZmOperation.DETACH_COMPOSE, false);   
   
	if(viewId.indexOf("COMPOSE") >=0){
      if (toolbar.getButton('OPENPGPENCRYPT'))
      {
         //button already defined
         return;
      }
		var buttonArgs = {
			text    : "Encrypt",
			tooltip: "Encrypt this email with OpenPGP",
			index: 4, //position of the button
			image: "zimbraicon" //icon
		};
		var button = toolbar.createOp("OPENPGPENCRYPT", buttonArgs);
		button.addSelectionListener(new AjxListener(this, this.composeEncryptHandler, controller));

      if (toolbar.getButton('OPENPGPSIGN'))
      {
         //button already defined
         return;
      }
		var buttonArgs = {
			text    : "Sign",
			tooltip: "Sign this email with OpenPGP",
			index: 5, //position of the button
			image: "zimbraicon" //icon
		};
		var button = toolbar.createOp("OPENPGPSIGN", buttonArgs);
		button.addSelectionListener(new AjxListener(this, this.composeSignHandler, controller));

	}
};

/* Compose window integration
 * Call the encrypt dialog after Encrypt button pressed in Compose window
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.composeEncryptHandler =
function(controller) {
   var composeMode = appCtxt.getCurrentView().getHtmlEditor().getMode();
   var message = controller._getBodyContent();

   if(message.indexOf("__SIG_PRE__") > 0 ) { 
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Please disable your email signature", ZmStatusView.LEVEL_INFO);
      return;      
   }
   
   if(message.length < 1)
   {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Please compose message first", ZmStatusView.LEVEL_INFO);
      return;
   }

   
   if(composeMode != 'text/plain')
   {
      var composeView = appCtxt.getCurrentView();   
      composeView.getHtmlEditor().setContent('');    

      controller._setFormat(Dwt.TEXT);
      composeView.getHtmlEditor().setMode(Dwt.TEXT);   
      composeView.getHtmlEditor().setContent(message);    
   }
   
   this.displayDialog(6, "Encrypt message", message);
};

/* Compose window integration
 * Continue in the compose window after encrypt
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.composeEncrypt =
function(addresses, message) {
   var composeView = appCtxt.getCurrentView();
   composeView.getHtmlEditor().setMode(Dwt.TEXT);   
   composeView.getHtmlEditor().setContent(message);    
   composeView.setAddress(AjxEmailAddress.TO, addresses);     
}


/* Compose window integration
 * Call the sign dialog after Sign button pressed in Compose window
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.composeSignHandler =
function(controller) {
   var composeMode = appCtxt.getCurrentView().getHtmlEditor().getMode();
   var message = controller._getBodyContent();
   
   if(message.indexOf("__SIG_PRE__") > 0 ) { 
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Please disable your email signature", ZmStatusView.LEVEL_INFO);
      return;      
   }
   
   if(message.length < 1)
   {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Please compose message first", ZmStatusView.LEVEL_INFO);
      return;
   }

   
   if(composeMode != 'text/plain')
   {
      var composeView = appCtxt.getCurrentView();   
      composeView.getHtmlEditor().setContent('');    

      controller._setFormat(Dwt.TEXT);
      composeView.getHtmlEditor().setMode(Dwt.TEXT);   
      composeView.getHtmlEditor().setContent(message);    
   }
   
   this.displayDialog(4, "Sign message", message);
};

/* Compose window integration
 * Continue in the compose window after sign
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.composeSign =
function(message) {
   var composeView = appCtxt.getCurrentView();
   composeView.getHtmlEditor().setMode(Dwt.TEXT);   
   composeView.getHtmlEditor().setContent(message);    
}   

/* AddressBook integration
 * AddressBook integration still need some clean-up and debugging!!
 */

/* AddressBook integration
 * Read the notes field from all contacts and look for public key blocks
 */
tk_barrydegraaff_zimbra_openpgp.prototype.parseContacts = function() {  
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');

   tk_barrydegraaff_zimbra_openpgp.prototype.addressBookReadInProgress = false;
   tk_barrydegraaff_zimbra_openpgp.prototype.status("OpenPGP scanning contacts completed", ZmStatusView.LEVEL_INFO);

   this._contactList._vector._array.forEach(function(entry) {      
      try{
         if(entry._attrs.notes.indexOf("BEGIN PGP PUBLIC KEY BLOCK") > 0 ) {  
            var pubkey = openpgp.key.readArmored(entry._attrs.notes);
            tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys = [].concat(tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys, pubkey.keys);
         }
      }   
      catch(err) {
      }
   });
}

/* AddressBook integration
 * http://wiki.zimbra.com/wiki/Zimlet_cookbook_based_on_JavaScript_API#Scan_AddressBook
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.readAddressBook = function() {
   if (tk_barrydegraaff_zimbra_openpgp.prototype.settings['enable_contacts_scanning'] == 'false')
   {
      return;
   }
   
   tk_barrydegraaff_zimbra_openpgp.prototype.addressBookReadInProgress = true;
   tk_barrydegraaff_zimbra_openpgp.prototype.status("OpenPGP scanning contacts in progress", ZmStatusView.LEVEL_INFO);
   var  postCallback = new AjxCallback(this, tk_barrydegraaff_zimbra_openpgp.prototype.parseContacts);
   this.loadAllContacts(postCallback);
};

/* AddressBook integration
 * http://wiki.zimbra.com/wiki/Zimlet_cookbook_based_on_JavaScript_API#Scan_AddressBook
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.loadAllContacts = function(postCallBack) {
	this.__oldNumContacts = 0;
	this._noOpLoopCnt = 0;
	this._totalWaitCnt = 0;
	this._contactsAreLoaded = false;
	this._waitForContactToLoadAndProcess(postCallBack);
	this._contactsAreLoaded = true;
};

/* AddressBook integration
 * http://wiki.zimbra.com/wiki/Zimlet_cookbook_based_on_JavaScript_API#Scan_AddressBook
 * */
tk_barrydegraaff_zimbra_openpgp.prototype._waitForContactToLoadAndProcess = function(postCallback) {
	try {
      this._contactList = AjxDispatcher.run("GetContacts");
      if (!this._contactList)
         return;
   
      this.__currNumContacts = this._contactList.getArray().length;
      if (this._totalWaitCnt < 2 || this._noOpLoopCnt < 3) {//minimum 2 cycles post currentCnt==oldCnt
         if (this.__oldNumContacts == this.__currNumContact) {
            this._noOpLoopCnt++;
         }
         this._totalWaitCnt++;
         this.__oldNumContacts = this.__currNumContact;
         setTimeout(AjxCallback.simpleClosure(this._waitForContactToLoadAndProcess, this, postCallback), 5000);
      } else {//process..
         if(postCallback) {
            postCallback.run(this);
         }
      }
   } 
   catch(err) {
   }
}
