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
   tk_barrydegraaff_zimbra_openpgp.settings = {};

   //Load localization strings
   tk_barrydegraaff_zimbra_openpgp.prototype.lang();
   
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
   //Make additional mail headers available
   AjxPackage.require({name:"MailCore", callback:new AjxCallback(this, this._applyRequestHeaders)});
   //Per user configuration options are jsonified from a single Zimbra userProperty
   try {
      tk_barrydegraaff_zimbra_openpgp.settings = JSON.parse(this.getUserProperty("zimbra_openpgp_options"));         
   } 
   catch(err) {   
      //Load default values when no options are set (new user)
      tk_barrydegraaff_zimbra_openpgp.settings['enable_contacts_scanning'] = 'false';
      tk_barrydegraaff_zimbra_openpgp.settings['language'] = 'english';   
   } 
   
   //Some options are set, but not language, so set it to 'english' by default
   if(!tk_barrydegraaff_zimbra_openpgp.settings['language'])
   {
      tk_barrydegraaff_zimbra_openpgp.settings['language'] = 'english';
   }

   this._zimletContext._panelActionMenu.args[0][0].label = tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][1];
   this._zimletContext._panelActionMenu.args[0][1].label = tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][2];
   this._zimletContext._panelActionMenu.args[0][2].label = tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][3];
   this._zimletContext._panelActionMenu.args[0][3].label = tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][4];
   this._zimletContext._panelActionMenu.args[0][4].label = tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][59];
   this._zimletContext._panelActionMenu.args[0][5].label = tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][60];
   this._zimletContext._panelActionMenu.args[0][6].label = tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][5];
   
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

/* Make the Content-Type header available to this Zimlet to determine PGP Mime
 * */
tk_barrydegraaff_zimbra_openpgp.prototype._applyRequestHeaders =
function() {	
   ZmMailMsg.requestHeaders["Content-Type"] = "Content-Type";
};


