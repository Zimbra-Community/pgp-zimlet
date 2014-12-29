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
   tk_barrydegraaff_zimbra_openpgp.prototype.initZmMetaData();
   
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
};

/* Initialize ZmMetaData in  see metaDataHandler below for more details.
 * will set tk_barrydegraaff_zimbra_openpgp.metaData
 */
tk_barrydegraaff_zimbra_openpgp.prototype.initZmMetaData =
function() { 
   
   this.currentMetaData = new ZmMetaData(appCtxt.getActiveAccount(), null);
   this.currentMetaData.get("openpgpZimletMetaData",null,tk_barrydegraaff_zimbra_openpgp.prototype.metaDataHandler);
}   

/* zmMetaData object stores user data to SQL database in Zimbra
 * This should be less limited than LDAP with getUserPropertyInfo
 * See also: 
 * https://files.zimbra.com/docs/zimlet/zcs/8.0.4/jsdocs/symbols/ZmMetaData.html
 * https://github.com/Zimbra-Community/adopted/blob/master/com_zimbra_stickynotes/stickynotes.js
 * https://gist.github.com/skyflyer/e03e79abcb18964de9d0
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.metaDataHandler =
function(data) {   
   var response = data.getResponse().BatchResponse.GetMailboxMetadataResponse[0];
   if (response.meta && response.meta[0] && response.meta[0]._attrs ) {
      tk_barrydegraaff_zimbra_openpgp.metaData = response.meta[0]._attrs
      return; 
   }
   else
   {
      tk_barrydegraaff_zimbra_openpgp.metaData = '';
   }      
}

/*This method is called when a message is viewed in Zimbra
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.onMsgView = function (msg, oldMsg, view) {
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
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
      //window.open("/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/help/index.html");
      tk_barrydegraaff_zimbra_openpgp.openPGPApp = this.createApp('OpenPGP Help', "tk_barrydegraaff_zimbra_openpgp-panelIcon", "Encrypt/Decrypt messages with OpenPGP");
      var app = appCtxt.getApp(tk_barrydegraaff_zimbra_openpgp.openPGPApp);	
      var toolbar = app.getToolbar(); // returns ZmToolBar
      toolbar.setContent("<button style='margin:10px;' onclick='tk_barrydegraaff_zimbra_openpgp.prototype._resetApp()'>Close</button> <b>OpenPGP version: " + this._zimletContext.version, ZmStatusView.LEVEL_INFO + "</b><br><br>");
      app.launch();      
		break;
   }
};

/* doDrop handler for verify and decrypt messages
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.doDrop =
function(zmObject) {
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
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
      var publicKeys31 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys31']);
      var publicKeys32 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys32']);
      var publicKeys33 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys33']);
      var publicKeys34 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys34']);
      var publicKeys35 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys35']);
      var publicKeys36 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys36']);
      var publicKeys37 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys37']);
      var publicKeys38 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys38']);
      var publicKeys39 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys39']);
      var publicKeys40 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys40']);
      var combinedPublicKeys = [].concat(publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys, publicKeys31.keys, publicKeys32.keys, publicKeys33.keys, publicKeys34.keys, publicKeys35.keys, publicKeys36.keys, publicKeys37.keys, publicKeys38.keys, publicKeys39.keys, publicKeys40.keys);
   }
   catch(err) {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not parse your trusted public keys!", ZmStatusView.LEVEL_WARNING);
      return;
   }
   openpgp.verifyClearSignedMessage(combinedPublicKeys, message).then(
      function(signature) {
         var goodsigs = 0;
         var badsigs = 0;
         for (var s=0 ; s < signature.signatures.length ; s++) {
            if (signature.signatures[s].valid == true) {
               goodsigs++;
            } else {
               badsigs++;
            }
         }
         if ( (goodsigs > 0) && (badsigs == 0) ) {
            tk_barrydegraaff_zimbra_openpgp.prototype.status("Got a good signature.", ZmStatusView.LEVEL_INFO);
         } else {
            tk_barrydegraaff_zimbra_openpgp.prototype.status("Got a BAD signature.", ZmStatusView.LEVEL_CRITICAL);
         }
      },
      function (err) {
         tk_barrydegraaff_zimbra_openpgp.prototype.status("Error verifying signature.", ZmStatusView.LEVEL_WARNING);
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
      this._dialog.setContent("<div style='width:650px; height: 350px; overflow-x: hidden; overflow-y: scroll;'>"+message+"</div>");
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.cancelBtn));
      break;
   case 3:
      html = "<div style='width:650px; height: 500px; overflow-x: hidden; overflow-y: scroll;'><table><tr><td colspan='2'>" +
      "Copy-paste ASCII armored keys here. <br><br>You can put human readable comments before each key as long as you start on a new line for your public key.<br><br><small>Please be patient after hitting the OK button, even after the dialog pops down it can take  some time for your changes to become visible.<br><br>Public keys 1-30 are stored in Zimbra LDAP and have maximum length of 5120 chars. Public keys 31-40 are stored in Zimbra SQL and have a combined maximum length of 32768 chars.</small><br><br>" +
      "</td></tr>" +
      "<tr><td style=\"width:100px\">Private Key:</td><td style=\"width:500px\">If you save your private key below it is stored in your browsers <a href=\"http://diveintohtml5.info/storage.html\" target=\"_blank\" >local storage</a>. If you do not store your private key the server will ask you to provide it for each session.<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='privateKeyInput'/>" + (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] ? localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] : '') + "</textarea></td></tr>" +
      "<tr><td>Passphrase:</td><td><br>If you save your passphrase below it is stored in plain text in the Zimbra LDAP. If you do not store your passphrase the server will ask you to provide it every time it is needed.<input class=\"barrydegraaff_zimbra_openpgp-input\" id='privatePassInput' type='password' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '') + "'></td></tr>" +
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
      "<tr><td>Public Key 31:</td><td><br><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput31'/>" + (tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys31'] ? tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys31'] : '')  + "</textarea></td></tr>" +
      "<tr><td>Public Key 32:</td><td><br><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput32'/>" + (tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys32'] ? tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys32'] : '')  + "</textarea></td></tr>" +
      "<tr><td>Public Key 33:</td><td><br><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput33'/>" + (tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys33'] ? tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys33'] : '')  + "</textarea></td></tr>" +
      "<tr><td>Public Key 34:</td><td><br><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput34'/>" + (tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys34'] ? tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys34'] : '')  + "</textarea></td></tr>" +
      "<tr><td>Public Key 35:</td><td><br><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput35'/>" + (tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys35'] ? tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys35'] : '')  + "</textarea></td></tr>" +
      "<tr><td>Public Key 36:</td><td><br><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput36'/>" + (tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys36'] ? tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys36'] : '')  + "</textarea></td></tr>" +
      "<tr><td>Public Key 37:</td><td><br><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput37'/>" + (tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys37'] ? tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys37'] : '')  + "</textarea></td></tr>" +
      "<tr><td>Public Key 38:</td><td><br><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput38'/>" + (tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys38'] ? tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys38'] : '')  + "</textarea></td></tr>" +
      "<tr><td>Public Key 39:</td><td><br><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput39'/>" + (tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys39'] ? tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys39'] : '')  + "</textarea></td></tr>" +
      "<tr><td>Public Key 40:</td><td><br><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput40'/>" + (tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys40'] ? tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys40'] : '')  + "</textarea></td></tr>" +                                                                                  
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
      "<textarea class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'></textarea>" +
      "</td></tr></table></div>";
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
      "Please compose a message below to be encrypted.<br><br>" +
      "</td></tr><tr><td>" +
      "Recipients:" +
      "</td><td>" + this.pubKeySelect() +
      "</td></tr><tr><td>" +
      "Message:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'></textarea>" +
      "</td></tr><tr><td colspan='2'><br><br>Optional: Sign your encrypted message by entering private key and passphrase.</td></tr><tr><td>" +
      "Private Key:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      "Passphrase:" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '') + "'>" +
      "</td></tr></table></div>";      
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
      var publicKeys31 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys31']);
      var publicKeys32 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys32']);
      var publicKeys33 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys33']);
      var publicKeys34 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys34']);
      var publicKeys35 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys35']);
      var publicKeys36 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys36']);
      var publicKeys37 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys37']);
      var publicKeys38 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys38']);
      var publicKeys39 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys39']);
      var publicKeys40 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys40']);
      var pubKey = [].concat(publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys, publicKeys31.keys, publicKeys32.keys, publicKeys33.keys, publicKeys34.keys, publicKeys35.keys, publicKeys36.keys, publicKeys37.keys, publicKeys38.keys, publicKeys39.keys, publicKeys40.keys);
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
                        sigStatus ='<b style="color:green">Got a good signature.</b>';
                        tk_barrydegraaff_zimbra_openpgp.prototype.status("Got a good signature.", ZmStatusView.LEVEL_INFO);
                     }
                     else
                     {
                        sigStatus ='<b style="color:red">Got a BAD signature.</b>';
                        tk_barrydegraaff_zimbra_openpgp.prototype.status("Got a BAD signature.", ZmStatusView.LEVEL_CRITICAL);
                     }
                  }
               }
               catch (err) 
               {
                  sigStatus ='This encrypted message was not signed.';
               }                 
               myWindow._dialog.setTitle('Decrypted message');
               myWindow._dialog.setContent('<div style="width:650px; height: 350px; overflow-x: hidden; overflow-y: scroll;"><textarea class="barrydegraaff_zimbra_openpgp-msg" style="height:325px;">'+decrypted.text+'</textarea><br>'+sigStatus+'</div>');
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
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
   tk_barrydegraaff_zimbra_openpgp.prototype.localStorageSave();

   //Store values to LDAP
   this.setUserProperty("zimbra_openpgp_privatepass", document.getElementById("privatePassInput").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys1", document.getElementById("publicKeyInput1").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys2", document.getElementById("publicKeyInput2").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys3", document.getElementById("publicKeyInput3").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys4", document.getElementById("publicKeyInput4").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys5", document.getElementById("publicKeyInput5").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys6", document.getElementById("publicKeyInput6").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys7", document.getElementById("publicKeyInput7").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys8", document.getElementById("publicKeyInput8").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys9", document.getElementById("publicKeyInput9").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys10", document.getElementById("publicKeyInput10").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys11", document.getElementById("publicKeyInput11").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys12", document.getElementById("publicKeyInput12").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys13", document.getElementById("publicKeyInput13").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys14", document.getElementById("publicKeyInput14").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys15", document.getElementById("publicKeyInput15").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys16", document.getElementById("publicKeyInput16").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys17", document.getElementById("publicKeyInput17").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys18", document.getElementById("publicKeyInput18").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys19", document.getElementById("publicKeyInput19").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys20", document.getElementById("publicKeyInput20").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys21", document.getElementById("publicKeyInput21").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys22", document.getElementById("publicKeyInput22").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys23", document.getElementById("publicKeyInput23").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys24", document.getElementById("publicKeyInput24").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys25", document.getElementById("publicKeyInput25").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys26", document.getElementById("publicKeyInput26").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys27", document.getElementById("publicKeyInput27").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys28", document.getElementById("publicKeyInput28").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys29", document.getElementById("publicKeyInput29").value, true);
   this.setUserProperty("zimbra_openpgp_pubkeys30", document.getElementById("publicKeyInput30").value, true);

   //Store public keys to SQL database using ZmMetaData
   this._currentMetaData = new ZmMetaData(appCtxt.getActiveAccount(), null);
   var keyValArry = [];
   //Only send items to the server that are not empty
   if(document.getElementById("publicKeyInput31").value) keyValArry["zimbra_openpgp_pubkeys31"] = document.getElementById("publicKeyInput31").value;
   if(document.getElementById("publicKeyInput32").value) keyValArry["zimbra_openpgp_pubkeys32"] = document.getElementById("publicKeyInput32").value;
   if(document.getElementById("publicKeyInput33").value) keyValArry["zimbra_openpgp_pubkeys33"] = document.getElementById("publicKeyInput33").value;
   if(document.getElementById("publicKeyInput34").value) keyValArry["zimbra_openpgp_pubkeys34"] = document.getElementById("publicKeyInput34").value;
   if(document.getElementById("publicKeyInput35").value) keyValArry["zimbra_openpgp_pubkeys35"] = document.getElementById("publicKeyInput35").value;
   if(document.getElementById("publicKeyInput36").value) keyValArry["zimbra_openpgp_pubkeys36"] = document.getElementById("publicKeyInput36").value;
   if(document.getElementById("publicKeyInput37").value) keyValArry["zimbra_openpgp_pubkeys37"] = document.getElementById("publicKeyInput37").value;
   if(document.getElementById("publicKeyInput38").value) keyValArry["zimbra_openpgp_pubkeys38"] = document.getElementById("publicKeyInput38").value;
   if(document.getElementById("publicKeyInput39").value) keyValArry["zimbra_openpgp_pubkeys39"] = document.getElementById("publicKeyInput39").value;
   if(document.getElementById("publicKeyInput40").value) keyValArry["zimbra_openpgp_pubkeys40"] = document.getElementById("publicKeyInput40").value;
   this._currentMetaData.set("openpgpZimletMetaData", keyValArry, null, null);

   //Update ZmMetaData cache
   tk_barrydegraaff_zimbra_openpgp.prototype.initZmMetaData();
   
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
              // Tries to open the compose view on its own.
              var composeController = AjxDispatcher.run("GetComposeController");
              if(composeController) {
                 var appCtxt = window.top.appCtxt;
                 var zmApp = appCtxt.getApp();
                 var newWindow = zmApp != null ? (zmApp._inNewWindow ? true : false) : true;
                 var params = {action:ZmOperation.NEW_MESSAGE, inNewWindow:null, composeMode:Dwt.TEXT,
                 toOverride:null, subjOverride:null, extraBodyText:signed, callback:null}
                 composeController.doAction(params); // opens asynchronously the window.
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
      var publicKeys31 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys31']);
      var publicKeys32 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys32']);
      var publicKeys33 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys33']);
      var publicKeys34 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys34']);
      var publicKeys35 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys35']);
      var publicKeys36 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys36']);
      var publicKeys37 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys37']);
      var publicKeys38 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys38']);
      var publicKeys39 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys39']);
      var publicKeys40 = openpgp.key.readArmored(tk_barrydegraaff_zimbra_openpgp.metaData['zimbra_openpgp_pubkeys40']);
      var combinedPublicKeys = [publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys, publicKeys31.keys, publicKeys32.keys, publicKeys33.keys, publicKeys34.keys, publicKeys35.keys, publicKeys36.keys, publicKeys37.keys, publicKeys38.keys, publicKeys39.keys, publicKeys40.keys];

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
            // Tries to open the compose view on its own.
            var composeController = AjxDispatcher.run("GetComposeController");
            if(composeController) {
               var appCtxt = window.top.appCtxt;
               var zmApp = appCtxt.getApp();
               var newWindow = zmApp != null ? (zmApp._inNewWindow ? true : false) : true;
               var params = {action:ZmOperation.NEW_MESSAGE, inNewWindow:null, composeMode:Dwt.TEXT,
               toOverride:addresses, subjOverride:null, extraBodyText:pgpMessage, callback:null}
               composeController.doAction(params); // opens asynchronously the window.
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
            myWindow._dialog.popdown();
            // Tries to open the compose view on its own.
            var composeController = AjxDispatcher.run("GetComposeController");
            if(composeController) {
               var appCtxt = window.top.appCtxt;
               var zmApp = appCtxt.getApp();
               var newWindow = zmApp != null ? (zmApp._inNewWindow ? true : false) : true;
               var params = {action:ZmOperation.NEW_MESSAGE, inNewWindow:null, composeMode:Dwt.TEXT,
               toOverride:addresses, subjOverride:null, extraBodyText:pgpMessage, callback:null}
               composeController.doAction(params); // opens asynchronously the window.
            }
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
