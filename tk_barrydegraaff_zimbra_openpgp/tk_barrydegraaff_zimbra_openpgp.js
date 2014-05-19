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
   this.privateKeyCache='';

   /* Internet Explorer detect: http://www.pinlady.net/PluginDetect/IE/
    * Make this Zimlet know if we are running in IE
    */
   var tmp = document.documentMode, e, isIE;
   try{document.documentMode = "";}
   catch(e){ };   
   this.isIE = typeof document.documentMode == "number" || eval("/*@cc_on!@*/!1");   
   try{document.documentMode = tmp;}
   catch(e){ };
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
   /* When escape key is pressed, dwt dialog does not get cleared, and entered data remains in the browser memory
   * therefore we flush it with reload 
   * Redefine window.onkeydown, so all dwt shortcuts still work, but capture ESC key before dwt does */
   window.document.onkeydown = (function(e) {
      var cached_function = window.document.onkeydown;      
      return function(e) {
         if (!e) e = event;
         if (e.keyCode == 27) {   
            location.reload();
         }
         cached_function.apply(this, arguments); // use .apply() to call it
      };
   }());

   // Only load openpgp.js for browsers <> Internet Explorer
   if (this.isIE) {
      return;
   }
   else
   {      
      var oHead = document.getElementsByTagName('HEAD').item(0);
      var oScript= document.createElement("script");
      oScript.type = "text/javascript";
      oScript.src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.js";
      oHead.appendChild( oScript);
   }
};