/*This method is called when a message is viewed in Zimbra
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.onMsgView = function (msg, oldMsg, view) {  
   var bp = msg.getBodyPart(ZmMimeTable.TEXT_PLAIN);
   if (!bp)
   {
      try
      {
         if ((msg.attrs['Content-Type'].indexOf('multipart/encrypted') > -1) ||
         (msg.attrs['Content-Type'].indexOf('application/pgp-encrypted') > -1))
         {
            //PGP Mime
            var msgSearch = '';
         }
         else
         {
            //not a plain text message and no PGP mime, means no PGP            
            return;
         }
      }
      catch (err) 
      {
         // Content-Type header not found
         var msgSearch = '';
      }       
   }
   else
   {
      //This is a plain-text message with PGP content
      var msgSearch = bp.node.content.substring(0,60);
   }   

   var url = [];
   var i = 0;
   var proto = location.protocol;
   var port = Number(location.port);
   url[i++] = proto;
   url[i++] = "//";
   url[i++] = location.hostname;
   if (port && ((proto == ZmSetting.PROTO_HTTP && port != ZmSetting.HTTP_DEFAULT_PORT) 
      || (proto == ZmSetting.PROTO_HTTPS && port != ZmSetting.HTTPS_DEFAULT_PORT))) {
      url[i++] = ":";
      url[i++] = port;
   }
   url[i++] = "/home/";
   url[i++]= AjxStringUtil.urlComponentEncode(appCtxt.getActiveAccount().name);
   url[i++] = "/message.txt?fmt=txt&id=";
   url[i++] = msg.id;

   var getUrl = url.join(""); 

   if(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
   {
      console.log(getUrl);
   }   

   //Now make an ajax request and read the contents of this mail, including all attachments as text
   //it should be base64 encoded
   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", getUrl, false );
   xmlHttp.send( null );
     
   //Overwrite the msg variable here intentionally, since it is not complete for large emails
   var msg = xmlHttp.responseText;

   if(msgSearch=='')
   {
      //In case of PGP mime, we look in the entire mail for PGP Message block
      msgSearch=msg;
   }
   
   if(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
   {
      console.log(msg);
   }

   if (msgSearch.indexOf("BEGIN PGP SIGNED MESSAGE") > 0 ) {          
      if (tk_barrydegraaff_zimbra_openpgp.prototype.addressBookReadInProgress == true)
      {
         //Still loading contacts, ignoring your addressbook
         this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][6], ZmStatusView.LEVEL_INFO);   
      }

      try {
         var message = openpgp.cleartext.readArmored(msg);
      }
      catch(err) {
         //Could not read armored message!
         this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][7], ZmStatusView.LEVEL_CRITICAL);
         return;
      }
      this.verify(message);
   }
   else if (msgSearch.indexOf("BEGIN PGP MESSAGE") > 0 ) {
      if (tk_barrydegraaff_zimbra_openpgp.prototype.addressBookReadInProgress == true)
      {
         //Still loading contacts, ignoring your addressbook
         this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][6], ZmStatusView.LEVEL_INFO);   
      }

      //Please provide private key and passphrase for decryption
      this.displayDialog(1, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][8], msg);
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
   toolbar.setContent("<button style='margin:10px;' onclick='tk_barrydegraaff_zimbra_openpgp.prototype._resetApp()'>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][9]+"</button> <b>OpenPGP "+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][10]+": " + tk_barrydegraaff_zimbra_openpgp.version + "</b><br><br>");
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
	//Launch Manage keys
   this.displayDialog(3, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][3], null);
};

/* Context menu handler
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.menuItemSelected =
function(itemId) {
	switch (itemId) {
	case "sign":
      this.displayDialog(4, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][1], null);
		break;
	case "encrypt":
      this.displayDialog(6, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][2], null);
		break;
	case "pubkeys":
      this.displayDialog(3, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][3], null);
		break;
	case "keypair":
      this.displayDialog(5, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][4], null);
		break;
	case "encrypt-file":
      this.displayDialog(7, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][59], null);
		break;
	case "decrypt-file":
      this.displayDialog(8, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][60], null);
		break;      
	case "help":
      tk_barrydegraaff_zimbra_openpgp.openPGPApp = this.createApp('OpenPGP ' + tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][11], "tk_barrydegraaff_zimbra_openpgp-panelIcon");
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
   //http://wiki.zimbra.com/wiki/Zimlet_cookbook_based_on_JavaScript_API#Download_Entire_Email
	this.srcMsgObj = zmObject.srcObj;
	if(this.srcMsgObj.type == "CONV"){
		this.srcMsgObj = this.srcMsgObj.getFirstHotMsg();
	}
	var url = [];
	var i = 0;
	var proto = location.protocol;
	var port = Number(location.port);
	url[i++] = proto;
	url[i++] = "//";
	url[i++] = location.hostname;
	if (port && ((proto == ZmSetting.PROTO_HTTP && port != ZmSetting.HTTP_DEFAULT_PORT) 
		|| (proto == ZmSetting.PROTO_HTTPS && port != ZmSetting.HTTPS_DEFAULT_PORT))) {
		url[i++] = ":";
		url[i++] = port;
	}
	url[i++] = "/home/";
	url[i++]= AjxStringUtil.urlComponentEncode(appCtxt.getActiveAccount().name);
	url[i++] = "/message.txt?fmt=txt&id=";
	url[i++] = this.srcMsgObj.id;

	var getUrl = url.join(""); 

   if(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
   {
      console.log(getUrl);
   }   

   //Now make an ajax request and read the contents of this mail, including all attachments as text
   //it should be base64 encoded
   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", getUrl, false );
   xmlHttp.send( null );
   
   var msg = xmlHttp.responseText;   

   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');

   if (tk_barrydegraaff_zimbra_openpgp.prototype.addressBookReadInProgress == true)
   {
      //Still loading contacts, ignoring your addressbook
      this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][6], ZmStatusView.LEVEL_INFO);   
   }

   var clearSignedRegEx = new RegExp('[\-]*BEGIN PGP SIGNATURE[\-]*');
   var pgpMessageRegEx = new RegExp('[\-]*BEGIN PGP MESSAGE[\-]*');
   
    if (msg.match(clearSignedRegEx)) {
      try {
         var message = openpgp.cleartext.readArmored(msg);
      }
      catch(err) {
         //Could not read armored message!
         this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][7], ZmStatusView.LEVEL_CRITICAL);
         return;
      }
      this.verify(message);
   }
   else if (msg.match(pgpMessageRegEx)) {
      //Please provide private key and passphrase for decryption
      this.displayDialog(1, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][8], msg);
   }
   else {
      //No PGP message detected.
      this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][12], ZmStatusView.LEVEL_WARNING);
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

      var combinedPublicKeys = [].concat(publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys);

      tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys.forEach(function(pubKey) {
         var pubKey = openpgp.key.readArmored(pubKey);
         combinedPublicKeys = combinedPublicKeys.concat(pubKey.keys);
      });
   }
   catch(err) {
      //Could not parse your trusted public keys!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][13], ZmStatusView.LEVEL_WARNING);
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
            //Got a good signature
            myWindow.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][14], ZmStatusView.LEVEL_INFO);
            sigStatus ='<b style="color:green">'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][14]+'</b>';
         } else {
            //Got a BAD signature
            myWindow.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][15], ZmStatusView.LEVEL_CRITICAL);
            sigStatus ='<b style="color:red">'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][15]+'</b>';
         }
         if (message.text.indexOf('<html><body>') > -1 ) 
         {       
            myWindow.displayDialog(2, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][16] + ': ' + sigStatus, '<div style="width:650px; height: 350px; overflow-x: auto; overflow-y: auto; background-color:white; padding:5px;">'+message.text+'</div>');
         }
      },
      function (err) {
         //Error verifying signature
         myWindow.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][17], ZmStatusView.LEVEL_WARNING);
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
      //Decrypt message
      if((localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()]) && (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()];
	   } 
      html = "<div style='width:650px; height: 180px; overflow-x: hidden; overflow-y: scroll;'><table><tr><td colspan='2'>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][8] + '. ' + tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][18]+"<br><br>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][19] + ":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20] + ":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '') + "'>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][21] + ":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'>"+message+"</textarea>" +
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
      //Default dialog
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      this._dialog.setContent(message);
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.cancelBtn));
      break;
   case 3:
      //Manage keys

      // make supported languages list in HTML
      langListName = ['English','Español','Italiano','Nederlands','Tiếng Việt'];
      langListValue = ['english','spanish','italian','dutch','vietnamese'];
      
      langListHtml = "<select id='zimbra_openpgp_language' name='zimbra_openpgp_language'>";
      for (i = 0; i < langListValue.length; i++) {
         if (langListValue[i] == tk_barrydegraaff_zimbra_openpgp.settings['language']) {
            langListHtml += "<option value=\"" + langListValue[i] + "\" selected=\"selected\">" + langListName[i] + "</option>";
         } else {
            langListHtml += "<option value=\"" + langListValue[i] + "\">" + langListName[i] + "</option>";
         }
      }
      langListHtml += "</selected>";
      
      // make list of public keys in HTML
      pubkeyListHtml = "";
      for (i = 1; i < 31; i++) {
         numStr = i.toString();
         pubkeyNumStr = "zimbra_openpgp_pubkeys" + numStr;
         pubkeyListHtml += "<tr><td>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][26]+" "+numStr+":</td><td><br><textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput"+numStr+"'/>" + (this.getUserPropertyInfo(pubkeyNumStr).value ? this.getUserPropertyInfo(pubkeyNumStr).value : '') + "</textarea><br>" + "<label for='publicKeyInfo"+numStr+"'>"+(this.getUserPropertyInfo(pubkeyNumStr).value ? this.pubkeyInfo(this.getUserPropertyInfo(pubkeyNumStr).value) : '')+"</label>" + "</td></tr>";
      }
      
      html = "<div style='width:650px; height: 500px; overflow-x: hidden; overflow-y: scroll;'><table><tr><td colspan='2'>" +
      "<ul>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][22]+"</ul><br>" +
      "</td></tr>" +      
      "<tr><td style=\"width:100px\">"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][19]+":</td><td style=\"width:500px\">"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][25]+"<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='privateKeyInput'/>" + (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] ? localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] : '') + "</textarea></td></tr>" +
      "<tr><td>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20]+":</td><td><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][24]+"<input class=\"barrydegraaff_zimbra_openpgp-input\" id='privatePassInput' type='password' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '') + "'></td></tr>" +
      "<tr><td><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][23]+":</td><td><br>" + langListHtml + "</td></tr>" +
      "<tr><td><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][27]+":</td><td><br><input type='checkbox' id='enable_contacts_scanning' name='enable_contacts_scanning' " + (tk_barrydegraaff_zimbra_openpgp.settings['enable_contacts_scanning']=='false' ? '' : 'checked') + " value='true'>" + "</td></tr>" +
      pubkeyListHtml + "</table></div>";
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      this._dialog.setContent(html);
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnPubKeySave));
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));
      break;
   case 4:
      //Sign message
      if((localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()]) && (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()];
	   }
      html = "<div style='width:650px; height: 350px; overflow-x: hidden; overflow-y: hidden;'><table style='width:100%'><tr><td colspan='2'>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][28] + " " + tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][18]+"<br><br>" +
      "</td></tr><tr><td style=\"width:100px;\">" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][19]+":" +
      "</td><td style=\"width:500px\">" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '') + "'>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][21]+":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'>"+ (message ? message : '' ) +"</textarea>" +
      "</td></tr></table></div><input type='hidden' id='returnType' value=" + ( message ? 'existing-compose-window' : 'new-compose-window' )+">";
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      this._dialog.setContent(html);
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnSign));
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));
      break;
   case 5:
      //Generate keypair
      if (appCtxt.get(ZmSetting.DISPLAY_NAME))
      {
         displayname = appCtxt.get(ZmSetting.DISPLAY_NAME);
      }
      else
      {
         displayname = appCtxt.getActiveAccount().name;
      }  
      html = "<div style='width:650px; height: 240px; overflow-x: hidden; overflow-y: hidden;'><table style='width:650px;'><tr><td colspan='2'>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][29]+"<br><br>" +
      "</td></tr><tr><td style=\"width:100px;\">" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][30]+":" +
      "</td><td style=\"width:500px\">" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='uid' value='" + displayname + ' <' +appCtxt.getActiveAccount().name+">'>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : tk_barrydegraaff_zimbra_openpgp.prototype.pwgen()) + "'>" +
      "</td></tr><tr><td></td><td><button type=\"button\" onclick='document.getElementById(\"passphraseInput\").value=tk_barrydegraaff_zimbra_openpgp.prototype.pwgen()'>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][34]+"</button></td></tr><tr><td style=\"width:100px;\">" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][31]+":" +
      "</td><td style=\"width:500px\">" +
      "<select class=\"barrydegraaff_zimbra_openpgp-input\" id=\"keyLength\" name=\"keyLength\"><option selected=\"selected\" value=\"1024\">1024</option><option value=\"2048\">2048</option><option value=\"4096\">4096</option></select>" +
      "</td></tr><tr><td colspan='2'>" +
      "<br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][32]+"<br><br>" +
      "</td></tr><tr><td colspan='2'>" +
      "<input type='checkbox' checked='checked' name='keyStore' id='keyStore' value='yes'>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][33]+"<br>" +
      "</td></tr></table></div>";
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true  } );
      this._dialog.setContent(html);
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnKeyPair));
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));
      break;
   case 6:
      //Encrypt message
      if((localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()]) && (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()];
	   }      
      html = "<div style='width:650px; height: 350; overflow-x: hidden; overflow-y: hidden;'><table style='width:100%'><tr><td colspan='2'>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][36]+" <a style='color:blue; text-decoration: underline;' onclick=\"tk_barrydegraaff_zimbra_openpgp.prototype.menuItemSelected('help-new')\">"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][11]+"</a>.<br><br>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][35]+":" +
      "</td><td>" + this.pubKeySelect() +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][21]+":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'>"+ (message ? message : '' ) +"</textarea>" +
      "</td></tr><tr><td colspan='2'><br><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][37]+"<br><br></td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][19]+":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '') + "'>" +
      "</td></tr></table></div><input type='hidden' id='returnType' value=" + ( message ? 'existing-compose-window' : 'new-compose-window' )+">";      
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      this._dialog.setContent(html);
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnEncrypt));
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));
      break;
   case 7:
      if((localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()]) && (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()];
	   }      
      html = "<div style='width:650px; height: 350; overflow-x: hidden; overflow-y: hidden;'><table style='width:100%'><tr><td colspan='2'>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][61]+"<br><br>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][35]+":" +
      "</td><td>" + this.pubKeySelect() +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][65]+":" +
      "</td><td>" +
      "<input type='file' id='fileInput'>" +
      "</td></tr><tr><td colspan='2'><br><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][62]+"<br><br></td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][19]+":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '') + "'>" +
      "</td></tr></table></div>";      
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      this._dialog.setContent(html);

      var fileInput = document.getElementById('fileInput');
      fileInput.addEventListener('change', function(e) {
         var file = fileInput.files[0];
         var reader = new FileReader();
         reader.onload = function(e) {
            var result = reader.result.split(",");
            tk_barrydegraaff_zimbra_openpgp.file = result[1];
            tk_barrydegraaff_zimbra_openpgp.filename = file.name;
         }
         reader.readAsDataURL(file);			
      });
      
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnEncryptFile));
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));
      break;      
   case 8:
      if((localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()]) && (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()];
	   }      
      html = "<div style='width:650px; height: 350; overflow-x: hidden; overflow-y: hidden;'><table style='width:100%'><tr><td colspan='2'>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][63]+"<br><br>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][65]+":" +
      "</td><td>" +
      "<input type='file' id='fileInput'>" +
      "</td></tr><tr><td colspan='2'><br><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][64]+":<br><br></td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][19]+":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + (this.getUserPropertyInfo("zimbra_openpgp_privatepass").value ? this.getUserPropertyInfo("zimbra_openpgp_privatepass").value : '') + "'>" +
      "</td></tr></table></div>";      
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      this._dialog.setContent(html);

      var fileInput = document.getElementById('fileInput');
      fileInput.addEventListener('change', function(e) {
         var file = fileInput.files[0];
         var reader = new FileReader();
         reader.onload = function(e) {
            tk_barrydegraaff_zimbra_openpgp.file = reader.result;
            tk_barrydegraaff_zimbra_openpgp.filename = file.name;
         }
         reader.readAsText(file);			
      });
      
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okBtnDecryptFile));
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));
      break;     
   }
	this._dialog._setAllowSelection();
   this._dialog.popup();
};

/* This method is called when the dialog "OK" button is clicked after private key has been entered.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnDecrypt =
function() {  
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js')
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("message").style.backgroundImage = "url('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/loading.gif')";

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
      document.getElementById("message").style.backgroundImage = "url('')";
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      //Could not parse private key!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][38], ZmStatusView.LEVEL_WARNING);
      return;
   }

   if (success) {
      try {
         var message = openpgp.message.readArmored(msg);
      }
      catch(err) {
         document.getElementById("message").style.backgroundImage = "url('')";
         this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         //Could not read armored message!
         this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][7], ZmStatusView.LEVEL_CRITICAL);
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
      var pubKey = [].concat(publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys);
           
      tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys.forEach(function(pubKeyEntry) {
         var pubKeyEntry = openpgp.key.readArmored(pubKeyEntry);
         pubKey = pubKey.concat(pubKeyEntry.keys);
      });
   }
   catch(err) {
      document.getElementById("message").style.backgroundImage = "url('')";
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      //Could not parse your trusted public keys!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][13], ZmStatusView.LEVEL_WARNING);
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
                        //got a good signature
                        sigStatus ='<b style="color:green">'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][14]+'</b>';
                        tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][14], ZmStatusView.LEVEL_INFO);
                     }
                     else
                     {
                        sigStatus ='<b style="color:red">'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][15]+'</b>';
                        tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][15], ZmStatusView.LEVEL_CRITICAL);
                     }
                  }
               }
               catch (err) 
               {
                  sigStatus =tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][39];
               }                 

               var preOpen = '';
               var preClose = '';
               var original = decrypted.text;
               var msgSearch = decrypted.text.substring(0,60);               
               if (msgSearch.indexOf("Content-Type: multipart/mixed;") > -1 ) {
                  try{
                     var boundary = decrypted.text.match(/boundary="([^"\\]*(?:\\.[^"\\]*)*)"/i);                     
                     var multipart = decrypted.text.split(boundary[1]);
                     multipart.forEach(function(part) {
                        var partArr=part.split('\n\n', 2);
                        if (partArr[0].indexOf('Content-Disposition: attachment')> 0)
                        {                                                   
                           var filename = partArr[0].match(/filename="([^"\\]*(?:\\.[^"\\]*)*)"/i);
                           partArr[1] = partArr[1].split('=\n', 1);
                           partArr[1] = partArr[1] + '=';
                           partArr[1] = partArr[1].replace(/(\r\n|\n|\r)/gm,"");
                           preClose = preClose + '<br><a onclick="tk_barrydegraaff_zimbra_openpgp.prototype.downloadBlob(\''+filename[1]+'\',\'octet/stream\',\''+partArr[1]+'\')">'+filename[1]+'</a>';
                        }                     
                        else if(partArr[0].indexOf('text/plain')> 0)
                        {
                           preOpen = '<pre>'+part+'</pre>';
                        }
                        else if(partArr[0].indexOf('text/html')> 0)
                        {
                           preOpen = part;
                        }
                     });
                     if(preClose.length > 0)
                     {
                        preClose = '<br><br><hr style="border: none; height: 1px; background-color: #888888;"><b>'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][40]+'</b>'+preClose;   
                     }
                     decrypted.text='';
                  } catch (err) {
                     console.log('multipart parser failed: ' + err);
                     preOpen = '<pre>';
                     preClose = '</pre>';
                     decrypted.text=original;
                  }
                  
               }
               else
               {               
                  if (decrypted.text.indexOf('<html><body>') < 0 ) 
                  {
                     preOpen = '<pre>';
                     preClose = '</pre>';
                  }
                  else
                  {
                     preOpen = '';
                     preClose = '';
                  }
               }
               if(myWindow.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
               {
                  console.log('original message:' + original);
               }

               myWindow._dialog.setPosition(DwtControl.ABSOLUTE_STYLE);
               myWindow._dialog.setSize("700px","450px");
               myWindow._dialog.setLocation(Dwt.DEFAULT,"50px");
               myWindow._dialog.setTitle(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][41]+' '+ sigStatus);
               myWindow._dialog.setContent('<div style="width:650px; height: 400px; overflow-x: auto; overflow-y: auto; background-color:white; padding:5px;">'+ preOpen + decrypted.text + preClose +'</div>');
               myWindow._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(myWindow, myWindow.cancelBtn));
               myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
            },
            function(err) {
               document.getElementById("message").style.backgroundImage = "url('')";
               myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
               myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
               //Decryption failed!
               tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][43], ZmStatusView.LEVEL_WARNING);
            }
        );
   }
   else {
      document.getElementById("message").style.backgroundImage = "url('')";
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);      
      //Wrong passphrase!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][44], ZmStatusView.LEVEL_WARNING);
   }
};

/* This method is called when the dialog "OK" button is clicked when decrypting file.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnDecryptFile =
function() {
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("privateKeyInput").style.backgroundImage = "url('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/loading.gif')";
   
   var privateKeyInput = document.getElementById("privateKeyInput").value;
   tk_barrydegraaff_zimbra_openpgp.privateKeyCache = privateKeyInput;
   var passphraseInput = document.getElementById("passphraseInput").value;
   var msg = tk_barrydegraaff_zimbra_openpgp.file;   

   try {
      var privKeys = openpgp.key.readArmored(privateKeyInput);
      var privKey = privKeys.keys[0];
      var success = privKey.decrypt(passphraseInput);
   }
   catch (err) {
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      //Could not parse private key!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][38], ZmStatusView.LEVEL_WARNING);
      return;
   }

   if (success) {
      try {
         var message = openpgp.message.readArmored(msg);
      }
      catch(err) {
         this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
         //Could not read armored message!
         this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][7], ZmStatusView.LEVEL_CRITICAL);
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
      var pubKey = [].concat(publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys);

      tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys.forEach(function(pubKeyEntry) {
         var pubKeyEntry = openpgp.key.readArmored(pubKeyEntry);
         pubKey = pubKey.concat(pubKeyEntry.keys);
      });
   }
   catch(err) {
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      //Could not parse your trusted public keys!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][13], ZmStatusView.LEVEL_WARNING);
      return;
   }
      // There should be a cleaner way to do this than stashing 
      // the parent in myWindow but I've not worked it out yet!
      var myWindow = this;
        openpgp.decryptAndVerifyMessage(privKey, pubKey, message).then(
           function(decrypted) {               
               try 
               {
                  if(decrypted.text+decrypted.signatures[0].valid)
                  {
                     if(decrypted.signatures[0].valid==true)
                     {                        
                        //Got a good signature.
                        tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][14], ZmStatusView.LEVEL_INFO);
                     }
                     else
                     {                      
                        //Got a BAD signature.
                        tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][15], ZmStatusView.LEVEL_CRITICAL);
                     }
                  }
               }
               catch (err) 
               {
               }                 
               
               tk_barrydegraaff_zimbra_openpgp.prototype.downloadBlob(tk_barrydegraaff_zimbra_openpgp.filename,'',decrypted.text);
               //Free memory
               tk_barrydegraaff_zimbra_openpgp.file = '';
               try {
                  myWindow._dialog.popdown();
               } catch (err) { }   
            },
            function(err) {
               myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
               myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
               document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
               //Decryption failed!
               tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][43], ZmStatusView.LEVEL_WARNING);
            }
        );
   }
   else {
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      //Wrong passphrase!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][44], ZmStatusView.LEVEL_WARNING);
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
   tk_barrydegraaff_zimbra_openpgp.settings['enable_contacts_scanning'] = (document.getElementById("enable_contacts_scanning").checked ? 'true' : 'false');
   tk_barrydegraaff_zimbra_openpgp.settings['language'] = (document.getElementById("zimbra_openpgp_language").value);

   //Store values to LDAP
   this.setUserProperty("zimbra_openpgp_options", JSON.stringify(tk_barrydegraaff_zimbra_openpgp.settings), false);
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
   //Suppress dwt dispose on popdown type errors
   try {
      this._dialog.popdown();
   } catch (err) { }   
};

/* This method is called for signing messages
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnSign =
function() {
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("message").style.backgroundImage = "url('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/loading.gif')";
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
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("message").style.backgroundImage = "url('')";
      //Could not parse private key!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][38], ZmStatusView.LEVEL_WARNING);
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
              try {
                 myWindow._dialog.popdown();
              } catch (err) { }   
           },
           function(err) {
              myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
              myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
              document.getElementById("message").style.backgroundImage = "url('')";
              //Signing failed!
              tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][45], ZmStatusView.LEVEL_WARNING);
           }
        );
   }
   else {
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("message").style.backgroundImage = "url('')";
      //Wrong passphrase!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][44], ZmStatusView.LEVEL_WARNING);
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
      //You must provide a user ID and passphrase
      this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][46], ZmStatusView.LEVEL_WARNING);
      return;
   }

   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
   this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.cancelBtn));
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);

   //Now generating your key pair
   this._dialog.setTitle(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][47]);
   this._dialog.setContent('<div style="width:650px; height: 240px; overflow-x: hidden; overflow-y: hidden;">'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][48]+'<br><br><br><br><img src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/loading.gif" style="width:48px; height:48px; display: block; margin-left: auto; margin-right: auto" alt="loading"></div>');

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
         //Your new key pair
         myWindow._dialog.setTitle(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][50]);
         myWindow._dialog.setContent('<div style="width:650px; height: 240px; overflow-x: hidden; overflow-y: auto;"><table style="width:650px;">'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][49]+':<br><br><textarea class="barrydegraaff_zimbra_openpgp-msg" style="height:200px;">Passphrase ' + passphrase + ' for ' + userid + '\r\n\r\n'+key.privateKeyArmored+'\r\n\r\n'+key.publicKeyArmored+'\r\n\r\nlength: '+keyLength+' ' + '\r\nfingerprint: '+key.key.primaryKey.fingerprint+' \r\ncreated: '+key.key.primaryKey.created+'</textarea></div>');
         myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      }       
   });
};

/* This method gets public key details
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.pubkeyInfo =
function(pubkey) {
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
   try {
      var publicKeys = openpgp.key.readArmored(pubkey);
      
      userid = publicKeys.keys[0].users[0].userId.userid;
      userid = userid.replace(/\</g,"&lt;");
      userid = userid.replace(/\>/g,"&gt;");
      
      publicKeyPacket = publicKeys.keys[0].primaryKey;
      var keyLength = "";
      if (publicKeyPacket != null) {
         if (publicKeyPacket.mpi.length > 0) {
            keyLength = (publicKeyPacket.mpi[0].byteLength() * 8);
         }
      }
      
      result = "<small>&bull; User ID[0]: " + userid + "<br>&bull; Fingerprint: " + publicKeyPacket.fingerprint + "<br>&bull; Primary key length: " + keyLength + "<br>&bull; Created: " + publicKeyPacket.created + '</small>';
   }
   catch(err) {
      //Could not parse your trusted public keys!
      result = '<small>'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][13]+'</small>';
   }
   return result;
}

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
      var combinedPublicKeys = [publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys];
           
      tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys.forEach(function(pubKey) {
         var pubKey = openpgp.key.readArmored(pubKey);
         combinedPublicKeys = combinedPublicKeys.concat([pubKey.keys]);            
      });      
      
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
      //Could not parse your trusted public keys!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][13], ZmStatusView.LEVEL_WARNING);
      return;
   }
   return result;
}

/* This method is called when OK is pressed in encrypt dialog
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnEncrypt =
function() {
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("message").style.backgroundImage = "url('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/loading.gif')";
 
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

   if (pubKeys.length < 1)
   {
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("message").style.backgroundImage = "url('')";
      //Please select recipient(s).
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][51], ZmStatusView.LEVEL_WARNING);
      return;
   }   
   
   var privateKeyInput = document.getElementById("privateKeyInput").value;
   var passphrase = document.getElementById("passphraseInput").value;

   // There should be a cleaner way to do this than stashing 
   // the parent in myWindow but I've not worked it out yet!
   var myWindow = this;
      
   if ((privateKeyInput.length > 0) && (passphrase.length > 0))
   {
      tk_barrydegraaff_zimbra_openpgp.privateKeyCache = privateKeyInput;

      try {
         var privKeys = openpgp.key.readArmored(privateKeyInput);
         var privKey = privKeys.keys[0];
         var success = privKey.decrypt(passphrase);
      }
      catch (err) {
         myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         document.getElementById("message").style.backgroundImage = "url('')";
         //Could not parse private key!
         tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][38], ZmStatusView.LEVEL_WARNING);
         return;
      }

      if (!success) {
         this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         document.getElementById("message").style.backgroundImage = "url('')";
         //Wrong passphrase!
         tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][44], ZmStatusView.LEVEL_WARNING);
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
            try {
               myWindow._dialog.popdown();
            } catch (err) { }   
         }, 
         function(err) {
            myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
            myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
            document.getElementById("message").style.backgroundImage = "url('')";
            //Could not encrypt message!
            tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][52], ZmStatusView.LEVEL_WARNING);
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
            try { 
               myWindow._dialog.popdown();
            } catch (err) { }   
         },
         function(err) {
            myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
            myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
            document.getElementById("message").style.backgroundImage = "url('')";
            if( pubKeySelect.selectedOptions.length==0)
            {
               //Please select recipient(s).
               tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][51], ZmStatusView.LEVEL_WARNING);
            }
            else
            {
               //Could not encrypt message!
               tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][52], ZmStatusView.LEVEL_WARNING);
            }
        });
     }   
};

/* This method is called when OK is pressed in encrypt-file dialog
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnEncryptFile =
function() {
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("privateKeyInput").style.backgroundImage = "url('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/loading.gif')";
 
   openpgp.initWorker('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js');
   var pubKeySelect = document.getElementById("pubKeySelect");
   
   var msg = tk_barrydegraaff_zimbra_openpgp.file;
     
   var pubKeys = [];
   var addresses = '';

   // Build Public Keys list from selected
   for (k=0; k < pubKeySelect.options.length ; k++) {
      if (pubKeySelect.options[k].selected) {
         pubKeys=pubKeys.concat(openpgp.key.readArmored(pubKeySelect.options[k].value).keys);
         addresses=addresses + pubKeySelect.options[k].label + '; ';
      }   
   }

   if (pubKeys.length < 1)
   {
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      //Please select recipient(s).
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][51], ZmStatusView.LEVEL_WARNING);
      return;
   }   
   
   var privateKeyInput = document.getElementById("privateKeyInput").value;
   var passphrase = document.getElementById("passphraseInput").value;

   // There should be a cleaner way to do this than stashing 
   // the parent in myWindow but I've not worked it out yet!
   var myWindow = this;
   
   if ((privateKeyInput.length > 0) && (passphrase.length > 0))
   {
      tk_barrydegraaff_zimbra_openpgp.privateKeyCache = privateKeyInput;
      try {
         var privKeys = openpgp.key.readArmored(privateKeyInput);
         var privKey = privKeys.keys[0];
         var success = privKey.decrypt(passphrase);
      }
      catch (err) {
         myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
         //Could not parse private key!
         tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][38], ZmStatusView.LEVEL_WARNING);
         return;
      }

      if (!success) {
         this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
         //Wrong passphrase!
         tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][44], ZmStatusView.LEVEL_WARNING);
         return;
      }
      
      openpgp.signAndEncryptMessage(pubKeys, privKey, msg, addresses).then(
         function(pgpMessage) {
            tk_barrydegraaff_zimbra_openpgp.prototype.downloadBlob('PGP-'+tk_barrydegraaff_zimbra_openpgp.filename,'zimbra/pgp',pgpMessage);
            //Free memory
            tk_barrydegraaff_zimbra_openpgp.file = '';
            try {
               myWindow._dialog.popdown();
            } catch (err) { }   
         }, 
         function(err) {
            myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
            myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
            document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
            //Could not encrypt message!
            tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][52], ZmStatusView.LEVEL_WARNING);
        });      
   }
   else
   {   
      openpgp.encryptMessage(pubKeys, msg, addresses).then(
         function(pgpMessage) {  
            tk_barrydegraaff_zimbra_openpgp.prototype.downloadBlob('PGP-'+tk_barrydegraaff_zimbra_openpgp.filename,'zimbra/pgp',pgpMessage);
            //Free memory
            tk_barrydegraaff_zimbra_openpgp.file = '';
            try { 
               myWindow._dialog.popdown();
            } catch (err) { }   
         },
         function(err) {
            myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
            myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
            document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
            if( pubKeySelect.selectedOptions.length==0)
            {
               //Please select recipient(s).
               tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][51], ZmStatusView.LEVEL_WARNING);
            }
            else
            {
               //Could not encrypt message!
               tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][52], ZmStatusView.LEVEL_WARNING);
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
   if (controller._action != 'NEW_MESSAGE')
   {
      //only integrate this zimlet on new email messages, not forwarded messages
      return;
   }
   
   // bug fix #7192 - disable detach toolbar button
   toolbar.enable(ZmOperation.DETACH_COMPOSE, false);   
   
	if(viewId.indexOf("COMPOSE") >=0){
      if (toolbar.getButton('OPENPGPENCRYPT'))
      {
         //button already defined
         return;
      }
		var buttonArgs = {
			text    : tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][2],
			tooltip: tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][2] + " " + tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][53],
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
			text    : tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][1],
			tooltip: tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][1] + " " + tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][53],
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
      this.displayDialog(2, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][54], tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][55]+": <br><br><img src='/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/help/no-signatures.png' alt=''>");
      return;      
   }
   
   if(message.length < 1)
   {
      //Please compose message first
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][56], ZmStatusView.LEVEL_INFO);
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
   
   this.displayDialog(6, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][2], message);
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
      this.displayDialog(2, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][54], tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][55]+": <br><br><img src='/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/help/no-signatures.png' alt=''>");
      return;      
   }
   
   if(message.length < 1)
   {
      //Please compose message first
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][56], ZmStatusView.LEVEL_INFO);
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
   
   this.displayDialog(4, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][1], message);
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
 * based on ajax call to export function
 * */

