/*
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
*/

//Constructor
tk_barrydegraaff_zimbra_openpgp = function() {
};

//Required by Zimbra
tk_barrydegraaff_zimbra_openpgp.prototype = new ZmZimletBase;
tk_barrydegraaff_zimbra_openpgp.prototype.constructor = tk_barrydegraaff_zimbra_openpgp;

//Required by Zimbra
tk_barrydegraaff_zimbra_openpgp.prototype.toString = 
function() {
   return "tk_barrydegraaff_zimbra_openpgp";
};

//Required by Zimbra
tk_barrydegraaff_zimbra_openpgp.prototype.init = function() {
};

/* doDrop handler for verify and decrypt messages
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.doDrop =
function(zmObject) {
   var msgObj = zmObject.srcObj;
   
   //if its a conversation i.e. "ZmConv" object, get the first loaded message "ZmMailMsg" object within that.
   if (zmObject.type == "CONV") {
      msgObj  = zmObject.getFirstHotMsg();
   }

   var clearSignedRegEx = new RegExp('[\-]*BEGIN PGP SIGNATURE[\-]*');
   var pgpMessageRegEx = new RegExp('[\-]*BEGIN PGP MESSAGE[\-]*');
   var msg = zmObject.body;
   
   if (msg.match(clearSignedRegEx)) {
      try {
         var message = openpgp.cleartext.readArmored(msg);
      }
      catch(err) {  
         this.status("Could not read armored message! + err", ZmStatusView.LEVEL_CRITICAL);
         return;
      }  
      this.verify(message);  
   }
   else if (msg.match(pgpMessageRegEx)) {      
      this.displayPrivateKeyInputDialog(msg);
   }   
   else {
      this.status("No PGP signed message detected.", ZmStatusView.LEVEL_WARNING);
      return;  
   }
};

tk_barrydegraaff_zimbra_openpgp.prototype.decrypt = function(message) {         
   
}   

/* verify method loops through public trusted keys and calls do_verify for each of the keys, 
 * will update the status bar with the result (good/bad signature).
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.verify = function(message) {         
   try {
      //Zimbra can only accept 5000 chars or so for each user input, so we have to combine multiple.
      var publicKeys = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys").value);
      var publicKeys1 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value);
      var publicKeys2 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys2").value);
      var publicKeys3 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys3").value);
      var publicKeys4 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys4").value);
      var publicKeys5 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys5").value);
      var publicKeys6 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys6").value);
      var publicKeys7 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys7").value);
      var publicKeys8 = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys8").value);
      var combinedPublicKeys = [publicKeys.keys, publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys];
      
      var result = 0;
      
      combinedPublicKeys.forEach(function(entry) {
         if(entry) {
            result += tk_barrydegraaff_zimbra_openpgp.prototype.do_verify(message, entry);
         }
      });
      
      if(result > 0) {
         tk_barrydegraaff_zimbra_openpgp.prototype.status("Got a good signature.", ZmStatusView.LEVEL_INFO);
      }
      else {
         tk_barrydegraaff_zimbra_openpgp.prototype.status("Got a BAD signature.", ZmStatusView.LEVEL_CRITICAL);
      };
   }
   catch(err) {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not parse your trusted public keys!"+err, ZmStatusView.LEVEL_WARNING);
      return;
   }
}

/* do_verify method calls openpgp.verifyClearSignedMessage, returns boolean 1 for good signature or 0 for bad signature
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.do_verify = function(message, keyObj) {               
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



/* status method show a Zimbra status message
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.status = function(text, type) {         
   var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.FADE_OUT ];
   appCtxt.getAppController().setStatusMsg(text, type, null, transitions);
};


/* Displays PrivateKey dialog.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.displayPrivateKeyInputDialog = 
function(message) {
	if (this._dialog) { //if zimlet dialog already exists...
		this._dialog.popup(); // simply popup the dialog
		return;
	}
		
	var view = new DwtComposite(this.getShell()); // creates an empty div as a child of main shell div
	view.setSize("600", "150"); // set width and height
	view.getHtmlElement().style.overflow = "auto"; // adds scrollbar
	view.getHtmlElement().innerHTML = this.privateKeyInputDialog(message); // insert HTML to the dialog
	
	// pass the title and view information to create dialog box
	this._dialog = new ZmDialog( { title:"Please provide private key", view:view, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON] } );

	// set listener for "OK" button events
	this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnDecrypt)); 

	//show the dialog
	this._dialog.popup();
};

/* Creates the dialog for PrivateKey input.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.privateKeyInputDialog =
function(message) {
	var html = new Array();
	var i = 0;
	html[i++] = "<table>";
	html[i++] = "<tr>";
	html[i++] = "<td colspan='2'>";
	html[i++] = "The information you enter here is cached in your session until you log-off or re-load your browser window.<br><br>";
	html[i++] = "</td>";
	html[i++] = "</tr>";
	html[i++] = "<tr>";
	html[i++] = "<td>";
	html[i++] = "Private Key:";
	html[i++] = "</td>";
	html[i++] = "<td>";
	html[i++] = "<textarea rows=\"3\" cols=\"20\" id='privateKeyInput'/></textarea>";
	html[i++] = "</td>";
	html[i++] = "</tr>";
	html[i++] = "<tr>";
	html[i++] = "<td>";
	html[i++] = "Passphrase:";
	html[i++] = "</td>";
	html[i++] = "<td>";
	html[i++] = "<input id='passphraseInput' type='text' value=''>";
	html[i++] = "</td>";
	html[i++] = "</tr>";
	html[i++] = "<tr>";
	html[i++] = "<td>";
	html[i++] = "Message:";
	html[i++] = "</td>";
	html[i++] = "<td>";
	html[i++] = "<textarea id='message'>"+message+"</textarea>";
	html[i++] = "</td>";
	html[i++] = "</tr>"
	html[i++] = "</table>";
	
	return html.join("");
};

/* This method is called when the dialog "OK" button is clicked.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnDecrypt =
function() {
	var privateKeyInput = document.getElementById("privateKeyInput").value;
   var passphraseInput = document.getElementById("passphraseInput").value;
   var msg = document.getElementById("message").value;
   
   try {
      var privKeys = openpgp.key.readArmored(privateKeyInput);   
      var privKey = privKeys.keys[0];
      var success = privKey.decrypt(passphraseInput);
   }
   catch (err) {      
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not parse private key!", ZmStatusView.LEVEL_WARNING);
   }   
   
   if (success) {   
      try {
         var message = openpgp.message.readArmored(msg);
         var decrypted = openpgp.decryptMessage(privKey, message);
      }
      catch (err)
      {
         tk_barrydegraaff_zimbra_openpgp.prototype.status("Decryption failed!", ZmStatusView.LEVEL_WARNING);      
      }
   }
   else {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Wrong password!", ZmStatusView.LEVEL_WARNING);            
   }   
   
         
   if(decrypted)
   {   
      this.simpleDialog('Decrypted result',decrypted);
	   this._dialog.popdown(); // hide the dialog
   }   
};

tk_barrydegraaff_zimbra_openpgp.prototype.simpleDialog =
function(title, message) {
	alert(title + ": " + message);
}
