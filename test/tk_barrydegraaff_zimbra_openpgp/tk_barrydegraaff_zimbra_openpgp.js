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

/* This method gets called by the Zimlet framework when double-click is performed.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.doubleClicked =
function() {
	this.displayDialog(3, "Maintain public keys", null);
};

/* Context menu handler
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.menuItemSelected =
function(itemId) {
	switch (itemId) {
	case "sign":
      this.displayDialog(4, "Sign message", null);
		break;
	}
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
      this.displayDialog(1, "Please provide private key", msg);
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
      var combinedPublicKeys = [publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys,];

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

/* displays dialogs.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.displayDialog = 
function(id, title, message) {
		
	var view = new DwtComposite(this.getShell());
	view.getHtmlElement().style.overflow = "auto";

   switch(id) {
   case 1:
      view.setSize("600", "170");
      html = "<table><tr><td colspan='2'>" +
      "The information you enter here is NOT saved to your computer or the server.<br><br>" +
      "</td></tr><tr><td>" +
      "Private Key:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/></textarea>" +
      "</td></tr><tr><td>" +
      "Passphrase:" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='text' value=''>" +
      "</td></tr><tr><td>" +
      "Message:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" id='message'>"+message+"</textarea>" +
      "</td></tr></table>";	
      view.getHtmlElement().innerHTML = html;
      this._dialog = new ZmDialog( { title:title, view:view, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON] } );      
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnDecrypt)); 
      break;
   case 2:
      view.setSize("600", "350");
      view.getHtmlElement().innerHTML = '<textarea class="barrydegraaff_zimbra_openpgp-msg">'+message+'</textarea>';
      this._dialog = new ZmDialog( { title:title, view:view, parent:this.getShell(), standardButtons:[DwtDialog.DISMISS_BUTTON] } );      
      break;   
   case 3:
      view.setSize("600", "500");
      html = "<table><tr><td colspan='2'>" +
      "Copy-paste ASCII armored public keys you trust here, limit 5000 chars per key.<br><br>" +
      "</td></tr><tr><td>Public Key 1:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput1'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 2:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput2'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys2").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 3:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput3'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys3").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 4:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput4'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys4").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 5:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput5'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys5").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 6:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput6'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys6").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 7:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput7'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys7").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 8:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput8'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys8").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 9:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput9'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys9").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 10:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput10'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys10").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 11:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput11'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys11").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 12:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput12'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys12").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 13:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput13'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys13").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 14:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput14'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys14").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 15:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput15'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys15").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 16:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput16'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys16").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 17:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput17'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys17").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 18:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput18'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys18").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 19:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput19'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys19").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 20:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput20'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys20").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 21:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput21'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys21").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 22:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput22'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys22").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 23:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput23'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys23").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 24:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput24'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys24").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 25:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput25'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys25").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 26:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput26'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys26").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 27:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput27'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys27").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 28:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput28'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys28").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 29:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput29'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys29").value + "</textarea></td></tr>" +
      "</td></tr><tr><td>Public Key 30:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='publicKeyInput30'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value + "</textarea></td></tr>" +
      "</table>";	
      view.getHtmlElement().innerHTML = html;
      this._dialog = new ZmDialog( { title:title, view:view, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON] } );      
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnPubKeySave)); 
      break; 
   case 4:
      view.setSize("600", "350");
      html = "<table><tr><td colspan='2'>" +
      "Please compose a message below to be signed with your private key.<br><br>" +
      "</td></tr><tr><td>" +
      "Private Key:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/></textarea>" +
      "</td></tr><tr><td>" +
      "Passphrase:" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='text' value=''>" +
      "</td></tr><tr><td>" +
      "Message:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'></textarea>" +
      "</td></tr></table>";	
      view.getHtmlElement().innerHTML = html;
      this._dialog = new ZmDialog( { title:title, view:view, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON] } );      
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnSign)); 
      break;           
   }
	this._dialog.popup();
};

/* This method is called when the dialog "OK" button is clicked after private key has been entered.
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
	   // What is the DWT method to destroy this._dialog? This only clears its contents.
      this._dialog.clearContent();
      this._dialog.popdown();
      this.displayDialog(2,'Decrypted result',decrypted);
   }
};

/* This method is called when the dialog "OK" button is clicked after public keys have been maintained
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnPubKeySave =
function() {
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

   this._dialog.clearContent();
   this._dialog.popdown();
};

/* This method is called when the dialog "OK" button is clicked after private key has been entered.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnSign =
function() {
	var privateKeyInput = document.getElementById("privateKeyInput").value;
   var passphrase = document.getElementById("passphraseInput").value;
   var msg = document.getElementById("message").value;

   try {
      var privKeys = openpgp.key.readArmored(privateKeyInput);
      var privKey = privKeys.keys[0];
      var success = privKey.decrypt(passphrase);
   }
   catch (err) {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not parse private key!", ZmStatusView.LEVEL_WARNING);
   }

   if (success) {
      try {
         var signed = openpgp.signClearMessage(privKeys.keys, msg);
      }
      catch (err)
      {
         tk_barrydegraaff_zimbra_openpgp.prototype.status("Sign failed!" + err, ZmStatusView.LEVEL_WARNING);
      }
   }
   else {
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Wrong password!", ZmStatusView.LEVEL_WARNING);
   }

   if(signed)
   {   
	   // What is the DWT method to destroy this._dialog? This only clears its contents.
      this._dialog.clearContent();
      this._dialog.popdown();
      this.displayDialog(2,'Signed message',signed);
   }
};