tk_barrydegraaff_zimbra_openpgp.prototype.readAddressBook = function() {
   if (tk_barrydegraaff_zimbra_openpgp.settings['enable_contacts_scanning'] == 'false')
   {
      //Undefine contacts from addressbook
      tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys = [];
      return;
   }

   //For performance, no concurrent scanning of addressbook 
   if (tk_barrydegraaff_zimbra_openpgp.prototype.addressBookReadInProgress == true)
   {
      return;
   }
   
   tk_barrydegraaff_zimbra_openpgp.prototype.addressBookReadInProgress = true;
   //OpenPGP scanning contacts in progress
   console.log('------------------------------------- '+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][58]);

	var url = [];
	var i = 0;
	var proto = location.protocol;
	var port = Number(location.port);
	url[i++] = proto;
	url[i++] = "//";
	url[i++] = location.hostname;
	if (port && ((proto == ZmSetting.PROTO_HTTP && port != ZmSetting.HTTP_DEFAULT_PORT) 
		|| (proto == ZmSetting.PROTO_HTTPS && port != ZmSetting.HTTPS_DEFAULT_PORT))) {
		url[i++] = ":";
		url[i++] = port;
	}
	url[i++] = "/home/";
	url[i++]= AjxStringUtil.urlComponentEncode(appCtxt.getActiveAccount().name);
	url[i++] = "/Contacts?fmt=txt&charset=UTF-8";

	var getUrl = url.join(""); 

   //Now make an ajax request and read the contents of this mail, including all attachments as text
   //it should be base64 encoded
   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", getUrl, false );
   xmlHttp.send( null );
   
   var contacts = xmlHttp.responseText; 
   contacts = contacts.split('"');

   tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys = [];
   contacts.forEach(function(entry) {      
      if(entry.indexOf("BEGIN PGP PUBLIC KEY BLOCK") > 0 ) 
      {
         tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys = [].concat(tk_barrydegraaff_zimbra_openpgp.addressBookPublicKeys, entry);
      }
   });

   tk_barrydegraaff_zimbra_openpgp.prototype.addressBookReadInProgress = false;
   //OpenPGP scanning contacts completed
   console.log('------------------------------------- '+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][57]);
};