/* This method gets called by the Zimlet framework when double-click is performed.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.doubleClicked =
function() {
	this.displayDialog(3, "Manage public keys", null);
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
      if(this.isIE) {
         this.encrypt_ie();
      }
      else {
         this.displayDialog(6, "Encrypt message", null);         
      }   
		break;
	case "pubkeys":
      this.displayDialog(3, "Manage public keys", null);
		break;
	case "keypair":
      this.displayDialog(5, "Generate new key pair", null);
		break;
	case "about":
      this.displayDialog(2, "About OpenPGP", '<h1><span style="font-family: sans-serif;">Zimbra OpenPGP Zimlet ' + this._zimletContext.version + '</span></h1>Running in Internet Explorer: ' + this.isIE + '<ul> <li><a href="https://github.com/barrydegraaff/pgp-zimlet"><span style="font-family: sans-serif;">https://github.com/barrydegraaff/pgp-zimlet</span></a></li> <li><a href="https://www.indiegogo.com/projects/zimbra-openpgp-zimlet"><span style="font-family: sans-serif;"></span><span style="font-family: sans-serif;">https://www.indiegogo.com/projects/zimbra-openpgp-zimlet</span></a><br style="font-family: sans-serif;"> </li><li><a href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=info%40barrydegraaff%2etk&lc=US&item_name=Zimbra%20OpenPGP%20Zimlet&no_note=0&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHostedGuest">Paypal donate</a></li></ul> <span style="font-family: sans-serif;">Copyright (C) 2014&nbsp; Barry de Graaff </span><br style="font-family: sans-serif;"> <br style="font-family: sans-serif;"> <span style="font-family: sans-serif;">Bugs and feedback: <a href="https://github.com/barrydegraaff/pgp-zimlet/issues">https://github.com/barrydegraaff/pgp-zimlet/issues</a></span><br style="font-family: sans-serif;"> <br style="font-family: sans-serif;"> <span style="font-family: sans-serif; font-weight: bold;">Thank you contributors</span><span style="font-weight: bold;">!</span><br> <ul> <li> <a href="http://www.oneCentral.nl"><span style="font-family: sans-serif;">oneCentral.nl</span></a></li> <li><span style="font-family: sans-serif;">profluid</span></li> <li><span style="font-family: sans-serif;">a.werner</span></li> <li><span style="font-family: sans-serif;">Igor Galić</span><br> <span style="font-family: sans-serif;"></span></li> <li><span style="font-family: sans-serif;">moisesber</span></li> <li><span style="font-family: sans-serif;">Brent Dalley</span></li> </ul> <span style="font-family: sans-serif; font-weight: bold;">Special thanks to the people at the <a href="http://openpgpjs.org/">OpenPGP.js</a> project<br> <br> and <a href="http://www.hivos.org">Hivos.org</a></span><br> <br> <span style="font-family: sans-serif;">This program is free software: you can redistribute it and/or modify</span><br style="font-family: sans-serif;"> <span style="font-family: sans-serif;">it under the terms of the GNU General Public License as published by</span><br style="font-family: sans-serif;"> <span style="font-family: sans-serif;">the Free Software Foundation, either version 3 of the License, or</span><br style="font-family: sans-serif;"> <span style="font-family: sans-serif;">(at your option) any later version.</span><br style="font-family: sans-serif;"> <br style="font-family: sans-serif;"> <span style="font-family: sans-serif;">This program is distributed in the hope that it will be useful,</span><br style="font-family: sans-serif;"> <span style="font-family: sans-serif;">but WITHOUT ANY WARRANTY; without even the implied warranty of</span><br style="font-family: sans-serif;"> <span style="font-family: sans-serif;">MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.&nbsp; See the</span><br style="font-family: sans-serif;"> <span style="font-family: sans-serif;">GNU General Public License for more details.</span><br style="font-family: sans-serif;"> <br style="font-family: sans-serif;"> <span style="font-family: sans-serif;">You should have received a copy of the GNU General Public License</span><br style="font-family: sans-serif;"> <span style="font-family: sans-serif;">along with this program.&nbsp; If not, see <a href="http://www.gnu.org/licenses/">http://www.gnu.org/licenses/</a>.</span><br> <br>');
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
      
   if(this.isIE) {
      if (msg.match(clearSignedRegEx)) {
         this.verify_ie(msg);  
      }
      else if (msg.match(pgpMessageRegEx)) {
         this.displayDialog(1, "Please provide private key and passphrase for decryption", msg);
      }    
      else {
         this.status("No PGP message detected.", ZmStatusView.LEVEL_WARNING);
         return;
      }
   }
   else {      
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
   }
};

/* verify method loops through public trusted keys and calls do_verify for each of the keys,
 * will update the status bar with the result (good/bad signature).
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.verify = function(message) {
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
      var combinedPublicKeys = [publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys,];

      var result = 0;

      combinedPublicKeys.forEach(function(entry) {
         if(entry[0]) {
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
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not parse your trusted public keys!", ZmStatusView.LEVEL_WARNING);
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

/* verify method for Internet Explorer 11, will post to jsp page that does verify in document mode edge.
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.verify_ie = function(message) {
   var publicKeys1 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys2 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys2").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys3 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys3").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys4 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys4").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys5 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys5").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys6 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys6").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys7 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys7").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys8 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys8").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys9 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys9").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys10 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys10").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys11 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys11").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys12 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys12").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys13 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys13").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys14 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys14").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys15 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys15").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys16 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys16").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys17 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys17").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys18 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys18").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys19 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys19").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys20 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys20").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys21 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys21").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys22 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys22").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys23 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys23").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys24 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys24").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys25 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys25").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys26 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys26").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys27 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys27").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys28 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys28").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys29 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys29").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys30 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var combinedPublicKeys = [publicKeys1, publicKeys2, publicKeys3, publicKeys4, publicKeys5, publicKeys6, publicKeys7, publicKeys8, publicKeys9, publicKeys10, publicKeys11, publicKeys12, publicKeys13, publicKeys14, publicKeys15, publicKeys16, publicKeys17, publicKeys18, publicKeys19, publicKeys20, publicKeys21, publicKeys22, publicKeys23, publicKeys24, publicKeys25, publicKeys26, publicKeys27, publicKeys28, publicKeys29, publicKeys30];

	// Create form object to post to jsp
	var form = document.createElement("form");
	form.setAttribute("method", "POST");
   form.setAttribute("target", "_BLANK");
	form.setAttribute("action", "/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp_verify_ie.jsp");

   var hiddenField = document.createElement("input");	
   hiddenField.setAttribute("type", "hidden"); 
   hiddenField.setAttribute("name", "message");
   hiddenField.setAttribute("value", message);
   form.appendChild(hiddenField); 

   var hiddenField = document.createElement("input");	
   hiddenField.setAttribute("type", "hidden"); 
   hiddenField.setAttribute("name", "publicKeys");
   hiddenField.setAttribute("value", combinedPublicKeys);
   form.appendChild(hiddenField); 	

	document.body.appendChild(form); // inject the form object into the body section
	form.submit();
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
	var view = new DwtComposite(this.getShell());
	view.getHtmlElement().style.overflow = "auto";

   switch(id) {
   case 1:
      view.setSize("600", "180");
      html = "<table><tr><td colspan='2'>" +
      "Please provide private key and passphrase for decryption. Your private key will remain in memory until you reload your browser.<br><br>" +
      "</td></tr><tr><td>" +
      "Private Key:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + this.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      "Passphrase:" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value=''>" +
      "</td></tr><tr><td>" +
      "Message:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" id='message'>"+message+"</textarea>" +
      "</td></tr></table>";	
      view.getHtmlElement().innerHTML = html;
      this._dialog = new ZmDialog( { title:title, view:view, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON] } );      
      if(this.isIE) {
         this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnDecrypt_ie)); 
      } 
      else {
         this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnDecrypt)); 
      }   
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn)); 
      break;
   case 2:
      view.setSize("600", "350");
      view.getHtmlElement().innerHTML = message;
      this._dialog = new ZmDialog( { title:title, view:view, parent:this.getShell(), standardButtons:[DwtDialog.DISMISS_BUTTON] } );      
      this._dialog.setButtonListener(DwtDialog.DISMISS_BUTTON, new AjxListener(this, this.cancelBtn)); 
      break;   
   case 3:
      view.setSize("600", "500");
      html = "<table><tr><td colspan='2'>" +
      "Copy-paste ASCII armored public keys you trust here.<br><br>" +
      "</td></tr><tr><td style=\"width:100px\">Public Key 1:</td><td style=\"width:500px\"><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput1'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 2:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput2'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys2").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 3:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput3'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys3").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 4:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput4'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys4").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 5:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput5'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys5").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 6:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput6'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys6").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 7:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput7'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys7").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 8:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput8'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys8").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 9:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput9'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys9").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 10:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput10'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys10").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 11:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput11'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys11").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 12:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput12'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys12").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 13:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput13'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys13").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 14:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput14'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys14").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 15:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput15'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys15").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 16:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput16'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys16").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 17:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput17'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys17").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 18:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput18'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys18").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 19:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput19'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys19").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 20:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput20'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys20").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 21:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput21'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys21").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 22:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput22'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys22").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 23:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput23'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys23").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 24:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput24'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys24").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 25:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput25'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys25").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 26:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput26'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys26").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 27:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput27'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys27").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 28:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput28'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys28").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 29:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput29'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys29").value + "</textarea></td></tr>" +
      "<tr><td>Public Key 30:</td><td><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput30'/>" + this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value + "</textarea></td></tr>" +
      "</table>";	
      view.getHtmlElement().innerHTML = html;
      this._dialog = new ZmDialog( { title:title, view:view, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON] } );      
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnPubKeySave)); 
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));       
      break; 
   case 4:
      view.setSize("600", "350");
      html = "<table><tr><td colspan='2'>" +
      "Please compose a message below to be signed with your private key. Your private key will remain in memory until you reload your browser.<br><br>" +
      "</td></tr><tr><td style=\"width:100px;\">" +
      "Private Key:" +
      "</td><td style=\"width:500px\">" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + this.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      "Passphrase:" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value=''>" +
      "</td></tr><tr><td>" +
      "Message:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'></textarea>" +
      "</td></tr></table>";	
      view.getHtmlElement().innerHTML = html;
      this._dialog = new ZmDialog( { title:title, view:view, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON] } );      
      if(this.isIE) {
         this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnSign_ie)); 
      }
      else {
         this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnSign)); 
      }   
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn)); 
      break; 
   case 5:
      view.setSize("600", "160");
      html = "<table><tr><td colspan='2'>" +
      "Please enter User ID (example: Firstname Lastname &lt;your@email.com&gt;) and passphrase for new key pair.<br><br>" +
      "</td></tr><tr><td style=\"width:100px;\">" +
      "User ID:" +
      "</td><td style=\"width:500px\">" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='uid' value=''>" +
      "</td></tr><tr><td>" +
      "Passphrase:" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value=''>" +
      "</td></tr><tr><td style=\"width:100px;\">" +
      "Key length:" +
      "</td><td style=\"width:500px\">" +
      "<select class=\"barrydegraaff_zimbra_openpgp-input\" id=\"keyLength\" name=\"keyLength\"><option value=\"512\">512</option><option selected=\"selected\" value=\"1024\">1024</option><option value=\"2048\">2048</option><option value=\"4096\">4096</option></select>" +
      "</td></tr><tr><td colspan='2'>" +
      "<br>Higher key length is better security, but slower. If you have trouble generating a key pair choose a lower key length or use an external program.<br><br>" +
      "</td></tr></table>";	
      view.getHtmlElement().innerHTML = html;
      this._dialog = new ZmDialog( { title:title, view:view, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON] } );      
      if(this.isIE) {
         this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnKeyPair_ie)); 
      }
      else {
         this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnKeyPair));          
      }   
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn)); 
      break;   
   case 6:
      view.setSize("600", "250");
      html = "<table><tr><td colspan='2'>" +
      "Please compose a message below to be encrypted.<br><br>" +
      "</td></tr><tr><td>" +
      "Recipient:" +
      "</td><td>" + this.pubKeySelect() + 
      "</td></tr><tr><td>" +
      "Message:" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'></textarea>" +
      "</td></tr></table>";	
      view.getHtmlElement().innerHTML = html;
      this._dialog = new ZmDialog( { title:title, view:view, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON] } );      
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
	var privateKeyInput = document.getElementById("privateKeyInput").value;
   this.privateKeyCache = privateKeyInput;
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
      this.displayDialog(2,'Decrypted result','<textarea class="barrydegraaff_zimbra_openpgp-msg" style="height:340px;">'+decrypted+'</textarea>');
   }
};

/* This method is called when the dialog "OK" button is clicked after private key has been entered for Internet Explorer
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnDecrypt_ie =
function() {
	var privateKeyInput = document.getElementById("privateKeyInput").value;
   this.privateKeyCache = privateKeyInput;
   var passphraseInput = document.getElementById("passphraseInput").value;
   var message = document.getElementById("message").value;
    
   // What is the DWT method to destroy this._dialog? This only clears its contents.
   this._dialog.clearContent();
   this._dialog.popdown();

	// Create form object to post to jsp
	var form = document.createElement("form");
	form.setAttribute("method", "POST");
   form.setAttribute("target", "_BLANK");
	form.setAttribute("action", "/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp_decrypt_ie.jsp");

   var hiddenField = document.createElement("input");	
   hiddenField.setAttribute("type", "hidden"); 
   hiddenField.setAttribute("name", "message");
   hiddenField.setAttribute("value", message);
   form.appendChild(hiddenField); 

   var hiddenField = document.createElement("input");	
   hiddenField.setAttribute("type", "hidden"); 
   hiddenField.setAttribute("name", "privateKey");
   hiddenField.setAttribute("value", privateKeyInput);
   form.appendChild(hiddenField); 

   var hiddenField = document.createElement("input");	
   hiddenField.setAttribute("type", "hidden"); 
   hiddenField.setAttribute("name", "passphrase");
   hiddenField.setAttribute("value", passphraseInput);
   form.appendChild(hiddenField); 	

	document.body.appendChild(form); // inject the form object into the body section
	form.submit();   
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

/* This method is called for signing messages
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnSign =
function() {
	var privateKeyInput = document.getElementById("privateKeyInput").value;
   this.privateKeyCache = privateKeyInput;   
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
         tk_barrydegraaff_zimbra_openpgp.prototype.status("Sign failed!", ZmStatusView.LEVEL_WARNING);
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

      // Tries to open the compose view on its own.
      var composeController = AjxDispatcher.run("GetComposeController");
      if(composeController) {
         var appCtxt = window.top.appCtxt;
         var zmApp = appCtxt.getApp();
         var newWindow = zmApp != null ? (zmApp._inNewWindow ? true : false) : true;
         var params = {action:ZmOperation.NEW_MESSAGE, inNewWindow:null, 
         toOverride:null, subjOverride:null, extraBodyText:signed, callback:null}
         composeController.doAction(params); // opens asynchronously the window.
      }      
   }
};

/* This method is called for signing messages in Internet Explorer.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnSign_ie =
function() {
	var privateKeyInput = document.getElementById("privateKeyInput").value;
   this.privateKeyCache = privateKeyInput;
   var passphraseInput = document.getElementById("passphraseInput").value;
   var message = document.getElementById("message").value;
    
   // What is the DWT method to destroy this._dialog? This only clears its contents.
   this._dialog.clearContent();
   this._dialog.popdown();

	// Create form object to post to jsp
	var form = document.createElement("form");
	form.setAttribute("method", "POST");
   form.setAttribute("target", "_BLANK");
	form.setAttribute("action", "/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp_sign_ie.jsp");

   var hiddenField = document.createElement("input");	
   hiddenField.setAttribute("type", "hidden"); 
   hiddenField.setAttribute("name", "message");
   hiddenField.setAttribute("value", message);
   form.appendChild(hiddenField); 

   var hiddenField = document.createElement("input");	
   hiddenField.setAttribute("type", "hidden"); 
   hiddenField.setAttribute("name", "privateKey");
   hiddenField.setAttribute("value", privateKeyInput);
   form.appendChild(hiddenField); 

   var hiddenField = document.createElement("input");	
   hiddenField.setAttribute("type", "hidden"); 
   hiddenField.setAttribute("name", "passphrase");
   hiddenField.setAttribute("value", passphraseInput);
   form.appendChild(hiddenField); 	

	document.body.appendChild(form); // inject the form object into the body section
	form.submit();   
};

/* This method is called when the dialog "OK" button is clicked for key pair generation.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnKeyPair =
function() {
	var userid = document.getElementById("uid").value;
   var keyLength = document.getElementById("keyLength").value;
   var passphrase = document.getElementById("passphraseInput").value;
   
   if ((userid) && (passphrase)) {
      //var key = openpgp.generateKeyPair(openpgp.enums.publicKey.rsa_encrypt_sign, 512, userid, passphrase);
      var key = openpgp.generateKeyPair({numBits: keyLength, userId: userid, passphrase: passphrase});
   
      if((key.privateKeyArmored) && (key.publicKeyArmored))
      {
         // What is the DWT method to destroy this._dialog? This only clears its contents.
         this._dialog.clearContent();
         this._dialog.popdown();
         
         this.displayDialog(2,'Your new key pair','Please make sure to store this information in a safe place:<br><br><textarea class="barrydegraaff_zimbra_openpgp-msg" style="height:320px;">Passphrase ' + passphrase + ' for ' + userid + '\r\n\r\n'+key.privateKeyArmored+'\r\n\r\n'+key.publicKeyArmored+'\r\n\r\nKey length: '+keyLength+' bits</textarea>');      
      }
   }
   else {
      this.status("You must provide a user ID and passphrase", ZmStatusView.LEVEL_WARNING);
   }
};

/* This method is called when the dialog "OK" button is clicked for key pair generation for Internet Explorer.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnKeyPair_ie =
function() {
	var userid = document.getElementById("uid").value;
   var passphrase = document.getElementById("passphraseInput").value;
   var keyLength = document.getElementById("keyLength").value;
   
   if ((userid) && (passphrase)) {   
      // What is the DWT method to destroy this._dialog? This only clears its contents.
      this._dialog.clearContent();
      this._dialog.popdown();
   
      // Create form object to post to jsp
      var form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("target", "_BLANK");
      form.setAttribute("action", "/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp_keypair_ie.jsp");
     
      var hiddenField = document.createElement("input");	
      hiddenField.setAttribute("type", "hidden"); 
      hiddenField.setAttribute("name", "userid");
      hiddenField.setAttribute("value", userid);
      form.appendChild(hiddenField); 
   
      var hiddenField = document.createElement("input");	
      hiddenField.setAttribute("type", "hidden"); 
      hiddenField.setAttribute("name", "keyLength");
      hiddenField.setAttribute("value", keyLength);
      form.appendChild(hiddenField); 	

      var hiddenField = document.createElement("input");	
      hiddenField.setAttribute("type", "hidden"); 
      hiddenField.setAttribute("name", "passphrase");
      hiddenField.setAttribute("value", passphrase);
      form.appendChild(hiddenField); 	
   
      document.body.appendChild(form); // inject the form object into the body section
      form.submit();   
   }
   else {
      this.status("You must provide a user ID and passphrase", ZmStatusView.LEVEL_WARNING);
   }
};

/* This method generates an html select list with public keys
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.pubKeySelect =
function() {
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
      var combinedPublicKeys = [publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys,];
   
      var result = '<select class="barrydegraaff_zimbra_openpgp-input" id="pubKeySelect">';
   
      combinedPublicKeys.forEach(function(entry) {
         if(entry[0]) {
            userid = entry[0].users[0].userId.userid.replace(/\</g,"&lt;");
            userid = userid.replace(/\>/g,"&gt;") ;            
            result = result + '<option value="'+entry[0].armor()+'">'+userid+'</option>';
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
   var pubKeySelect = document.getElementById("pubKeySelect").value;
   var msg = document.getElementById("message").value;

   try {
   var publicKey = openpgp.key.readArmored(pubKeySelect);
   var pgpMessage = openpgp.encryptMessage(publicKey.keys, msg);
   } 
   catch (err) {
      // This is probably never trown, as encryptMessage never fails
      tk_barrydegraaff_zimbra_openpgp.prototype.status("Could not encrypt message!", ZmStatusView.LEVEL_WARNING);
   }
   if(pgpMessage)
   {
      // What is the DWT method to destroy this._dialog? This only clears its contents.
      this._dialog.clearContent();
      this._dialog.popdown();
   
      // Tries to open the compose view on its own.
      var composeController = AjxDispatcher.run("GetComposeController");
      if(composeController) {
         var appCtxt = window.top.appCtxt;
         var zmApp = appCtxt.getApp();
         var newWindow = zmApp != null ? (zmApp._inNewWindow ? true : false) : true;
         var params = {action:ZmOperation.NEW_MESSAGE, inNewWindow:null, 
         toOverride:publicKey.keys[0].users[0].userId.userid, subjOverride:null, extraBodyText:pgpMessage, callback:null}
         composeController.doAction(params); // opens asynchronously the window.
      }
   }
};

/* encrypt method for Internet Explorer 11, will post to jsp page that does verify in document mode edge.
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.encrypt_ie = function(message) {
   var publicKeys1 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys2 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys2").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys3 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys3").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys4 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys4").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys5 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys5").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys6 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys6").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys7 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys7").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys8 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys8").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys9 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys9").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys10 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys10").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys11 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys11").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys12 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys12").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys13 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys13").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys14 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys14").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys15 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys15").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys16 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys16").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys17 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys17").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys18 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys18").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys19 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys19").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys20 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys20").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys21 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys21").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys22 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys22").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys23 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys23").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys24 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys24").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys25 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys25").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys26 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys26").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys27 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys27").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys28 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys28").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys29 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys29").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var publicKeys30 = this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value + '<tk_barrydegraaff_zimbra_openpgp>';
   var combinedPublicKeys = [publicKeys1, publicKeys2, publicKeys3, publicKeys4, publicKeys5, publicKeys6, publicKeys7, publicKeys8, publicKeys9, publicKeys10, publicKeys11, publicKeys12, publicKeys13, publicKeys14, publicKeys15, publicKeys16, publicKeys17, publicKeys18, publicKeys19, publicKeys20, publicKeys21, publicKeys22, publicKeys23, publicKeys24, publicKeys25, publicKeys26, publicKeys27, publicKeys28, publicKeys29, publicKeys30];

	// Create form object to post to jsp
	var form = document.createElement("form");
	form.setAttribute("method", "POST");
   form.setAttribute("target", "_BLANK");
	form.setAttribute("action", "/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/tk_barrydegraaff_zimbra_openpgp_encrypt_ie.jsp");

   var hiddenField = document.createElement("input");	
   hiddenField.setAttribute("type", "hidden"); 
   hiddenField.setAttribute("name", "publicKeys");
   hiddenField.setAttribute("value", combinedPublicKeys);
   form.appendChild(hiddenField); 	

	document.body.appendChild(form); // inject the form object into the body section
	form.submit();
}

/* This method is called when the dialog "CANCEL" or "DISMISS" button is clicked
 */
tk_barrydegraaff_zimbra_openpgp.prototype.cancelBtn =
function() {
   // What is the DWT method to destroy this._dialog? This only clears its contents.
   this._dialog.clearContent();
   this._dialog.popdown();
};
