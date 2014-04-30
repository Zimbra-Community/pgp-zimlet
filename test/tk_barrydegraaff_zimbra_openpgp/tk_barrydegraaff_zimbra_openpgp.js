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

tk_barrydegraaff_zimbra_openpgp.prototype.doDrop =
function(zmObject) {
   var msgObj = zmObject.srcObj;
   
   //if its a conversation i.e. "ZmConv" object, get the first loaded message "ZmMailMsg" object within that.
   if (zmObject.type == "CONV") {
      msgObj  = zmObject.getFirstHotMsg();
   }

   var clearSignedRegEx = new RegExp('[\-]*BEGIN PGP SIGNATURE[\-]*');
   var msg = zmObject.body;
   
   if (msg.match(clearSignedRegEx)) {
      try {
         var publicKeys = openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys").value);
      }
      catch(err) {
         this.status("Could not parse your trusted public keys!", ZmStatusView.LEVEL_WARNING);
         return;
      }   

      try {
         var message = openpgp.cleartext.readArmored(msg);
      }
      catch(err) {  
         this.status("Could not read armored message!", ZmStatusView.LEVEL_CRITICAL);
         return;
      }   
      //console.log("publicKeys: %o", publicKeys);
      //console.log("message: %o", message);
      try {
         var verified = openpgp.verifyClearSignedMessage(publicKeys.keys, message);
      }
      catch(err) {  
         this.status("Signature verification failed!", ZmStatusView.LEVEL_CRITICAL);
         return;
      }         

      //console.log("verified: %o", verified.signatures);
   
      try {
         if(verified.signatures[0].valid==true)
         {
            this.status("Got a good signature.", ZmStatusView.LEVEL_INFO);
            return;
         }
         else
         {
            var appController = appCtxt.getAppController();		
            this.status("Got a BAD signature.", ZmStatusView.LEVEL_CRITICAL);
            return;
         }
      }
      catch(err) {  
         this.status("Got a BAD signature.", ZmStatusView.LEVEL_CRITICAL);
         return;
      }      
   }
   else {
      this.status("No PGP signed message detected.", ZmStatusView.LEVEL_WARNING);
      return;  
   }
};

tk_barrydegraaff_zimbra_openpgp.prototype.status = function(text, type) {         
   var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.FADE_OUT ];
   appCtxt.getAppController().setStatusMsg(text, type, null, transitions);
};