/* Attachment integration
 * Decode and download a base64 encoded attachment
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.downloadBlob = function (filename, type, base64Data) {
   filename = filename ? filename : 'file.bin';
   type = type ? type : 'octet/stream';
   
   if (type=='zimbra/pgp')
   {
      //is already a pgp armored
      var blob = new Blob([base64Data], { type: type });
   }
   else
   {
      var dataBin = tk_barrydegraaff_zimbra_openpgp.prototype.base64DecToArr(base64Data);
      var blob = new Blob([dataBin], { type: type });
   }
   
   if (!window.navigator.msSaveOrOpenBlob) 
   {
      var a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = filename;
      a.click();
   }
   else
   {
      window.navigator.msSaveOrOpenBlob(blob, filename);
   }
}

/* Base64 decode binary safe
 https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
*/
tk_barrydegraaff_zimbra_openpgp.prototype.b64ToUint6 = function (nChr) {
  return nChr > 64 && nChr < 91 ?
      nChr - 65
    : nChr > 96 && nChr < 123 ?
      nChr - 71
    : nChr > 47 && nChr < 58 ?
      nChr + 4
    : nChr === 43 ?
      62
    : nChr === 47 ?
      63
    :
      0;
}

tk_barrydegraaff_zimbra_openpgp.prototype.base64DecToArr = function (sBase64, nBlocksSize) {
  var
    sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
    nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= tk_barrydegraaff_zimbra_openpgp.prototype.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;
    }
  }
  return taBytes;
}
