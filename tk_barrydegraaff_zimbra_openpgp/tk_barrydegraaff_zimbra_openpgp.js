/**
This file is part of the Zimbra OpenPGP Zimlet project.
Copyright (C) 2014-2016  Barry de Graaff

Bugs and feedback: https://github.com/Zimbra-Community/pgp-zimlet/issues

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.

The JSDoc is published here: http://barrydegraaff.github.io/OpenPGPZimletJSDoc/OpenPGPZimlet.html
*/

//Constructor
function tk_barrydegraaff_zimbra_openpgp_HandlerObject() {
};


tk_barrydegraaff_zimbra_openpgp_HandlerObject.prototype = new ZmZimletBase();
tk_barrydegraaff_zimbra_openpgp_HandlerObject.prototype.constructor = tk_barrydegraaff_zimbra_openpgp_HandlerObject;

tk_barrydegraaff_zimbra_openpgp_HandlerObject.prototype.toString =
function() {
   return "tk_barrydegraaff_zimbra_openpgp_HandlerObject";
};

/** 
 * Creates the Zimbra OpenPGP Zimlet, extends {@link https://files.zimbra.com/docs/zimlet/zcs/8.6.0/jsapi-zimbra-doc/symbols/ZmZimletBase.html ZmZimletBase}.
 * @class
 * @extends ZmZimletBase
 *  */
var OpenPGPZimlet = tk_barrydegraaff_zimbra_openpgp_HandlerObject;

/** 
 * This method gets called when Zimbra Zimlet framework initializes.
 * OpenPGPZimlet uses the init function to load openpgp.js and configure the user settings and runtime variables.
 */
OpenPGPZimlet.prototype.init = function() {
   /**
    * A string that holds the PGP Private Key. This is filled from the users local storage or for each session, if the user provides it.
    * @type string
    * @global
    * */
   OpenPGPZimlet.privateKeyCache='';
   /**
    * A string that holds the Private Key Passphrase. This is filled from server LDAP or the users local storage or for each session, if the user provides it.
    * @type string
    * @global
    * */
   OpenPGPZimlet.privatePassCache='';
   /**
    * An array that holds ASCII armored PGP Public Key blocks read from the users addressbook. Optional feature that is disabled by default.
    * @type array
    * @global
    * */
   OpenPGPZimlet.addressBookPublicKeys = [];   
   /**
    * An array that holds the JSON parsed value of the zimbra_openpgp_options user property for various configuration settings of this Zimlet.
    * @type array
    * @global
    * */
   OpenPGPZimlet.settings = {};

   //Load localization strings with fallback
   OpenPGPZimlet.prototype.lang();
   
   //openpgp.js cannot be included via zimlet xml definition, 
   //will fail to work after deploy using zmzimletctl deploy
   var oHead = document.getElementsByTagName('HEAD').item(0);
   var oScript= document.createElement("script");
   oScript.type = "text/javascript";
   oScript.src=this.getResource("openpgp.js");
   oHead.appendChild( oScript); 
   
   //Load optional worker for openpgp.js, it benefits firefox mostly
   var workerPath = this.getResource("openpgp.worker.js");
   try {
      setTimeout(function(){ openpgp.initWorker({ path:workerPath }); }, 1000);
   } catch (err)
   {
      try {
         setTimeout(function(){ openpgp.initWorker({ path:workerPath }); }, 10000);
      } catch (err)
      {
         //lets hope this never happens
         try {
            setTimeout(function(){ openpgp.initWorker({ path:workerPath }); }, 60000);
         } catch (err) {}
      }   
   }
   
   OpenPGPZimlet.version=this._zimletContext.version;
   //Make additional mail headers available
   AjxPackage.require({name:"MailCore", callback:new AjxCallback(this, this._applyRequestHeaders)});
   //Per user configuration options are jsonified from a single Zimbra userProperty
   try {
      OpenPGPZimlet.settings = JSON.parse(this.getUserProperty("zimbra_openpgp_options"));         
   } 
   catch(err) {   
      //Load default values when no options are set (new user)
      OpenPGPZimlet.settings['enable_contacts_scanning'] = 'false';
   }

   //Some options are set, but not auto_decrypt, so set it to 'true' by default
   if(!OpenPGPZimlet.settings['auto_decrypt'])
   {
      OpenPGPZimlet.settings['auto_decrypt'] = 'true';
   }

   //Some options are set, but not store_passphrase_locally, so set it to 'false' by default
   if(!OpenPGPZimlet.settings['store_passphrase_locally'])
   {
      OpenPGPZimlet.settings['store_passphrase_locally'] = 'false';
   }

   /**
    *  The maximum email size ZmSetting.MAX_MESSAGE_SIZE, before Zimbra displays 'This message is too large to display'
    * This limit only applies to clear-signed messages, as they are read via ZmMailMsg object that is also truncated.
    * We still want to use ZmMailMsg object to avoid breaking ASCII Armored clear signed messages (decode utf-8 printed-quotable)
    * 
    * Encrypted messages are read via the REST API and are not limited in size. Since hardened to be only ASCII, they are never 
    * utf-8 or otherwise encoded, so we can use REST for this.
    */
   if(OpenPGPZimlet.settings['max_message_size'])
   {
      appCtxt.set(ZmSetting.MAX_MESSAGE_SIZE, OpenPGPZimlet.settings['max_message_size']);
   }

   this._zimletContext._panelActionMenu.args[0][0].label = OpenPGPZimlet.lang[3];
   this._zimletContext._panelActionMenu.args[0][1].label = OpenPGPZimlet.lang[4];
   this._zimletContext._panelActionMenu.args[0][2].label = OpenPGPZimlet.lang[77];
   this._zimletContext._panelActionMenu.args[0][3].label = OpenPGPZimlet.lang[87];
   this._zimletContext._panelActionMenu.args[0][4].label = OpenPGPZimlet.lang[86];
   this._zimletContext._panelActionMenu.args[0][5].label = OpenPGPZimlet.lang[5];
   
   OpenPGPZimlet.prototype.readAddressBook();
   
   /** Check if an unencrypted private key was stored in html localStorage in Zimlet versions < 1.5.8
    * and if so, encrypt it with AES
    */
   if(localStorage['zimbra_openpgp_privatekey'+OpenPGPZimlet.prototype.getUsername()])
   {
      var pgpPrivKeyRegEx = new RegExp('[\-]*BEGIN PGP PRIVATE KEY BLOCK[\-]*');
      if (localStorage['zimbra_openpgp_privatekey'+OpenPGPZimlet.prototype.getUsername()].match(pgpPrivKeyRegEx)) 
      {
         if (!OpenPGPZimlet.settings['aes_password'])
         {
            OpenPGPZimlet.settings['aes_password'] = OpenPGPZimlet.prototype.pwgen();
         }   
         this.setUserProperty("zimbra_openpgp_options", JSON.stringify(OpenPGPZimlet.settings), true);
         OpenPGPZimlet.prototype.localStorageSave(OpenPGPZimlet.settings['aes_password'], localStorage['zimbra_openpgp_privatekey'+OpenPGPZimlet.prototype.getUsername()]);
      }
   }
   
   var zimbra_openpgp_privatepass = this.getUserProperty("zimbra_openpgp_privatepass");
   if ((zimbra_openpgp_privatepass)  && (zimbra_openpgp_privatepass.indexOf('-cryptedpp-') < 1))
   {
      //found a zimbra_openpgp_privatepass on server that was stored in a previous version, encrypt it
      var encryptedPassphrase = Aes.Ctr.encrypt('-----openpgppassphrase-----'+zimbra_openpgp_privatepass, OpenPGPZimlet.settings['aes_password'], 256);
      if (OpenPGPZimlet.settings['store_passphrase_locally'] == 'true')
      {
         localStorage['zimbra_openpgp_privatepass'+OpenPGPZimlet.prototype.getUsername()] = '---cryptedpp---' + encryptedPassphrase;
         this.setUserProperty("zimbra_openpgp_privatepass", '', true);
      }
      else
      {
         localStorage['zimbra_openpgp_privatepass'+OpenPGPZimlet.prototype.getUsername()] = '';
         this.setUserProperty("zimbra_openpgp_privatepass", '---cryptedpp---' + encryptedPassphrase, true);
      }
   }

	if (appCtxt.get(ZmSetting.MAIL_ENABLED)) {
		AjxPackage.require({name:"MailCore", callback:new AjxCallback(this, this.addAttachmentHandler)});
	}
}

/** This method gets called from init and adds a handler for decrypting attachments and importing public key attachments
 * */
OpenPGPZimlet.prototype.addAttachmentHandler = function()
{
	this._msgController = AjxDispatcher.run("GetMsgController");
	var viewType = appCtxt.getViewTypeFromId(ZmId.VIEW_MSG);
	this._msgController._initializeView(viewType);

   OpenPGPZimlet.mime = [
   'application/pgp-encrypted',
   'application/pgp-keys'
   ];
   OpenPGPZimlet.mime.forEach(function(mime) 
   {
      var MISSMIME = 'tk_barrydegraaff_zimbra_openpgp'+mime.replace("/","_");
      ZmMimeTable.MISSMIME=mime;
      ZmMimeTable._table[ZmMimeTable.MISSMIME]={desc:"OpenPGP encrypted file",image:"tk_barrydegraaff_zimbra_openpgp-file-pgp-encrypted",imageLarge:"tk_barrydegraaff_zimbra_openpgp-file-pgp-encrypted"};      
   });

   this._msgController._listView[viewType].addAttachmentLinkHandler('application/pgp-encrypted',"tk_barrydegraaff_zimbra_openpgp",this.addPGPLink);
   this._msgController._listView[viewType].addAttachmentLinkHandler('application/pgp-keys',"tk_barrydegraaff_zimbra_openpgp",this.addPubKeyLink);
};

/** This method is called from addAttachmentHandler
 * @param {object} attachment - the attachment (upstream documentation needed)
 * @returns {string} html - html with link to decrypt attachments
 * */
OpenPGPZimlet.prototype.addPGPLink = 
function(attachment) {
	var html =
			"<a href='#' class='AttLink' style='text-decoration:underline;' " +
					"onClick=\"OpenPGPZimlet.prototype.decryptAttachment('" + attachment.label + "','" + attachment.url + "')\">"+
					OpenPGPZimlet.lang[60] +
					"</a>";
               
	return html;
};

/** This method is called from addAttachmentHandler
 * @param {object} attachment - the attachment (upstream documentation needed)
 * @returns {string} html - html with link to import public key attachments
 * */
OpenPGPZimlet.prototype.addPubKeyLink = 
function(attachment) {
	var html =
			"<a href='#' class='AttLink' style='text-decoration:underline;' " +
					"onClick=\"OpenPGPZimlet.prototype.importPubKey('" + attachment.url + "')\">"+
					OpenPGPZimlet.lang[73] +
					"</a>";
               
	return html;
};

/** This method is called when a user clicks the `Decrypt` link next to an attachment and opens a decrypt dialog
 * @param {string} name - attachment filename
 * @param {string} url - attachment rest api fetch url
 * */
OpenPGPZimlet.prototype.decryptAttachment =
function(name, url) {
   //Now make an ajax request and fetch the attachment
   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", url, true );        
   xmlHttp.responseType = "arraybuffer";
   xmlHttp.send( null );
  
   xmlHttp.onload = function(e) 
   {
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_zimbra_openpgp').handlerObject;
      zimletInstance.displayDialog(10, OpenPGPZimlet.lang[60], [xmlHttp.response, name]);
   };
};

/** This method is called when a user clicks the `Import public key` link next to an attachment and opens an import dialog
 * @param {string} url - attachment rest api fetch url
 * */
OpenPGPZimlet.prototype.importPubKey =
function(url) {
   //Now make an ajax request and fetch the attachment
   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", url, true );        
   xmlHttp.send( null );
  
   xmlHttp.onload = function(e) 
   {
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_zimbra_openpgp').handlerObject;
      zimletInstance.displayDialog(9, OpenPGPZimlet.lang[73],xmlHttp.response);
   };
};

/** The Zimlet API does not provide an onContactSave event, but we need to read the address book on changes.
 * So we combine onContactEdit and onShowView to create an event when a user edits the address book.
 *  @global
 * */
OpenPGPZimlet.prototype.onContactEdit = function (view, contact, elementId) {
   OpenPGPZimlet.prototype.editAddressBookEvent = true;
}

/** The Zimlet API does not provide an onContactSave event, but we need to read the address book on changes.
 * So we combine onContactEdit and onShowView to create an event when a user edits the address book.
 *  @global
 * */
OpenPGPZimlet.prototype.onShowView = function (view) { 
   if ((OpenPGPZimlet.prototype.editAddressBookEvent == true) && ( view.indexOf('CN') < 0 ))
   {
      OpenPGPZimlet.prototype.editAddressBookEvent = false;
      OpenPGPZimlet.prototype.readAddressBook();      
   }
}

/** This method is called from init and makes the Content-Type header available to determine if a mail message is pgp/mime. 
 * See {@link https://files.zimbra.com/docs/zimlet/zcs/8.6.0/jsapi-zimbra-doc/symbols/ZmMailMsg.html#.addRequestHeaders ZmMailMsg.html#.addRequestHeaders}.
 * */
OpenPGPZimlet.prototype._applyRequestHeaders =
function() {   
   ZmMailMsg.requestHeaders["Content-Type"] = "Content-Type";
   ZmMailMsg.requestHeaders["Content-Transfer-Encoding"] = "Content-Transfer-Encoding";
};

/** This method is called when a message is viewed in Zimbra. 
 * This Zimlet uses the onMsgView method to determine (sniff) what type of email is received and if it is PGP related do the appropriate actions.
 * This includes adding dom element, listeners and starting dialogs.
 * See {@link https://files.zimbra.com/docs/zimlet/zcs/8.6.0/jsapi-zimbra-doc/symbols/ZmZimletBase.html#onMsgView}.
 * @param {ZmMailMsg} msg - an email in {@link https://files.zimbra.com/docs/zimlet/zcs/8.6.0/jsapi-zimbra-doc/symbols/ZmMailMsg.html ZmMailMsg} format
 * @param {ZmMailMsg} oldMsg - unused
 * @param {ZmMailMsgView} msgView - the current ZmMailMsgView (upstream documentation needed)
 * */
OpenPGPZimlet.prototype.onMsgView = function (msg, oldMsg, msgView) {
   //Only integrate in Mail, Drafts and Search app.
   if((appCtxt.getCurrentAppName()=='Mail') || (appCtxt.getCurrentAppName()=='Search'))
   {
      if(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
      {
         console.log(msgView.parent._className);
      }   
      if(appCtxt.getCurrentAppName()=='Mail')
      {
         //Conversation view top item
         if(msgView.parent._className == 'ZmConvView2')
         {
            var bodynode = document.getElementById('main_MSGC'+msg.id+'__body');
            var attNode = document.getElementById('zv__CLV__main_MSGC'+msg.id+'_attLinks');
         }
         //By-message view
         else if (msgView.parent._className == 'ZmTradView')
         {  
            var bodynode = document.getElementById('zv__TV-main__MSG__body');
            var attNode = document.getElementById('zv__TV__TV-main_MSG_attLinks');
         }
         else
         {
            if(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
            {
               console.log('unsupported view');
            }   
            return;
         }
      }
      else if(appCtxt.getCurrentAppName()=='Search')
      {
         //By-message view
         if (msgView.parent._className == 'ZmTradView')
         { 
            var bodynode = document.getElementById(msgView.__internalId+'__body');
            var attNode = document.getElementById('zv__'+msgView.__internalId.replace('zv','TV').replace('_MSG','MSG')+'_attLinks');
         } 
         else
         {
            if(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
            {
               console.log('unsupported view');
            }
            return;
         }
      }

      //Create new empty infobar for displaying pgp result
      var el = msgView.getHtmlElement();
      var g=document.createElement('div');
      g.setAttribute("id", 'tk_barrydegraaff_zimbra_openpgp_actionbar'+appCtxt.getCurrentAppName()+msg.id);
      g.setAttribute("class", 'tk_barrydegraaff_zimbra_openpgp_actionbar');
      if(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
      {
         g.setAttribute("title", 'tk_barrydegraaff_zimbra_openpgp_actionbar'+appCtxt.getCurrentAppName()+msg.id);
         g.setAttribute("style", 'border: 1px solid red');
      }
      el.insertBefore(g, el.firstChild);
      
      var g=document.createElement('div');
      g.setAttribute("id", 'tk_barrydegraaff_zimbra_openpgp_infobar'+appCtxt.getCurrentAppName()+msg.id);
      g.setAttribute("class", 'tk_barrydegraaff_zimbra_openpgp_infobar');
      if(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
      {
         g.setAttribute("title", 'tk_barrydegraaff_zimbra_openpgp_infobar'+appCtxt.getCurrentAppName()+msg.id);
         g.setAttribute("style", 'border: 1px solid green');
      }   
      el.insertBefore(g, el.firstChild); 
      
      //Detect what kind of message we have
      var bp = msg.getBodyPart(ZmMimeTable.TEXT_PLAIN);
      
      //Check for attached public keys and import them if we don't have a signed or encrypted message
      var pgpKeys = false;
      var pgpKeysUrl = '';
      msg._attInfo.forEach(function(att) {
         if(att['ct'] == 'application/pgp-keys')
         {
            pgpKeys = true;
            pgpKeysUrl = att['url'];
         }
      });   
      
      //Import inline PGP PUBLIC KEYS
      try {
      var pubKeySearch = bp.node.content.substring(0,10000);
      } catch (err) { var pubKeySearch = ''; }
      
      if ((pubKeySearch.indexOf("BEGIN PGP PUBLIC KEY BLOCK") > 0 ) && (bp))
      {
         //Import public key
         pubKeyTxt = bp.node.content.match(/(-----BEGIN PGP PUBLIC KEY BLOCK-----)([^]+)(-----END PGP PUBLIC KEY BLOCK-----)/g);
         if(pubKeyTxt)
         {
            if(pubKeyTxt[0])
            {
               this.displayDialog(9, OpenPGPZimlet.lang[73],pubKeyTxt[0]);  
               return;
            }
            else
            {
               return;
            }   
         }
         else
         {
            return;
         }
      }

      var pgpmime = false;
      var alternative = false;
      if (!bp)
      {
         try
         {
            if ((msg.attrs['Content-Type'].indexOf('multipart/encrypted') > -1) ||
            (msg.attrs['Content-Type'].indexOf('application/pgp-encrypted') > -1))
            {
               //PGP Mime
               var msgSearch = '';
               pgpmime =  true;
            }
            else
            {
               //support multipart/alternative mime used by Gmail / Mailvelope
               if(msg.attrs['Content-Type'].indexOf('multipart/alternative') > -1)
               {
                  var msgSearch = '';
                  pgpmime =  true;
                  alternative = true;
               }
               else
               {
                  //This is an html message with an attached public key, and no other pgp content
                  if(pgpKeys == true)
                  {
                     OpenPGPZimlet.prototype.importPubKey(pgpKeysUrl);
                     return;
                  }
                  //not a plain text message and no PGP mime, cannot do a thing with this message
                  return;
               }   
            }
         }
         catch (err) 
         {
            // Content-Type header not found
            var msgSearch = '';
            pgpmime =  true;
         }       
      }
      else
      {
         //Is this is a plain-text message with PGP content?
         var msgSearch = bp.node.content.substring(0,60);
      }   

      //not a plain text message and no PGP mime, cannot do a thing with this message
      if((!bodynode) && (!pgpmime) && (!pgpKeys))
      {
         return;
      }

      try {
      var g=document.createElement('div');
      g.setAttribute("id", 'tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id);
      g.setAttribute("class", 'tk_barrydegraaff_zimbra_openpgp_infobar_body');
      if(this.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
      {
         g.setAttribute("title", 'tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id);
         g.setAttribute("style", 'border: 1px solid blue');
      }   
      el.insertBefore(g, bodynode);
      } catch (err) {
         return;   
      }  
     
   
      //Performance, do not GET the entire mail, if it is not PGP mail
      if ((pgpmime) ||
      (msgSearch.indexOf("BEGIN PGP SIGNED MESSAGE") > 0 ) ||
      (msgSearch.indexOf("BEGIN PGP MESSAGE") > 0 ) ||
      (msgSearch.indexOf("BEGIN PGP PUBLIC KEY BLOCK") > 0 ))
      {
         if(!pgpmime)
         {
            var part = "&part="+bp.part;
         }
         else
         {
            var part = "";
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
         url[i++] = "/message.txt?fmt=txt"+part+"&id=";
         url[i++] = msg.id;
      
         var getUrl = url.join(""); 
      
         //Now make an ajax request and read the contents of this mail, including all attachments as text
         //it should be base64 encoded
         var xmlHttp = null;   
         xmlHttp = new XMLHttpRequest();
         xmlHttp.open( "GET", getUrl, false );
         xmlHttp.send( null );
         
         try {
            //Do not attempt to decode quoted-printable if we have a BEGIN PGP MESSAGE block, as this breaks the armor
            if ((msg.attrs['Content-Transfer-Encoding'].indexOf('quoted-printable') > -1) && (msgSearch.indexOf("BEGIN PGP MESSAGE") < 0 ))
            {         
               var message = OpenPGPZimlet.prototype.quoted_printable_decode(xmlHttp.responseText);
            }
            else
            {
               var message = xmlHttp.responseText;      
            }
         } catch (err) {      
            //No Content-Transfer-Encoding Header
            var message = xmlHttp.responseText;
         }
      
         if(msgSearch=='')
         {
            //In case of PGP mime, we look in the entire mail for PGP Message block
            msgSearch=message;
         }   
      }

      if (msgSearch.indexOf("BEGIN PGP SIGNED MESSAGE") > 0 ) {
         if (OpenPGPZimlet.prototype.addressBookReadInProgress == true)
         {
            //Still loading contacts, ignoring your addressbook
            this.status(OpenPGPZimlet.lang[6], ZmStatusView.LEVEL_INFO);   
         }
   
         try {
            var message = openpgp.cleartext.readArmored(bp.node.content);
         }
         catch(err) {
            //Could not read armored message!
            this.status(OpenPGPZimlet.lang[7], ZmStatusView.LEVEL_CRITICAL);
            return;
         }
         var dispMessage = OpenPGPZimlet.prototype.escapeHtml(bp.node.content);
         bodynode.innerHTML = '';
         document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id).innerHTML='<pre style="white-space: pre-wrap;word-wrap: break-word;">'+OpenPGPZimlet.prototype.urlify(dispMessage)+'</pre>';
         this.verify([message, appCtxt.getCurrentAppName()+msg.id] );
      }   
      else if (msgSearch.indexOf("BEGIN PGP MESSAGE") > 0 ) {
         //Allow to print decrypted message
         if(msg.subject)
         {
            var subject = msg.subject.replace(/\*\*\*.*\*\*\*/,'');
         }
         else
         {
            var subject = 'Zimbra OpenPGP ' + OpenPGPZimlet.lang[54];
         }
         
         if(subject.length < 2)
         {
            subject = 'Zimbra OpenPGP ' + OpenPGPZimlet.lang[54];
         }
         if(document.getElementById('tk_barrydegraaff_zimbra_openpgp_actionbar'+appCtxt.getCurrentAppName()+msg.id))
         {
            if(document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id))
            {
               document.getElementById('tk_barrydegraaff_zimbra_openpgp_actionbar'+appCtxt.getCurrentAppName()+msg.id).innerHTML = '<a id="btnReply'+msg.id+'" style="text-decoration: none" onclick="#"><img style="vertical-align:middle" src="'+this.getResource("reply-sender.png")+'"> '+OpenPGPZimlet.lang[82]+'</a>&nbsp;&nbsp;<a id="btnReplyAll'+msg.id+'" style="text-decoration: none" onclick="#"><img style="vertical-align:middle" src="'+this.getResource("reply-all.png")+'"> '+OpenPGPZimlet.lang[83]+'</a>&nbsp;&nbsp;<a id="btnPrint'+msg.id+'" style="text-decoration: none" onclick="#"><img style="vertical-align:middle" src="'+this.getResource("printButton.png")+'"> '+OpenPGPZimlet.lang[54]+'</a>&nbsp;&nbsp;';
               var btnPrint = document.getElementById("btnPrint"+msg.id);               
               btnPrint.onclick = AjxCallback.simpleClosure(this.printdiv, this, 'tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id, msg);

               var btnReply = document.getElementById("btnReply"+msg.id);
               btnReply.onclick = AjxCallback.simpleClosure(this.reply, this, msg, 'tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id, 'reply');
               var btnReplyAll = document.getElementById("btnReplyAll"+msg.id);
               btnReplyAll.onclick = AjxCallback.simpleClosure(this.reply, this, msg, 'tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id, 'replyAll');               
            }
         }
            
         if (OpenPGPZimlet.prototype.addressBookReadInProgress == true)
         {
            //Still loading contacts, ignoring your addressbook
            this.status(OpenPGPZimlet.lang[6], ZmStatusView.LEVEL_INFO);   
         }
         
         //Add an html infobar for displaying decrypted attachments
         if(attNode)
         {
            if (pgpmime)
            {
               attNode.innerHTML = '<div id="tk_barrydegraaff_zimbra_openpgp_infobar_att'+appCtxt.getCurrentAppName()+msg.id+'"></div>';
            }
            else
            {
               attNode.innerHTML = '<div id="tk_barrydegraaff_zimbra_openpgp_infobar_att'+appCtxt.getCurrentAppName()+msg.id+'"></div>'+attNode.innerHTML;
            }   
         }
         
         if (!pgpmime)
         {
            //Hide the PGP MESSAGE block
            bodynode.innerHTML = '';
            document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id).innerHTML=OpenPGPZimlet.prototype.escapeHtml(bp.node.content);
         }
         else
         {  
            document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id).innerHTML='<pre>This is an OpenPGP/MIME encrypted message (RFC 4880 and 3156)</pre>';
         }   
                  
         //support multipart/alternative mime used by Gmail / Mailvelope
         if (alternative)
         {
            pgpmime = false;
         }
         
         //Please provide private key and passphrase for decryption
         var args = [];
         args['message'] = message;
         args['domId'] = appCtxt.getCurrentAppName()+msg.id;
         args['hasMIME'] = pgpmime;
         this.displayDialog(1, OpenPGPZimlet.lang[8], args);  
      }
      else if (pgpKeys == true)
      {
         OpenPGPZimlet.prototype.importPubKey(pgpKeysUrl);
         return;
      }
      else {
         return;
      }   
   }
};   

/** This method is called by the Zimlet framework whenever an email is about to be send. This method checks if a user tries to send a private key and warns them it is NOT a good idea. */
OpenPGPZimlet.prototype.emailErrorCheck =
function(mail, boolAndErrorMsgArray) {
   if (mail.textBodyContent.match(/----BEGIN PGP PRIVATE KEY BLOCK----/i))
   {
      var errParams = {
         hasError:true,
         errorMsg: OpenPGPZimlet.lang[84]+'<br><br><img src="'+this.getResource("/help/send-public-key.png")+'">',
         zimletName:'OpenPGP Zimlet'
      };
      //Whatever the user does, just refuse to send the email, 
      var composeView = appCtxt.getCurrentView();
      composeView.setAddress(AjxEmailAddress.TO, '');
      composeView.setAddress(AjxEmailAddress.CC, '');
      composeView.setAddress(AjxEmailAddress.BCC, '');
      return boolAndErrorMsgArray.push(errParams);         
   }
   else
   {
      return null;
   }
};

/** This method is called to escape any HTML prior to putting it in the DOM to avoid XSS attacks
 * @param {string} unsafe - source html text
 * @returns {string} - disarmed html text
 * */
OpenPGPZimlet.prototype.escapeHtml =
function (unsafe) {
    unsafe = unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    return DOMPurify.sanitize(unsafe);
};

/** This method gets called by the Zimlet framework when single-click is performed. And calls the Manage Keys dialog.
 */
OpenPGPZimlet.prototype.singleClicked =
function() {  
   //Launch Manage keys
   this.displayDialog(3, OpenPGPZimlet.lang[3], null);
};

/** This method gets called by the Zimlet framework when double-click is performed. And calls the Manage Keys dialog.
 */
OpenPGPZimlet.prototype.doubleClicked =
function() {
   //Launch Manage keys
   this.displayDialog(3, OpenPGPZimlet.lang[3], null);
};

/** This menu is called when a user clicks a menu item in the Zimlet menu. And calls a dialog or opens new window.
 * @param {string} itemId - the menu item id
 * */
OpenPGPZimlet.prototype.menuItemSelected =
function(itemId) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_zimbra_openpgp').handlerObject;
   switch (itemId) {
   case "pubkeys":
      this.displayDialog(3, OpenPGPZimlet.lang[3], null);
      break;
   case "sendTo":
      OpenPGPZimlet.prototype.sendTo(btoa(this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value));
      break;
   case "keypair":
      this.displayDialog(5, OpenPGPZimlet.lang[4], null);
      break;
   case "help":
      window.open(zimletInstance.getResource("help/index.html"));
      break;
   case "lookup":
      this.displayDialog(7, OpenPGPZimlet.lang[87], null);
      break;
   case "submit":
      this.displayDialog(8, OpenPGPZimlet.lang[86], null);
      break;
   }
};

/** This method is called when a user drops an object on the Zimlet panel menu, it is no longer in use. And here for debugging.
 * @param {zmObject} zmObject - a mail message, conversation or other object
 * */
OpenPGPZimlet.prototype.doDrop =
function(zmObject) {
};

/** The verify method is called for clear-signed messages. It checks against known public keys and
 * will update the status bar with the result (good/bad signature).
 * @param {string} fArguments.0 - the OpenPGP clear-signed message
 * @param {string} fArguments.1 - the DOM id where to display the result
 * */
OpenPGPZimlet.prototype.verify = function(fArguments) {
   var message = fArguments[0];
   
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

      OpenPGPZimlet.addressBookPublicKeys.forEach(function(pubKey) {
         var pubKey = openpgp.key.readArmored(pubKey);
         combinedPublicKeys = combinedPublicKeys.concat(pubKey.keys);
      });
   }
   catch(err) {
      //Could not parse your trusted public keys!
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[13], ZmStatusView.LEVEL_WARNING);
      return;
   }
   var myWindow = this;
   myWindow.fArguments = fArguments;

   options = {
      message: message,                 // parse encrypted bytes
      publicKeys: combinedPublicKeys,   // for signing
   };

   openpgp.verify(options).then(function (signature) {
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
         sigStatus ='<b style="color:green">'+OpenPGPZimlet.lang[14]+'</b>';
         document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar'+myWindow.fArguments[1]).innerHTML= '<img style="vertical-align:middle" src="'+myWindow.getResource("icon.png")+'"> OpenPGP: '+sigStatus;
      } else {
         //Got a BAD signature
         sigStatus ='<b style="color:red">'+OpenPGPZimlet.lang[15]+'</b>';
         document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar'+myWindow.fArguments[1]).innerHTML= '<img style="vertical-align:middle" src="'+myWindow.getResource("icon.png")+'"> OpenPGP: '+sigStatus;
      }
      if (message.text.indexOf('<html><body>') > -1 ) 
      {       
         myWindow.displayDialog(2, OpenPGPZimlet.lang[16] + ': ' + sigStatus, '<div style="width:650px; height: 350px; overflow-x: auto; overflow-y: auto; background-color:white; padding:5px;">'+message.text+'</div>');
      }
   },
   function (err) {
      //Error verifying signature
      myWindow.status(OpenPGPZimlet.lang[17], ZmStatusView.LEVEL_WARNING);
   });
}

/** This method shows a `ZmToast` status message. That fades in and out in a few seconds.
 * @param {string} text - the message to display
 * @param {string} type - the style of the message e.g. ZmStatusView.LEVEL_INFO, ZmStatusView.LEVEL_WARNING, ZmStatusView.LEVEL_CRITICAL
 * */
OpenPGPZimlet.prototype.status = function(text, type) {
   var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.FADE_OUT ];
   appCtxt.getAppController().setStatusMsg(text, type, null, transitions);
}; 

/** This method displays dialogs to the end user.
 * @param {number} id - the dialog id to display
 * @param {string} title - initial title for the dialog
 * @param {string} message - additional arguments or message text for the dialog
 */
OpenPGPZimlet.prototype.displayDialog =
function(id, title, message) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_zimbra_openpgp').handlerObject;
   switch(id) {
   case 1:
      //Decrypt message
      if((OpenPGPZimlet.prototype.localStorageRead()) && (OpenPGPZimlet.prototype.localStorageRead() !== OpenPGPZimlet.privateKeyCache))
      {
         OpenPGPZimlet.privateKeyCache = OpenPGPZimlet.prototype.localStorageRead();
      } 
      
      OpenPGPZimlet.prototype.passphraseRead(zimletInstance.getUserPropertyInfo("zimbra_openpgp_privatepass").value);

      html = "<div style='width:650px; height: 140px; overflow-x: hidden; overflow-y: scroll;'><table><tr><td colspan='2'>" +
      OpenPGPZimlet.lang[8] + '. ' + OpenPGPZimlet.lang[18]+"<br><br>" +
      "</td></tr><tr><td>" +
      OpenPGPZimlet.lang[19] + ":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + OpenPGPZimlet.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      OpenPGPZimlet.lang[20] + ":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + OpenPGPZimlet.privatePassCache + "'>" +
      "</td></tr></table></div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      var fArguments = message;
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.okBtnDecrypt, [fArguments]));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      
      //If a private key is available and a password is stored, auto decrypt the message if option auto_decrypt is set to true
      if((OpenPGPZimlet.privateKeyCache.length > 10) && 
      (OpenPGPZimlet.settings['auto_decrypt'] == 'true') &&
      (OpenPGPZimlet.privatePassCache.length > 0))
      {
         zimletInstance.okBtnDecrypt(message);
      }   
      break;
   case 2:
      //Default dialog
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(message);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      break;
   case 3:
      //Manage keys
      if((OpenPGPZimlet.prototype.localStorageRead()) && (OpenPGPZimlet.prototype.localStorageRead() !== OpenPGPZimlet.privateKeyCache))
      {
         OpenPGPZimlet.privateKeyCache = OpenPGPZimlet.prototype.localStorageRead();
      } 
      
      OpenPGPZimlet.prototype.passphraseRead(zimletInstance.getUserPropertyInfo("zimbra_openpgp_privatepass").value);
     
      // make list of public keys in HTML
      pubkeyListHtml = "";
      for (i = 1; i < 31; i++) {
         numStr = i.toString();
         pubkeyNumStr = "zimbra_openpgp_pubkeys" + numStr;
         var pubkeyTxt = ''
         if (numStr == 1)
         {
            pubkeyTxt = '<b>&bull; '+OpenPGPZimlet.lang[72]+'</b>';
         }
         pubkeyListHtml += "<tr><td>"+OpenPGPZimlet.lang[26]+" "+numStr+":</td><td><br><textarea maxlength=\"51000\" class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput"+numStr+"'/>" + (zimletInstance.getUserPropertyInfo(pubkeyNumStr).value ? zimletInstance.getUserPropertyInfo(pubkeyNumStr).value : '') + "</textarea>"+ pubkeyTxt + "<br>" + "<label for='publicKeyInfo"+numStr+"'>"+(zimletInstance.getUserPropertyInfo(pubkeyNumStr).value ? zimletInstance.pubkeyInfo(zimletInstance.getUserPropertyInfo(pubkeyNumStr).value) : '')+"</label>" + "</td></tr>";
      }
      
      html = "<div style='width:650px; height: 500px; overflow-x: hidden; overflow-y: scroll;'><table><tr><td colspan='2'>" +
      "<ul>"+OpenPGPZimlet.lang[22]+"</ul><br>" +
      "</td></tr>" +      
      "<tr><td style=\"width:100px\">"+OpenPGPZimlet.lang[19]+":</td><td style=\"width:500px\">"+OpenPGPZimlet.lang[25]+"<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='privateKeyInput'/>" + OpenPGPZimlet.privateKeyCache + "</textarea>" +
      "<input type='checkbox' id='set_new_aes_password' name='set_new_aes_password' value='true'>" + OpenPGPZimlet.lang[67] +
      "<tr><td>"+OpenPGPZimlet.lang[20]+":</td><td><br>"+OpenPGPZimlet.lang[24]+"<input class=\"barrydegraaff_zimbra_openpgp-input\" id='privatePassInput' type='password' value='" + OpenPGPZimlet.privatePassCache + "'><br><button type=\"button\" onclick=\"OpenPGPZimlet.prototype.toggle_password('privatePassInput')\">"+OpenPGPZimlet.lang[55]+"</button><input type='checkbox' id='store_passphrase_locally' name='store_passphrase_locally' " + (OpenPGPZimlet.settings['store_passphrase_locally']=='false' ? '' : 'checked') + " value='false'> "+OpenPGPZimlet.lang[71]+"</td></tr>" +
      "<tr><td><br>"+OpenPGPZimlet.lang[27]+":</td><td><br><input type='checkbox' id='enable_contacts_scanning' name='enable_contacts_scanning' " + (OpenPGPZimlet.settings['enable_contacts_scanning']=='false' ? '' : 'checked') + " value='true'>" + "</td></tr>" +
      "<tr><td><br>"+OpenPGPZimlet.lang[66]+":</td><td><br><input type='checkbox' id='auto_decrypt' name='auto_decrypt' " + (OpenPGPZimlet.settings['auto_decrypt']=='false' ? '' : 'checked') + " value='true'>" + "</td></tr>" +
      pubkeyListHtml + 
      "<tr><td colspan=\"2\"><br><b>"+OpenPGPZimlet.lang[69]+"</b></td></tr>" +
      "<tr><td><br>"+OpenPGPZimlet.lang[68]+":</td><td><br><input onkeypress='return event.charCode >= 48 && event.charCode <= 57' type='number' id='max_message_size' name='max_message_size' value='" + (OpenPGPZimlet.settings['max_message_size'] > 0 ? OpenPGPZimlet.settings['max_message_size'] : '1000000') + "'</td></tr>" +
      "<tr><td>User settings:</td><td><textarea readonly class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\">" + zimletInstance.getUserProperty("zimbra_openpgp_options") + "</textarea></td></tr><tr><td colspan='2'><br><br><b>Zimbra OpenPGP Zimlet "+OpenPGPZimlet.lang[10]+": " + OpenPGPZimlet.version + "</b></td></tr>" +
      "</table></div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.okBtnPubKeySave));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      break;
   case 4:
      //Sign message
      if((OpenPGPZimlet.prototype.localStorageRead()) && (OpenPGPZimlet.prototype.localStorageRead() !== OpenPGPZimlet.privateKeyCache))
      {
         OpenPGPZimlet.privateKeyCache = OpenPGPZimlet.prototype.localStorageRead();
      }
      
      OpenPGPZimlet.prototype.passphraseRead(zimletInstance.getUserPropertyInfo("zimbra_openpgp_privatepass").value);

      html = "<div style='width:650px; height: 120px; overflow-x: hidden; overflow-y: hidden;'><table style='width:100%'><tr><td colspan='2'>" +
      OpenPGPZimlet.lang[36]+" <a style='color:blue; text-decoration: underline;' onclick=\"OpenPGPZimlet.prototype.menuItemSelected('help')\">"+OpenPGPZimlet.lang[11]+"</a>.<br><br>" +
      "</td></tr><tr><td style=\"width:100px;\">" +
      OpenPGPZimlet.lang[19]+":" +
      "</td><td style=\"width:500px\">" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + OpenPGPZimlet.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      OpenPGPZimlet.lang[20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + OpenPGPZimlet.privatePassCache + "'>" +
      "<textarea style=\"display:none\" class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'>"+ (message ? message : '' ) +"</textarea>" +
      "</td></tr></table></div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.okBtnSign));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      break;
   case 5:
      //Generate keypair
      if((OpenPGPZimlet.prototype.localStorageRead()) && (OpenPGPZimlet.prototype.localStorageRead() !== OpenPGPZimlet.privateKeyCache))
      {
         OpenPGPZimlet.privateKeyCache = OpenPGPZimlet.prototype.localStorageRead();
      } 
      
      OpenPGPZimlet.prototype.passphraseRead(zimletInstance.getUserPropertyInfo("zimbra_openpgp_privatepass").value);
            
      if (appCtxt.get(ZmSetting.DISPLAY_NAME))
      {
         displayname = appCtxt.get(ZmSetting.DISPLAY_NAME);
      }
      else
      {
         displayname = appCtxt.getActiveAccount().name;
      }  

      var aliases = appCtxt.get(ZmSetting.MAIL_ALIASES);
      var aliasesString = '';
      if(aliases)
      {
         aliases = OpenPGPZimlet.prototype.uniq(aliases);
         aliases.forEach(function(alias) {
            aliasesString = aliasesString + ',' + alias;
         });      
      }
      
      html = "<div style='width:650px; height: 240px; overflow-x: hidden; overflow-y: hidden;'><table style='width:650px;'><tr><td colspan='2'>" +
      OpenPGPZimlet.lang[29]+"<br><br>" +
      "</td></tr><tr><td style=\"width:100px;\">" +
      OpenPGPZimlet.lang[79]+":" +
      "</td><td style=\"width:500px\">" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='uidName' value='" + displayname +"'>" +
      "</td></tr><tr><tr><td style=\"width:100px;\">" +
      OpenPGPZimlet.lang[80]+":" +
      "</td><td style=\"width:500px\">" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='uidEmail' value='" + appCtxt.getActiveAccount().name+aliasesString+"'>" +
      "</td></tr><tr><td></td><td>"+OpenPGPZimlet.lang[81]+
      "</td></tr><tr><td>"+
      OpenPGPZimlet.lang[20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + (OpenPGPZimlet.privatePassCache ? OpenPGPZimlet.privatePassCache : OpenPGPZimlet.prototype.pwgen()) + "'>" +
      "</td></tr><tr><td></td><td><button type=\"button\" onclick='document.getElementById(\"passphraseInput\").value=OpenPGPZimlet.prototype.pwgen()'>"+OpenPGPZimlet.lang[34]+"</button>" +
      "<button type=\"button\" onclick=\"OpenPGPZimlet.prototype.toggle_password('passphraseInput')\">"+OpenPGPZimlet.lang[55]+"</button></td></tr><tr><td style=\"width:100px;\">" +
      OpenPGPZimlet.lang[31]+":" +
      "</td><td style=\"width:500px\">" +
      "<select class=\"barrydegraaff_zimbra_openpgp-input\" id=\"keyLength\" name=\"keyLength\"><option selected=\"selected\" value=\"1024\">1024</option><option value=\"2048\">2048</option><option value=\"4096\">4096</option></select>" +
      "</td></tr><tr><td colspan='2'>" +
      "<br>"+OpenPGPZimlet.lang[32]+"<br><br>" +
      "</td></tr><tr><td colspan='2'>" +
      "<input type='checkbox' checked='checked' name='keyStore' id='keyStore' value='yes'>"+OpenPGPZimlet.lang[33]+"<br>" +
      "</td></tr></table></div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true  } );
      zimletInstance._dialog.setContent(html);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.okBtnKeyPair));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      break;
   case 6:
      //Encrypt message
      if((OpenPGPZimlet.prototype.localStorageRead()) && (OpenPGPZimlet.prototype.localStorageRead() !== OpenPGPZimlet.privateKeyCache))
      {
         OpenPGPZimlet.privateKeyCache = OpenPGPZimlet.prototype.localStorageRead();
      } 
      
      OpenPGPZimlet.prototype.passphraseRead(zimletInstance.getUserPropertyInfo("zimbra_openpgp_privatepass").value);

      html = "<div style='width:650px; height: 350; overflow-x: hidden; overflow-y: hidden;'><table style='width:100%'><tr><td colspan='2'>" +
      OpenPGPZimlet.lang[36]+" <a style='color:blue; text-decoration: underline;' onclick=\"OpenPGPZimlet.prototype.menuItemSelected('help')\">"+OpenPGPZimlet.lang[11]+"</a>.<br><br>" +
      "</td></tr><tr><td>" +
      OpenPGPZimlet.lang[35]+":" +
      "</td><td>" + zimletInstance.pubKeySelect() +
      "<textarea style=\"display:none\" class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'>"+ (message ? message : '' ) +"</textarea><br><br>" +
      "</td></tr>" +
      "<tr><td colspan='2'>OpenPGP " + OpenPGPZimlet.lang[40] + "<br></td></tr>" +
      "<tr><td></td><td><div id='fileInputPgpAttach'></div></td></tr>" +
      "<tr><td colspan='2'><br>"+OpenPGPZimlet.lang[37]+"</td></tr><tr><td>" +
      "<tr><td>" + OpenPGPZimlet.lang[19]+":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + OpenPGPZimlet.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      OpenPGPZimlet.lang[20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + OpenPGPZimlet.privatePassCache + "'>" +
      "</td></tr></table></div>";      
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      OpenPGPZimlet.prototype.addFileInputPgpAttach();
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.okBtnEncrypt));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      break;
   case 7:
   //lookup keyserver
      html = "<div style='width:650px; height: 500px; overflow-x: hidden; overflow-y: scroll;'><table><tr><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='barrydegraaff_zimbra_openpgpQuery' type='text' value=''>" +
      "</td><td>&nbsp;<button id='btnSearch' onclick=\"#\">"+OpenPGPZimlet.lang[88]+"</button></td></tr><tr><td>" +
      "<div id='barrydegraaff_zimbra_openpgpResult'></div>" +
      "</td><td></td></tr></table></div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      var btnSearch = document.getElementById("btnSearch");
      btnSearch.onclick = AjxCallback.simpleClosure(zimletInstance.lookup, zimletInstance);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.okBtnLookup));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      break;
   case 8:
   //add/submit keyserver
      var numStr = 1;
      var pubkeyNumStr = "zimbra_openpgp_pubkeys" + numStr;
      var pubkeyTxt = '<b>&bull; '+OpenPGPZimlet.lang[72]+'</b>';
      html = "<div style='width:650px; height: 200px;'><textarea maxlength=\"51000\" class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput"+numStr+"'/>" + (zimletInstance.getUserPropertyInfo(pubkeyNumStr).value ? zimletInstance.getUserPropertyInfo(pubkeyNumStr).value : '') + "</textarea><br>"+ pubkeyTxt + "<br>" + "<label for='publicKeyInfo"+numStr+"'>"+(zimletInstance.getUserPropertyInfo(pubkeyNumStr).value ? zimletInstance.pubkeyInfo(zimletInstance.getUserPropertyInfo(pubkeyNumStr).value) : '')+"</label>" + "<br>" +
      "<br><button id='btnSearch' onclick=\"#\">"+OpenPGPZimlet.lang[86]+"</button><br><div id='barrydegraaff_zimbra_openpgpResult'></div>" +
      "</div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      var btnSearch = document.getElementById("btnSearch");
      btnSearch.onclick = AjxCallback.simpleClosure(zimletInstance.submit, zimletInstance);      
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      break;            
   case 9:
      //Import public key
      //Get selected mail message
      try {
         var publicKeys = openpgp.key.readArmored(message);
         userid = publicKeys.keys[0].users[0].userId.userid;
         userid = OpenPGPZimlet.prototype.escapeHtml(userid);
         
         publicKeyPacket = publicKeys.keys[0].primaryKey;
         var keyLength = "";
         if (publicKeyPacket != null) {
            if (publicKeyPacket.mpi.length > 0) {
               keyLength = (publicKeyPacket.mpi[0].byteLength() * 8);
            }
         }
      } catch(err){
         //Could not read armored message!
         OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[7], ZmStatusView.LEVEL_WARNING);
         return;
      }   
      
      result = "<br><table style=\"padding: 5px;\"><tr><td>User ID[0]:</td><td>" + userid + "</td></tr><tr><td>Fingerprint:</td><td><b>" + publicKeyPacket.fingerprint + "</b></td></tr><tr><td> Primary key length:&nbsp;</td><td>" + keyLength + "</td></tr><tr><td>Created:<td>" + publicKeyPacket.created + "</td></tr></table>";

      html = "<div style='width:650px; height: 100px; overflow-x: hidden; overflow-y: hidden;'>" +
      OpenPGPZimlet.lang[74]+ "<br>" + result + "</div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true  } );
      zimletInstance._dialog.setContent(html);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.okBtnImportPubKey, publicKeys));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      break;
   case 10:
      //Decrypt file from attachment link
      if((OpenPGPZimlet.prototype.localStorageRead()) && (OpenPGPZimlet.prototype.localStorageRead() !== OpenPGPZimlet.privateKeyCache))
      {
         OpenPGPZimlet.privateKeyCache = OpenPGPZimlet.prototype.localStorageRead();
      }      

      OpenPGPZimlet.prototype.passphraseRead(zimletInstance.getUserPropertyInfo("zimbra_openpgp_privatepass").value);

      html = "<div style='width:650px; height: 350; overflow-x: hidden; overflow-y: hidden;'><table style='width:100%'><tr><td colspan='2'>"+OpenPGPZimlet.lang[64]+":<br><br></td></tr><tr><td>" +
      OpenPGPZimlet.lang[19]+":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + OpenPGPZimlet.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      OpenPGPZimlet.lang[20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + OpenPGPZimlet.privatePassCache + "'>" +
      "</td></tr></table></div>";      
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.okBtnDecryptFile, [message]));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));

      //If a private key is available and a password is stored, auto decrypt the message if option auto_decrypt is set to true
      if((OpenPGPZimlet.privateKeyCache.length > 10) && 
      (OpenPGPZimlet.settings['auto_decrypt'] == 'true') &&
      (OpenPGPZimlet.privatePassCache.length > 0))
      {
         zimletInstance.okBtnDecryptFile(message);
      }
      break;   
   }
   try {
      zimletInstance._dialog._setAllowSelection();
      document.getElementById(zimletInstance._dialog.__internalId+'_handle').style.backgroundColor = '#eeeeee';
      document.getElementById(zimletInstance._dialog.__internalId+'_title').style.textAlign = 'center';
      zimletInstance._dialog.popup();
   } catch (err) { }
};

/** This methods adds another attachment file picker to the UI if the user requests it (+ button).
 */
OpenPGPZimlet.prototype.addFileInputPgpAttach = 
function () {
   var parentDiv = document.getElementById("fileInputPgpAttach");
   var newfileInputPgpAttach = document.createElement('div');
   newfileInputPgpAttach.insertAdjacentHTML('afterbegin',"<input type='file' multiple class='fileInputPgpAttach'><button onclick='OpenPGPZimlet.prototype.clearFileInputPgpAttach(this)'>-</button><button onclick='OpenPGPZimlet.prototype.addFileInputPgpAttach()'>+</button>");
   parentDiv.parentNode.insertBefore(newfileInputPgpAttach, parentDiv);
}

/** This method removes an attachment file picker from the UI if the user requests it (- button), in case there is only one file picker, empty that one but leave it in the DOM.
 * @param {button} obj - the clicked button
 */ 
OpenPGPZimlet.prototype.clearFileInputPgpAttach = 
function (obj) {
   var fileSelectors = document.getElementsByClassName("fileInputPgpAttach");
   if(fileSelectors.length > 1)
   {
      obj.parentNode.innerHTML = '';
   }
   else
   {
      obj.parentNode.innerHTML = '';
      OpenPGPZimlet.prototype.addFileInputPgpAttach();
   }   
}

/** This method remove duplicates from an array or array like object.
 * @param {array} a - the array or object with duplicates
 * @returns {array} - the array or object without duplicates
 */
OpenPGPZimlet.prototype.uniq = 
function (a) {
    var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];

    return a.filter(function(item) {
        var type = typeof item;
        if(type in prims)
            return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
        else
            return objs.indexOf(item) >= 0 ? false : objs.push(item);
    });
}

/** This method is called when the Decrypt dialog "OK" button is clicked after private key has been entered.
 * and will show the decrypted OpenPGP encrypted message in the DOM.
 * @param {string} fArguments.message - the OpenPGP encrypted message
 * @param {string} fArguments.domId - the DOM id where to display the result
 * @param {boolean} fArguments.hasMIME - if false this is an inline pgp message that does not require mime parsing, if true its a pgp/mime message that needs parsing
 * */ 
OpenPGPZimlet.prototype.okBtnDecrypt =
function(fArguments) {
   
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("privateKeyInput").style.backgroundImage = "url('"+this.getResource("loading.gif")+"')";

   var privateKeyInput = document.getElementById("privateKeyInput").value;
   OpenPGPZimlet.privateKeyCache = privateKeyInput;
   var passphraseInput = document.getElementById("passphraseInput").value;
   OpenPGPZimlet.privatePassCache = passphraseInput;

   try {
      var privKeys = openpgp.key.readArmored(privateKeyInput);
      var privKey = privKeys.keys[0];
      var success = privKey.decrypt(passphraseInput);
   }
   catch (err) {
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      //Could not parse private key!
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[38], ZmStatusView.LEVEL_WARNING);
      return;
   }

   if (success) {
      try {
         var message = openpgp.message.readArmored(fArguments['message']);
      }
      catch(err) {
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
         this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         //Could not read armored message!
         this.status(OpenPGPZimlet.lang[7], ZmStatusView.LEVEL_CRITICAL);
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
              
         OpenPGPZimlet.addressBookPublicKeys.forEach(function(pubKeyEntry) {
            var pubKeyEntry = openpgp.key.readArmored(pubKeyEntry);
            pubKey = pubKey.concat(pubKeyEntry.keys);
         });
      }
      catch(err) {
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
         this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         //Could not parse your trusted public keys!
         OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[13], ZmStatusView.LEVEL_WARNING);
         return;
      }
      // There should be a cleaner way to do this than stashing 
      // the parent in myWindow but I've not worked it out yet!
      var myWindow = this;
      myWindow.fArguments = fArguments;
      
      options = {
          message: message,           // parse encrypted bytes
          publicKeys: pubKey,         // for verification (optional)
          privateKey: privKey,        // for decryption
      };
      
      openpgp.decrypt(options).then(function (plaintext) {
         var sigStatus ='';
         try 
         {
            if(plaintext.data+plaintext.signatures[0].valid)
            {
               if(plaintext.signatures[0].valid==true)
               {
                  //got a good signature
                  sigStatus ='<b style="color:green">'+OpenPGPZimlet.lang[14]+'</b>';
               }
               else
               {
                  sigStatus ='<b style="color:red">'+OpenPGPZimlet.lang[15]+'</b>';
               }
            }
         }
         catch (err) 
         {
            sigStatus =OpenPGPZimlet.lang[41]+' '+OpenPGPZimlet.lang[39];
         }    
         document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar'+myWindow.fArguments['domId']).innerHTML='<img style="vertical-align:middle" src="'+myWindow.getResource("icon.png")+'"> OpenPGP: <b>'+ sigStatus + '</b>';

         // Got a decrypted message that does not need further mime parsing
         if(myWindow.fArguments['hasMIME']== false)
         {
            document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.fArguments['domId']).innerHTML=OpenPGPZimlet.prototype.urlify(OpenPGPZimlet.prototype.escapeHtml(plaintext.data));
            document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.fArguments['domId']).setAttribute('data-decrypted',plaintext.data);
         }
         // Go a message that needs MIME parsing (PGP/MIME)
         else
         {
            document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.fArguments['domId']).innerHTML='';
            try {
               document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_att'+myWindow.fArguments['domId']).innerHTML='';
            } catch (err) {}
                       
            var boundary = plaintext.data.match(/boundary="([^"\\]*(?:\\.[^"\\]*)*)"/i);
            
            //Got a multipart message
            if(boundary)
            {
               boundary = '--'+boundary[1];
   
               var multipart = plaintext.data.split(boundary);
               
               //Remove the headers from the message
               multipart.shift();
               //Remove junk on the end of the message
               multipart.pop();
   
               //Check for nested multipart/mixed messages
               var partArr=multipart[0].split('\n\n', 2);
               if (partArr[0].indexOf('Content-Type: multipart/mixed')> -1)
               {
                  var boundary = partArr[0].match(/boundary="([^"\\]*(?:\\.[^"\\]*)*)"/i);
                  boundary = '--'+boundary[1];
      
                  var multipart = plaintext.data.split(boundary);
                  
                  //Remove the headers from the message
                  multipart.shift();
                  //Remove junk on the end of the message
                  multipart.pop();               
               }
   
               multipart.forEach(function(part) {
                  var partArr=part.split('\n\n', 2);
                  if (partArr[0].indexOf('Content-Disposition: attachment')> -1)
                  {                                        
                     var filename = partArr[0].match(/filename="([^"\\]*(?:\\.[^"\\]*)*)"/i);
                     
                     if (partArr[0].indexOf('Content-Transfer-Encoding: base64')> -1)
                     {
                        partArr[1] = partArr[1].split('=\n', 1);
                        partArr[1] = partArr[1] + '=';
                        partArr[1] = partArr[1].replace(/(\r\n|\n|\r)/gm,"");
                        document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_att'+myWindow.fArguments['domId']).innerHTML = document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_att'+myWindow.fArguments['domId']).innerHTML + '<img style="vertical-align:middle" src="'+myWindow.getResource("file-pgp-encrypted.png")+'"> <a class="AttLink" onclick="OpenPGPZimlet.prototype.downloadBlob(\''+OpenPGPZimlet.prototype.escapeHtml(filename[1])+'\',\'octet/stream\',\''+partArr[1]+'\')">'+OpenPGPZimlet.prototype.escapeHtml(filename[1])+'</a>&nbsp;';
                     }
                     else
                     {
                        if (partArr[0].indexOf('Content-Transfer-Encoding: quoted-printable')> -1)
                        {
                           part = OpenPGPZimlet.prototype.quoted_printable_decode(part);
                        }                     
                        part = part.substring(part.indexOf('\n\n'));
                        document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_att'+myWindow.fArguments['domId']).innerHTML = document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_att'+myWindow.fArguments['domId']).innerHTML + '<img style="vertical-align:middle" src="'+myWindow.getResource("file-pgp-encrypted.png")+'"> <a class="AttLink" onclick="OpenPGPZimlet.prototype.downloadBlob(\''+OpenPGPZimlet.prototype.escapeHtml(filename[1])+'\',\'octet/stream\',\''+btoa(part)+'\')">'+OpenPGPZimlet.prototype.escapeHtml(filename[1])+'</a>&nbsp;';
                        if (partArr[0].indexOf('Content-Type: application/pgp-keys') > -1)
                        {
                           //Import public key
                           var pubKeyTxt = part.match(/(-----BEGIN PGP PUBLIC KEY BLOCK-----)([^]+)(-----END PGP PUBLIC KEY BLOCK-----)/g);
                           if(pubKeyTxt)
                           {
                              if(pubKeyTxt[0])
                              {
                                 document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_att'+myWindow.fArguments['domId']).innerHTML = document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_att'+myWindow.fArguments['domId']).innerHTML + '|&nbsp;<a class="AttLink" id="btnImport'+myWindow.fArguments['domId']+'">'+OpenPGPZimlet.lang[73]+'</a>&nbsp;';
                                 var btnImport = document.getElementById("btnImport"+myWindow.fArguments['domId']);
                                 btnImport.onclick = AjxCallback.simpleClosure(OpenPGPZimlet.prototype.displayDialog, this, 9, OpenPGPZimlet.lang[73], pubKeyTxt[0]);
                              }   
                           }
                        }
                     }           
                  }                     
                  else
                  {
                     //display body part
                     OpenPGPZimlet.prototype.displayMimeBodyPart(part, myWindow.fArguments['domId']);
                  }
               });
            }   
            else
            {
               /* A pgp/mime message without multipart boundary
                * https://github.com/Zimbra-Community/pgp-zimlet/issues/182
               */
               //display body part
               OpenPGPZimlet.prototype.displayMimeBodyPart(plaintext.data, myWindow.fArguments['domId']);
            }   

            //Got NO attachments, remove the attLinks div from UI
            try {
               if(document.getElementById("tk_barrydegraaff_zimbra_openpgp_infobar_att"+myWindow.fArguments['domId']).innerHTML == '')
               {
                  var e = document.getElementById("tk_barrydegraaff_zimbra_openpgp_infobar_att"+myWindow.fArguments['domId']);
                  if (appCtxt.get(ZmSetting.GROUP_MAIL_BY) === ZmSetting.GROUP_BY_CONV)
                  {
                     e.parentNode.parentNode.removeChild(e.parentNode);
                  }
                  else
                  {
                     e.parentNode.parentNode.parentNode.removeChild(e.parentNode.parentNode);
                  }                  
               }
            } catch (err) {}            
         }
         
         myWindow.cancelBtn();
      },
      function(err) {
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
         myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         //Decryption failed!
         OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[43], ZmStatusView.LEVEL_WARNING);
      });
   }
   else {
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);      
      //Wrong passphrase!
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[44], ZmStatusView.LEVEL_WARNING);
   }
};

/** This method parses/decodes and displays a body part from pgp/mime
 * @param {string} part - message part
 * @param {string} domId - the DOM id where to display the result
 * */ 
OpenPGPZimlet.prototype.displayMimeBodyPart =
function(part, domId) {
   var partArr=part.split('\n\n', 2);
   partArr[1] = part.substring(part.indexOf('\n\n')+2);

   var headers = partArr[0];
   
   var body = partArr[1];
   
   if (headers.indexOf('Content-Transfer-Encoding: base64')> -1)
   {
      //just using atob will break utf-8 encoded characters in the base64 encoded message
      //http://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
      body = decodeURIComponent(escape(window.atob(body)));
   }

   if (headers.indexOf('Content-Transfer-Encoding: quoted-printable')> -1)
   {
      body = OpenPGPZimlet.prototype.quoted_printable_decode(body);
   }
   
   if(headers.indexOf('text/html')> -1)
   {
      body = OpenPGPZimlet.prototype.htmlToText(body);
   }

   document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+domId).innerHTML = document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+domId).innerHTML + OpenPGPZimlet.prototype.urlify(OpenPGPZimlet.prototype.escapeHtml(body));
   document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+domId).setAttribute('data-decrypted',body);   
}

/** This method is called when the Decrypt File dialog "OK" button is clicked after private key has been entered for decrypting a file.
 * and will decrypt the OpenPGP encrypted file. The result is a download in the browser.
 * @param {arraybuffer} fArguments.0 - the OpenPGP encrypted file
 * @param {string} fArguments.1 - the file name
 * */ 
OpenPGPZimlet.prototype.okBtnDecryptFile =
function(fArguments) {
   
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("privateKeyInput").style.backgroundImage = "url('"+this.getResource("loading.gif")+"')";
   
   var privateKeyInput = document.getElementById("privateKeyInput").value;
   OpenPGPZimlet.privateKeyCache = privateKeyInput;
   var passphraseInput = document.getElementById("passphraseInput").value;

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
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[38], ZmStatusView.LEVEL_WARNING);
      return;
   }

   if (success) {
      try {
         var message = openpgp.message.read(new Uint8Array(fArguments[0]));
      }
      catch(err) {
         this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
         //Could not read armored message!
         this.status(OpenPGPZimlet.lang[7], ZmStatusView.LEVEL_CRITICAL);
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

      OpenPGPZimlet.addressBookPublicKeys.forEach(function(pubKeyEntry) {
         var pubKeyEntry = openpgp.key.readArmored(pubKeyEntry);
         pubKey = pubKey.concat(pubKeyEntry.keys);
      });
   }
   catch(err) {
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      //Could not parse your trusted public keys!
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[13], ZmStatusView.LEVEL_WARNING);
      return;
   }
      // There should be a cleaner way to do this than stashing 
      // the parent in myWindow but I've not worked it out yet!
      var myWindow = this;
      options = {
          message: message,           // parse encrypted bytes
          publicKeys: pubKey,         // for verification (optional)
          privateKey: privKey,        // for decryption
          format: 'binary'
      };
      
      myWindow.fArguments = fArguments;
      
      openpgp.decrypt(options).then(function (plaintext) {
         try 
         {
            if(plaintext.data+plaintext.signatures[0].valid)
            {
               if(plaintext.signatures[0].valid==true)
               {                        
                  //Got a good signature.
                  OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[14], ZmStatusView.LEVEL_INFO);
               }
               else
               {                      
                  //Got a BAD signature.
                  OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[15], ZmStatusView.LEVEL_CRITICAL);
               }
            }
         }
         catch (err) 
         {
         }                 
         
         //Remove .pgp from decrypted file
         if (myWindow.fArguments[1].substring(myWindow.fArguments[1].length -4) == '.pgp')
         {
            myWindow.fArguments[1] = myWindow.fArguments[1].substring(0, myWindow.fArguments[1].length -4);
         }
         
         OpenPGPZimlet.prototype.downloadBlob(myWindow.fArguments[1],'zimbra/pgp',plaintext.data);

         try {
            myWindow._dialog.popdown();
         } catch (err) { }   
         },
         function(err) {
         myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
         //Decryption failed!
         OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[43], ZmStatusView.LEVEL_WARNING);
         }
     );
   }
   else {
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      //Wrong passphrase!
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[44], ZmStatusView.LEVEL_WARNING);
   }
};


/** This method stores a private key to html localstorage with AES-256 encryption.
 * @param {string} aes_password - the password for symmetric encryption
 * @param {string} privatekey - the private key to store
 */
OpenPGPZimlet.prototype.localStorageSave = 
function(aes_password, privatekey) {
   //Do not allow to store invalid private keys
   var pgpPrivKeyRegEx = new RegExp('[\-]*BEGIN PGP PRIVATE KEY BLOCK[\-]*');
   if (privatekey.match(pgpPrivKeyRegEx)) 
   {      
      localStorage['zimbra_openpgp_privatekey'+OpenPGPZimlet.prototype.getUsername()] = Aes.Ctr.encrypt(privatekey, OpenPGPZimlet.settings['aes_password'], 256);
      OpenPGPZimlet.privateKeyCache=privatekey;
   }
   else
   {
      localStorage['zimbra_openpgp_privatekey'+OpenPGPZimlet.prototype.getUsername()] = '';
      OpenPGPZimlet.privateKeyCache='';
   }   
}

/** This method decrypts a private key from html localstorage with AES-256 encryption.
 * It also encrypts localStorage that was created in previous versions of the Zimlet.
 * @returns {string} privkey - the ascii armored private key
 */
OpenPGPZimlet.prototype.localStorageRead = 
function() {
   if(localStorage['zimbra_openpgp_privatekey'+OpenPGPZimlet.prototype.getUsername()])
   {
      var pgpPrivKeyRegEx = new RegExp('[\-]*BEGIN PGP PRIVATE KEY BLOCK[\-]*');
      if (localStorage['zimbra_openpgp_privatekey'+OpenPGPZimlet.prototype.getUsername()].match(pgpPrivKeyRegEx)) 
      {      
         return localStorage['zimbra_openpgp_privatekey'+OpenPGPZimlet.prototype.getUsername()];
      }
      else
      {
         //call decrypt function 
         var privkey = Aes.Ctr.decrypt(localStorage['zimbra_openpgp_privatekey'+OpenPGPZimlet.prototype.getUsername()], OpenPGPZimlet.settings['aes_password'], 256);
         if (privkey.match(pgpPrivKeyRegEx))
         {
            return privkey;
         }
         else
         {
            return;
         }   
      }
   }
   else
   {
      return;
   }
}

/** This method decodes a passphrase from server LDAP or decrypts it from html localstorage.
*/
OpenPGPZimlet.prototype.passphraseRead = 
function(zimbra_openpgp_privatepassFromUserProperty) {
   var decryptedPassphrase = '';
   if (OpenPGPZimlet.settings['store_passphrase_locally'] == 'true')
   {
      if(localStorage['zimbra_openpgp_privatepass'+OpenPGPZimlet.prototype.getUsername()])
      {
         decryptedPassphrase = Aes.Ctr.decrypt(localStorage['zimbra_openpgp_privatepass'+OpenPGPZimlet.prototype.getUsername()].substring(15), OpenPGPZimlet.settings['aes_password'], 256);
      }   
   }
   else
   {
      if(zimbra_openpgp_privatepassFromUserProperty)
      {
         decryptedPassphrase = Aes.Ctr.decrypt(zimbra_openpgp_privatepassFromUserProperty.substring(15), OpenPGPZimlet.settings['aes_password'], 256);
      }   
   }
   
   if (!decryptedPassphrase)
   {
      OpenPGPZimlet.privatePassCache = '';
   }
   else if (decryptedPassphrase.indexOf('-openpgppassphrase-') > 1)
   {
      OpenPGPZimlet.privatePassCache = decryptedPassphrase.substring(27);
   }
   else
   {
      OpenPGPZimlet.privatePassCache = '';
   }
}   

/** This method is called when the dialog "OK" button is clicked in the Manage Public Keys dialog.
 */
OpenPGPZimlet.prototype.okBtnPubKeySave =
function() {   
   //Per user configuration options are jsonified into a single Zimbra userProperty
   OpenPGPZimlet.settings['enable_contacts_scanning'] = (document.getElementById("enable_contacts_scanning").checked ? 'true' : 'false');
   OpenPGPZimlet.settings['auto_decrypt'] = (document.getElementById("auto_decrypt").checked ? 'true' : 'false');
   OpenPGPZimlet.settings['store_passphrase_locally'] = (document.getElementById("store_passphrase_locally").checked ? 'true' : 'false');
   OpenPGPZimlet.settings['max_message_size'] = (document.getElementById("max_message_size").value);
   
   if((!OpenPGPZimlet.settings['max_message_size']) ||
   (OpenPGPZimlet.settings['max_message_size'] < 100000) ||
   (OpenPGPZimlet.settings['max_message_size'] > 100000000))
   {
      OpenPGPZimlet.settings['max_message_size'] = 1000000;
   }

   appCtxt.set(ZmSetting.MAX_MESSAGE_SIZE, OpenPGPZimlet.settings['max_message_size']);   
   
   if ((!OpenPGPZimlet.settings['aes_password']) ||
   ((document.getElementById("set_new_aes_password").checked ? 'true' : 'false') == 'true')) 
   {   
      OpenPGPZimlet.settings['aes_password'] = OpenPGPZimlet.prototype.pwgen();
   }   
   OpenPGPZimlet.prototype.localStorageSave(OpenPGPZimlet.settings['aes_password'], document.getElementById("privateKeyInput").value);
   var encryptedPassphrase = Aes.Ctr.encrypt('-----openpgppassphrase-----'+document.getElementById("privatePassInput").value, OpenPGPZimlet.settings['aes_password'], 256);
   if (OpenPGPZimlet.settings['store_passphrase_locally'] == 'true') 
   {      
      localStorage['zimbra_openpgp_privatepass'+OpenPGPZimlet.prototype.getUsername()] = '---cryptedpp---' + encryptedPassphrase;
      this.setUserProperty("zimbra_openpgp_privatepass", '', false);
   }
   else
   {
      localStorage['zimbra_openpgp_privatepass'+OpenPGPZimlet.prototype.getUsername()] = '';
      this.setUserProperty("zimbra_openpgp_privatepass", '---cryptedpp---' + encryptedPassphrase, false);
   }

   //Store values to LDAP
   this.setUserProperty("zimbra_openpgp_options", JSON.stringify(OpenPGPZimlet.settings), false);
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
  
   OpenPGPZimlet.prototype.readAddressBook();  
   //Suppress dwt dispose on popdown type errors
   try {
      this._dialog.popdown();
   } catch (err) { }   
};

/** This method is called for importing a public key received via email or key server lookup.
 * @param {string} publicKey - ASCII armored PGP Public Key
 */
OpenPGPZimlet.prototype.okBtnImportPubKey = 
function(publicKey) { 
   //Find an open/free Trusted Public Key field to store our import
   var freecount = 2;
   var freekey= 0;
   try {
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
      var combinedPublicKeys = [publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys];

      var openslots = [];
      var fingerprints = [];
      combinedPublicKeys.forEach(function(pubKey) {
         if(!pubKey[0])
         {
            openslots[freekey]= freecount;                     
            freekey++;
         }
         else
         {
            var publicKeyPacket = pubKey[0].primaryKey;
            if (publicKeyPacket != null) {
            fingerprints[publicKeyPacket.fingerprint] = publicKeyPacket.fingerprint;
            }
         }
         freecount++;
      });

      //Place our own Public Key in the list of known fingerprints
      var publicKeys1= openpgp.key.readArmored(this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value);
      fingerprints[publicKeys1.keys[0].primaryKey.fingerprint] = publicKeys1.keys[0].primaryKey.fingerprint;

   } catch (err) { }
   
   //Check the fingerprint of the key we are importing   
   try {
      var publicKeyPacket = publicKey.keys[0].primaryKey;
      var importFingerprint = publicKeyPacket.fingerprint;
   } catch (err) { }
  
   //Find out if the fingerprint of the key we are importing is already trusted and avoid dupes
   if((publicKey.keys[0]) && (importFingerprint == fingerprints[importFingerprint]))
   {
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[78], ZmStatusView.LEVEL_INFO);       
   }
   else if((publicKey.keys[0]) && (openslots[0]))
   {
      this.setUserProperty('zimbra_openpgp_pubkeys'+openslots[0], publicKey.keys[0].armor(), true);
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[75] + " " + OpenPGPZimlet.lang[26] + " " + openslots[0], ZmStatusView.LEVEL_INFO); 
   }
   else
   {
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[76], ZmStatusView.LEVEL_WARNING); 
   } 

   try{
      this._dialog.setContent('');
      this._dialog.popdown();
   }
      catch (err) {
   }
          
};

/** This method is called for clear-signing messages. Compose -> Sign button -> Dialog -> OK.
 * It should put the resulting message in the current compose tab.
 */
OpenPGPZimlet.prototype.okBtnSign =
function() {
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("privateKeyInput").style.backgroundImage = "url('"+this.getResource("loading.gif")+"')";
   
   var privateKeyInput = document.getElementById("privateKeyInput").value;
   OpenPGPZimlet.privateKeyCache = privateKeyInput;
   var passphrase = document.getElementById("passphraseInput").value;
   OpenPGPZimlet.privatePassCache = passphrase;
   var message = document.getElementById("message").value;
   //Work-around bug: https://github.com/openpgpjs/openpgpjs/issues/311
   message = message.trim();
   
   //Remove Unicode Character 'ZERO WIDTH SPACE' (U+200B) from clear signed messages. To avoid breaking PGP Armor
   message = message.replace(/\u200B/g,'');
       
   /**Clear signing messages that have ----- in the body text, break PGP Armor,
   Replacing '-' at the beginning of each line with '- -', GnuPG does something 
   similar.*/
   message = message.replace(/^\-/mg," - -");

   try {
      var privKeys = openpgp.key.readArmored(privateKeyInput);
      var privKey = privKeys.keys[0];
      var success = privKey.decrypt(passphrase);
   }
   catch (err) {
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      //Could not parse private key!
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[38], ZmStatusView.LEVEL_WARNING);
      return;
   }

   if (success) {
      var myWindow = this;
      options = {
          data: message,             // parse encrypted bytes
          privateKeys: privKey,      // for signing
          armor: true,
      };
      
      openpgp.sign(options).then(function (plaintext) {
         var composeView = appCtxt.getCurrentView();
         composeView.getHtmlEditor().setMode(Dwt.TEXT);   
         composeView.getHtmlEditor().setContent(plaintext.data);    
      
         try {
            myWindow._dialog.popdown();
         } catch (err) { }   
      },
      function(err) {
         myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
         //Signing failed!
         OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[45], ZmStatusView.LEVEL_WARNING);
      });
   }
   else {
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      //Wrong passphrase!
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[44], ZmStatusView.LEVEL_WARNING);
   }
};

/** This method is called when a user clicks `Send my public key` from the Zimlet menu.
 * @param {string} message - base64 encoded ASCII armored PGP Public Key
 * */
OpenPGPZimlet.prototype.sendTo =
function(message) {
   
   var publicKeys = openpgp.key.readArmored(atob(message));
   if(publicKeys.keys[0])
   {
      userid = publicKeys.keys[0].users[0].userId.userid;
      
      publicKeyPacket = publicKeys.keys[0].primaryKey;
      var keyLength = "";
      if (publicKeyPacket != null) {
         if (publicKeyPacket.mpi.length > 0) {
            keyLength = (publicKeyPacket.mpi[0].byteLength() * 8);
         }
      }
      
      result = "User ID[0]: " + userid + "\r\nFingerprint: " + publicKeyPacket.fingerprint + "\r\nPrimary key length: " + keyLength + "\r\nCreated: " + publicKeyPacket.created + "\r\n\r\n";
   
      var composeController = AjxDispatcher.run("GetComposeController");
      if(composeController) {
         var appCtxt = window.top.appCtxt;
         var zmApp = appCtxt.getApp();
         var newWindow = zmApp != null ? (zmApp._inNewWindow ? true : false) : true;
         var params = {action:ZmOperation.NEW_MESSAGE, inNewWindow:null, composeMode:Dwt.TEXT,
         toOverride:null, subjOverride:null, extraBodyText:"-\r\n\r\n\r\n\r\n\r\n\r\n"+result + atob(message), callback:null}
         composeController.doAction(params); // opens asynchronously the window.
      }
   }
   else {
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[13], ZmStatusView.LEVEL_WARNING); 
   }   
   
};


/** This method is called when the dialog "OK" button is clicked for key pair generation.
 */
OpenPGPZimlet.prototype.okBtnKeyPair =
function() {
   var uidName = document.getElementById("uidName").value;
   var uidEmail = document.getElementById("uidEmail").value;
   //Replace spaces from user input
   uidEmail = uidEmail.replace(/\s/g,'');
   var keyLength = document.getElementById("keyLength").value;
   var passphrase = document.getElementById("passphraseInput").value;
   var keyStore = document.getElementById("keyStore").checked;

   if ((!uidName) || (!uidEmail) || (!passphrase)) {
      //You must provide a user ID and passphrase
      this.status(OpenPGPZimlet.lang[46], ZmStatusView.LEVEL_WARNING);
      return;
   }

   

   this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.cancelBtn));
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);

   //Now generating your key pair
   this._dialog.setTitle(OpenPGPZimlet.lang[47]);
   this._dialog.setContent('<div style="width:650px; height: 240px; overflow-x: hidden; overflow-y: hidden;">'+OpenPGPZimlet.lang[48]+'<br><br><br><br><img src="'+this.getResource("loading.gif")+'" style="width:48px; height:48px; display: block; margin-left: auto; margin-right: auto" alt="loading"></div>');

   var myWindow = this;

   //Parsing the email list (multiple emails separated by comma)
   var userIdsArr = new Array();
   var startPos = 0;
   var indexPos = uidEmail.indexOf(",", startPos);
   while ( indexPos != -1 ) {
      userIdsArr.push({ name:uidName, email:uidEmail.substring(startPos, indexPos) });
      startPos = indexPos + 1;
      indexPos = uidEmail.indexOf(",", startPos);
   }
   userIdsArr.push({ name:uidName, email:uidEmail.substring(startPos, uidEmail.length) });
   
   var options = {
       userIds: userIdsArr, // multiple user IDs
       numBits: keyLength,                          // RSA key size
       passphrase: passphrase                       // protects the private key
   };
   
   try {  
      openpgp.generateKey(options).then(function(key)
      {
         if(keyStore)
         {
            if (!OpenPGPZimlet.settings['aes_password'])
            {
               OpenPGPZimlet.settings['aes_password'] = OpenPGPZimlet.prototype.pwgen();            
            }   
            myWindow.setUserProperty("zimbra_openpgp_options", JSON.stringify(OpenPGPZimlet.settings), false);
            OpenPGPZimlet.prototype.localStorageSave(OpenPGPZimlet.settings['aes_password'], key.privateKeyArmored);
            OpenPGPZimlet.privateKeyCache=key.privateKeyArmored;
            var encryptedPassphrase = Aes.Ctr.encrypt('-----openpgppassphrase-----'+passphrase, OpenPGPZimlet.settings['aes_password'], 256);
            if (OpenPGPZimlet.settings['store_passphrase_locally'] == 'true') 
            {      
               localStorage['zimbra_openpgp_privatepass'+OpenPGPZimlet.prototype.getUsername()] = '---cryptedpp---' + encryptedPassphrase;
               myWindow.setUserProperty("zimbra_openpgp_privatepass", '', false);
            }
            else
            {
               localStorage['zimbra_openpgp_privatepass'+OpenPGPZimlet.prototype.getUsername()] = '';
               myWindow.setUserProperty("zimbra_openpgp_privatepass", '---cryptedpp---' + encryptedPassphrase, false);
            }
            OpenPGPZimlet.privatePassCache = passphrase;
            myWindow.setUserProperty("zimbra_openpgp_pubkeys1", key.publicKeyArmored, true);
         }
         //Your new key pair
         myWindow._dialog.setTitle(OpenPGPZimlet.lang[50]);
         myWindow._dialog.setContent('<div style="width:650px; height: 240px; overflow-x: hidden; overflow-y: auto;"><table style="width:650px;">'+OpenPGPZimlet.lang[49]+':<br><br><textarea class="barrydegraaff_zimbra_openpgp-msg" style="height:200px;">Passphrase ' + passphrase + ' for ' + uidName + ' <' + uidEmail + '>' + '\r\n\r\n'+key.privateKeyArmored+'\r\n\r\n'+key.publicKeyArmored+'\r\n\r\nlength: '+keyLength+' ' + '\r\nfingerprint: '+key.key.primaryKey.fingerprint+' \r\ncreated: '+key.key.primaryKey.created+'</textarea></div>');
         myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      },function(err) {
         // failure generating key
      });       
   } catch (err) {
      OpenPGPZimlet.prototype.status(err, ZmStatusView.LEVEL_WARNING);
      try {
         myWindow._dialog.popdown();
      } catch (err) { }  
   }   
};

/** This method reads public key details and returns them in HTML formatted style for adding it to the DOM
 * @param {string} pubkey - ASCII armored PGP Public Key
 * @returns {string} result - HTML string with key details
 * */
OpenPGPZimlet.prototype.pubkeyInfo =
function(pubkey) {
   
   try {
      var publicKeys = openpgp.key.readArmored(pubkey);
      
      userid = publicKeys.keys[0].users[0].userId.userid;
      userid = OpenPGPZimlet.prototype.escapeHtml(userid);
      
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
      result = '<small>'+OpenPGPZimlet.lang[13]+'</small>';
   }
   return result;
}

/** This method generates an HTML select list with public keys from the server LDAP combined with those in the users contacts (optional).
 * @returns {string} result - HTML string with SELECT input
 * */
OpenPGPZimlet.prototype.pubKeySelect =
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
      var combinedPublicKeys = [publicKeys1.keys, publicKeys2.keys, publicKeys3.keys, publicKeys4.keys, publicKeys5.keys, publicKeys6.keys, publicKeys7.keys, publicKeys8.keys, publicKeys9.keys, publicKeys10.keys, publicKeys11.keys, publicKeys12.keys, publicKeys13.keys, publicKeys14.keys, publicKeys15.keys, publicKeys16.keys, publicKeys17.keys, publicKeys18.keys, publicKeys19.keys, publicKeys20.keys, publicKeys21.keys, publicKeys22.keys, publicKeys23.keys, publicKeys24.keys, publicKeys25.keys, publicKeys26.keys, publicKeys27.keys, publicKeys28.keys, publicKeys29.keys, publicKeys30.keys];

      OpenPGPZimlet.addressBookPublicKeys.forEach(function(pubKey) {
         var pubKey = openpgp.key.readArmored(pubKey);
         combinedPublicKeys = combinedPublicKeys.concat([pubKey.keys]);            
      });      
      
      var result = '';
      var keycount = 0;
      var userIdCount = 0;
      combinedPublicKeys.forEach(function(entry) {
         if(entry[0]) {
            for (i = 0; i < entry[0].users.length; i++) {
               if (entry[0].users[i].userId)
               {
                  userid = entry[0].users[i].userId.userid.replace(/\</g,"&lt;");
                  userid = userid.replace(/\>/g,"&gt;") ;
                  var selected;
                  if((keycount == 0) && (publicKeys1.keys))
                  {
                        selected = 'selected class="selectme" ';
                        userIdCount++;
                  }
                  else
                  {
                     selected = '';
                  }                
                  result = result + '<option ' + selected + ' title="fingerprint: '+entry[0].primaryKey.fingerprint+' \r\ncreated: '+entry[0].primaryKey.created+'" value="'+entry[0].armor()+'">'+userid+'</option>';
               }
            }
         }
         keycount++;
      });
      result = '<select class="barrydegraaff_zimbra_openpgp-input" id="pubKeySelect" multiple onclick="OpenPGPZimlet.prototype.forceSelectSelf()">' + result + '</select>';
   }
   catch(err) {
      //Could not parse your trusted public keys!
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[13], ZmStatusView.LEVEL_WARNING);
      return;
   }
   return result;
}

/** When a user encrypts a message, the Zimlets selects the first public key by default (encrypt to self).
 * If you do not want to encrypt to yourself, you must click your name, and then the recipient
 */
OpenPGPZimlet.prototype.forceSelectSelf =
function() {
   var pubKeySelect = document.getElementById('pubKeySelect');
   var selection = [];
   var numberSelected = 0;
   for (k=0; k < pubKeySelect.options.length ; k++) {
      if (pubKeySelect.options[k].selected) {                  
         selection[k]=k;
         numberSelected++;
      }   
   }

   if((selection[0]== 0) && (numberSelected == 1))
   {
      try{         
         var selectme = document.getElementsByClassName("selectme");
         for (var index = 0; index < selectme.length; index++) {
            selectme[index].selected = false;
            selectme[index].className = 'nonotselect';
         }
      } catch (err) { }
   }
   else
   {
      try{
         var selectme = document.getElementsByClassName("selectme");
         for (var index = 0; index < selectme.length; index++) {
            selectme[index].selected = true;
         }
      } catch (err) { }
   }
}   

/** This method is called when OK is pressed in encrypt dialog. Compose Tab -> Encrypt button -> Dialog -> OK.
 * It should encrypt the email message and put it back in the current compose tab and also upload encrypted attachment and attach them to the current draft email.
 * */
OpenPGPZimlet.prototype.okBtnEncrypt =
function() {

   if (document.getElementById("message").value.match(/----BEGIN PGP PRIVATE KEY BLOCK----/i))
   {
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[85], ZmStatusView.LEVEL_WARNING);
      return;         
   }


   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("privateKeyInput").style.backgroundImage = "url('"+this.getResource("loading.gif")+"')";
   
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

   if (pubKeys.length < 1)
   {
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      //Please select recipient(s).
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[51], ZmStatusView.LEVEL_WARNING);
      return;
   }   
   
   var privateKeyInput = document.getElementById("privateKeyInput").value;
   var passphrase = document.getElementById("passphraseInput").value;

   // There should be a cleaner way to do this than stashing 
   // the parent in myWindow but I've not worked it out yet!
   var myWindow = this;
      
   if ((privateKeyInput.length > 0) && (passphrase.length > 0))
   {
      OpenPGPZimlet.privateKeyCache = privateKeyInput;
      OpenPGPZimlet.privatePassCache = passphrase;

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
         OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[38], ZmStatusView.LEVEL_WARNING);
         return;
      }

      if (!success) {
         this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
         //Wrong passphrase!
         OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[44], ZmStatusView.LEVEL_WARNING);
         return;
      }
   }   

   options = {
      data: msg,             // input as string
      publicKeys: pubKeys,   // for encryption
      privateKeys: privKey,  // for signing (optional)
      armor: true            // ASCII armor
   };
   myWindow.attachment_ids = [];
   openpgp.encrypt(options).then(function (message) {
      var composeView = appCtxt.getCurrentView();
      composeView.getHtmlEditor().setMode(Dwt.TEXT);   
      composeView.getHtmlEditor().setContent(message.data);                
      composeView.setAddress(AjxEmailAddress.TO, addresses);
      var fileInputs = document.getElementsByClassName("fileInputPgpAttach");
      
      var numberOfAttachments = 0;
      for (var inputIndex = 0; inputIndex < fileInputs.length; inputIndex++) 
      {                
         for (var multiselectIndex = 0; multiselectIndex < fileInputs[inputIndex].files.length; multiselectIndex++)           
         {
            numberOfAttachments++;
         }
      }      
      
      if (numberOfAttachments > 0)
      {
         var attBubble = document.getElementsByClassName("attBubbleContainer");
         for (var index = 0; index < attBubble.length; index++) {
            attBubble[index].style.backgroundImage = 'url(\''+myWindow.getResource("progressround.gif")+'\')';
            attBubble[index].style.backgroundRepeat = "no-repeat";
            attBubble[index].style.backgroundPosition = "right"; 
         }
      }
      
      for (var inputIndex = 0; inputIndex < fileInputs.length; inputIndex++) 
      {                
         for (var multiselectIndex = 0; multiselectIndex < fileInputs[inputIndex].files.length; multiselectIndex++)           
         {
            (function(file) {
               var name = file.name;
               var reader = new FileReader();  
               reader.onload = function(e) 
               {  
                  options = {
                     data: new Uint8Array(reader.result), 
                     publicKeys: pubKeys,   // for encryption
                     privateKeys: privKey,  // for signing (optional)
                     armor: false 
                  };
                  
                  openpgp.encrypt(options).then(function (message) {         
                     //OpenPGPZimlet.prototype.downloadBlob(file.name + '.pgp','zimbra/pgp',message.message.packets.write());
                     req = new XMLHttpRequest();
                     req.open("POST", "/service/upload?fmt=extended,raw", false);        
                     req.setRequestHeader("Cache-Control", "no-cache");
                     req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                     req.setRequestHeader("Content-Type",  "application/octet-stream" + ";");
                     req.setRequestHeader("X-Zimbra-Csrf-Token", window.csrfToken);
                     req.setRequestHeader("Content-Disposition", 'attachment; filename="'+ file.name + '.pgp"');
                     req.onload = function(e)
                     {
                        var resp = eval("["+req.responseText+"]");
                        var respObj = resp[2];
                        var attId = "";
                        for (var i = 0; i < respObj.length; i++) 
                        {
                           if(respObj[i].aid != "undefined") {
                              myWindow.attachment_ids.push(respObj[i].aid);
                              
                              //If there are no more attachments to upload to Zimbra, attach them to the draft message
                              if(myWindow.attachment_ids.length == numberOfAttachments)
                              {
                                 var attachment_list = myWindow.attachment_ids.join(",");
                                 var controller = appCtxt.getApp(ZmApp.MAIL).getComposeController(appCtxt.getApp(ZmApp.MAIL).getCurrentSessionId(ZmId.VIEW_COMPOSE));

                                 
                                 var attBubble = document.getElementsByClassName("attBubbleContainer");
                                 for (var index = 0; index < attBubble.length; index++) {
                                    attBubble[index].style.backgroundImage = 'url(\'\')';
                                 }
                                 controller.saveDraft(ZmComposeController.DRAFT_TYPE_MANUAL, attachment_list);
                                 try {
                                    myWindow._dialog.popdown();
                                 } catch (err) { } 
                              }
                           }
                        }
                     }      
                     req.send(message.message.packets.write());                           
                  }, 
                  function(err) {
                     myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
                     myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
                     document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
                     //Could not encrypt message!
                     OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[52], ZmStatusView.LEVEL_WARNING);
                  });
               }
               reader.readAsArrayBuffer(file);
            })(fileInputs[inputIndex].files[multiselectIndex]);               
         }                      
      }

      if (numberOfAttachments == 0)
      {
         try {
            myWindow._dialog.popdown();
         } catch (err) { }               
      }
   }, 
   function(err) {
      myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      //Could not encrypt message!
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[52], ZmStatusView.LEVEL_WARNING);
  });      
};


/** This method is called when the dialog "CANCEL" button is clicked.
 * It pops-down the current dialog.
 */
OpenPGPZimlet.prototype.cancelBtn =
function() {
   try{
      this._dialog.setContent('');
      this._dialog.popdown();
   }
      catch (err) {
  }
};

/** This method generates a password like passphrase for lazy users.
 * @returns {string} pass -  a 25 character password
 */
OpenPGPZimlet.prototype.pwgen =
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

/** Add encrypt and sign buttons to the toolbar in the compose tab. 
  * This method is called by the Zimlet framework when application toolbars are initialized.
  * See {@link https://files.zimbra.com/docs/zimlet/zcs/8.6.0/jsapi-zimbra-doc/symbols/ZmZimletBase.html#initializeToolbar ZmZimletBase.html#initializeToolbar}
  * 
  * @param	{ZmApp}				app				the application
  * @param	{ZmButtonToolBar}	toolbar			the toolbar
  * @param	{ZmController}		controller		the application controller
  * @param	{string}			viewId			the view Id
 * */
OpenPGPZimlet.prototype.initializeToolbar =
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
         text    : OpenPGPZimlet.lang[2],
         tooltip: OpenPGPZimlet.lang[2] + " " + OpenPGPZimlet.lang[53],
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
         text    : OpenPGPZimlet.lang[1],
         tooltip: OpenPGPZimlet.lang[1] + " " + OpenPGPZimlet.lang[53],
         index: 5, //position of the button
         image: "zimbraicon" //icon
      };
      var button = toolbar.createOp("OPENPGPSIGN", buttonArgs);
      button.addSelectionListener(new AjxListener(this, this.composeSignHandler, controller));
   }
};

/** This method is called when the Encrypt button is clicked in the compose tab. It switches the compose mode to text/plain and opens the encrypt dialog.
 * See {@link https://files.zimbra.com/docs/zimlet/zcs/8.6.0/jsapi-zimbra-doc/symbols/ZmComposeController.html ZmComposeController}.
 * @parameter {ZmComposeController}  controller - the current compose tab
 * */
OpenPGPZimlet.prototype.composeEncryptHandler =
function(controller) {
   var composeMode = appCtxt.getCurrentView().getHtmlEditor().getMode();

   if(composeMode != 'text/plain')
   {
      appCtxt.getCurrentView().setComposeMode('text/plain');
   }
   
   var message = controller._getBodyContent();
   
   if(message.length < 1)
   {
      //Please compose message first
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[56], ZmStatusView.LEVEL_INFO);
      return;
   }
  
   this.displayDialog(6, OpenPGPZimlet.lang[2], message);
};

/** This method is called when the Sign button is clicked in the compose tab. It switches the compose mode to text/plain and opens the sign dialog.
 * See {@link https://files.zimbra.com/docs/zimlet/zcs/8.6.0/jsapi-zimbra-doc/symbols/ZmComposeController.html ZmComposeController}.
 * @parameter {ZmComposeController}  controller - the current compose tab
 * */
OpenPGPZimlet.prototype.composeSignHandler =
function(controller) {
   var composeMode = appCtxt.getCurrentView().getHtmlEditor().getMode();
   
   if(composeMode != 'text/plain')
   {
      appCtxt.getCurrentView().setComposeMode('text/plain');
   }
   
   var message = controller._getBodyContent();
   
   if(message.length < 1)
   {
      //Please compose message first
      OpenPGPZimlet.prototype.status(OpenPGPZimlet.lang[56], ZmStatusView.LEVEL_INFO);
      return;
   }
   
   this.displayDialog(4, OpenPGPZimlet.lang[1], message);
};

/** This method is called whenever the user changes his addressBook/contacts and on init.
 * It does an XHR request on the Zimbra REST API (export function). See {@link addressBookPublicKeys}.
 * */
OpenPGPZimlet.prototype.readAddressBook = function() {
   if (OpenPGPZimlet.settings['enable_contacts_scanning'] == 'false')
   {
      //Undefine contacts from addressbook
      OpenPGPZimlet.addressBookPublicKeys = [];
      return;
   }

   //For performance, no concurrent scanning of addressbook 
   if (OpenPGPZimlet.prototype.addressBookReadInProgress == true)
   {
      return;
   }
   
   OpenPGPZimlet.prototype.addressBookReadInProgress = true;
   
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

   OpenPGPZimlet.addressBookPublicKeys = [];
   contacts.forEach(function(entry) {      
      if(entry.indexOf("BEGIN PGP PUBLIC KEY BLOCK") > 0 ) 
      {
         OpenPGPZimlet.addressBookPublicKeys = [].concat(OpenPGPZimlet.addressBookPublicKeys, entry);
      }
   });

   OpenPGPZimlet.prototype.addressBookReadInProgress = false;
};


/** This method is called whenever we need to download an attachment in the browser.
 * Depending on the type parameter it takes a base64 string or arraybuffer and downloads an attachment binary-safe in the browser.
 * @param {string} filename - the filename
 * @param {string} type - if zimbra/pgp the base64Data param is of type arraybuffer otherwise it is a base64 string
 * @param {arraybuffer|string} base64Data - the base64 encoded file
 * */
OpenPGPZimlet.prototype.downloadBlob = function (filename, type, base64Data) {
   filename = filename ? filename : 'file.bin';
   type = type ? type : 'octet/stream';
   
   if (type=='zimbra/pgp')
   {
      //is already a pgp armored
      var blob = new Blob([base64Data], { type: type });
   }
   else
   {
      var dataBin = OpenPGPZimlet.prototype.base64DecToArr(base64Data);
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

/** Array of bytes to base64 string decoding
 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding$revision/773109 MDN Base64 encoding and decoding}.
*/
OpenPGPZimlet.prototype.b64ToUint6 = function (nChr) {
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

/** Base64 decode binary safe. 
 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding$revision/773109 MDN Base64 encoding and decoding}.
 * @param {string} nChr - base64 encoded string
*/
OpenPGPZimlet.prototype.base64DecToArr = function (sBase64, nBlocksSize) {
  var
    sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
    nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= OpenPGPZimlet.prototype.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;
    }
  }
  return taBytes;
}

/** This method decodes a quoted-printable encoded string. See {@link https://github.com/mathiasbynens/quoted-printable/blob/master/quoted-printable.js}.
 * @param {string} str - quoted-printable encoded string
 * @returns {string} - decoded string
 * */
OpenPGPZimlet.prototype.quoted_printable_decode = function(str) {
   return utf8.decode(quotedPrintable.decode(str));
}

/** This method creates clickable links in decrypted messages.
 * See {@link https://gist.github.com/vinitkumar/10000895}.
 * @param {string} text - a string without clickable links
 * @returns {string} - a string with http links replaced by HTML A HREF equivalent
 */
OpenPGPZimlet.prototype.urlify = function(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');  
}

/** This method performs a keyserver lookup.
 * It uses the keyserver defined in config_template.xml and stores the result to the Zimbra LDAP.
 */ 
OpenPGPZimlet.prototype.lookup = function() {
   document.getElementById('barrydegraaff_zimbra_openpgpResult').innerHTML = '<br><form id="lookupResult">';

   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", this._zimletContext.getConfig("keyserver")+'/pks/lookup?op=get&options=mr&search='+encodeURIComponent(document.getElementById('barrydegraaff_zimbra_openpgpQuery').value), true );

   xmlHttp.onreadystatechange = function (oEvent) 
   {  
      if (xmlHttp.readyState === 4) 
      {  
         if (xmlHttp.status === 200) 
         {  
            var pubkey = openpgp.key.readArmored(xmlHttp.responseText);       
            for (index = 0; index < pubkey.keys.length; ++index) 
            {
               publicKeyPacket = pubkey.keys[index].primaryKey;
               var keyLength = "";
               if (publicKeyPacket != null) {
                  if (publicKeyPacket.mpi.length > 0) {
                     keyLength = (publicKeyPacket.mpi[0].byteLength() * 8);
                  }
               }         
               
               document.getElementById('barrydegraaff_zimbra_openpgpResult').innerHTML = document.getElementById('barrydegraaff_zimbra_openpgpResult').innerHTML +
               '<table><tr><td><input name="lookupResult" value="'+pubkey.keys[index].armor()+'" type="radio">&nbsp;</td><td><b>User ID[0]: ' + OpenPGPZimlet.prototype.escapeHtml(pubkey.keys[index].users[0].userId.userid) + '</b></td></tr>' +
               '<tr><td></td><td><b>Fingerprint:' + publicKeyPacket.fingerprint + '</b></td></tr>' +
               '<tr><td></td><td>Primary key length: ' + keyLength + '</td></tr>' +
               '<tr><td></td><td>Created:' + publicKeyPacket.created+'</td></tr></table><hr style="width:550px; color: #bbbbbb; background-color: #bbbbbb; height: 1px; border: 0;">';
            }
            document.getElementById('barrydegraaff_zimbra_openpgpResult').innerHTML = document.getElementById('barrydegraaff_zimbra_openpgpResult').innerHTML + '</form>';

         } 
         else 
         {  
            document.getElementById('barrydegraaff_zimbra_openpgpResult').innerHTML = '<br>' + xmlHttp.status + ' '+ OpenPGPZimlet.prototype.escapeHtml(xmlHttp.statusText);
         }  
      }  
   }; 

   xmlHttp.send( null );
}

/** This method submits a public key to a keyserver.
 * It uses the keyserver defined in config_template.xml.
 */ 
OpenPGPZimlet.prototype.submit = function() {
   var keytext = document.getElementById('publicKeyInput1').value;
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_zimbra_openpgp').handlerObject;
   var xmlHttp = null; 
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "POST", zimletInstance._zimletContext.getConfig("keyserver")+'/pks/add', true );
   xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
   
   xmlHttp.onreadystatechange = function (oEvent) 
   {  
      if (xmlHttp.readyState === 4) 
      {         
         if (xmlHttp.status === 200) 
         {  
            document.getElementById('barrydegraaff_zimbra_openpgpResult').innerHTML = '<br>' + xmlHttp.status + ' '+ OpenPGPZimlet.prototype.escapeHtml(OpenPGPZimlet.prototype.htmlToText(xmlHttp.statusText + " "  + xmlHttp.responseText));
         }
         else
         {  
            document.getElementById('barrydegraaff_zimbra_openpgpResult').innerHTML = '<br>' + xmlHttp.status + ' '+ OpenPGPZimlet.prototype.escapeHtml(OpenPGPZimlet.prototype.htmlToText(xmlHttp.statusText));
         }            
      }
   }; 
   xmlHttp.send("keytext="+encodeURIComponent(keytext));
}

/** This method is called when the OK button is pressed in the Keyserver Lookup dialog.
 * At this time the UI only allows selection a single key for import. As dealing with multiple would be possible, but we could not re-use the code as the LDAP is too slow for dealing with multiple requests when fired with the current code.
 */
OpenPGPZimlet.prototype.okBtnLookup = function() {
var lookupResult = document.getElementsByName("lookupResult");
   for(var i = 0; i < lookupResult.length; i++) {
      if(lookupResult[i].checked == true) {
         this.okBtnImportPubKey(openpgp.key.readArmored(lookupResult[i].value));
      }
   }
};

/** This method is called to print a decrypted message, pop-up the browser print preview.
 * @param {string} printdivname - the HTML DIV id that contains the message to print
 * @param {ZmMailMsg} msg - an email in {@link https://files.zimbra.com/docs/zimlet/zcs/8.6.0/jsapi-zimbra-doc/symbols/ZmMailMsg.html ZmMailMsg} format
 * */
OpenPGPZimlet.prototype.printdiv = function(printdivname, msg) {
   var divToPrint=document.getElementById(printdivname);

   var sendDate = String(msg.sentDate);
   sendDate = OpenPGPZimlet.prototype.timeConverter(sendDate.substring(0,10))

   var index=0;
   var to = '';
   for (index = 0; index < msg._addrs.TO._array.length; ++index) {
       to =  to  + '"'+msg._addrs.TO._array[index].name+'" <'+msg._addrs.TO._array[index].address+'>, ';
   }
   to = to.substring(0, to.length-2);

   var index=0;
   var cc = '';
   for (index = 0; index < msg._addrs.CC._array.length; ++index) {
       cc =  cc  + '"'+msg._addrs.CC._array[index].name+'" <'+msg._addrs.CC._array[index].address+'>, ';
   }
   cc = cc.substring(0, cc.length-2);

   var header = '​​​​From: "'+msg._addrs.FROM._array[0].name+'" <'+msg._addrs.FROM._array[0].address+'>\r\n' +
   'To: '+to+'\r\n' +
   'Cc: '+cc+'\r\n' +
   'Sent: '+sendDate+'\r\n\r\n';
   
   var subject = msg.subject.replace(/\*\*\*.*\*\*\*/,'');

   var newWin=window.open('','Print-Window','width=800,height=600');
   newWin.document.open();
   newWin.document.write('<html><head><title>'+OpenPGPZimlet.prototype.escapeHtml(subject)+'</title></head><body><h1>'+OpenPGPZimlet.prototype.escapeHtml(subject)+'</h1><pre style="white-space: pre-wrap;word-wrap: break-word;">'+OpenPGPZimlet.prototype.escapeHtml(header) + divToPrint.innerHTML+'</pre></body></html>');
   newWin.document.close();
   newWin.focus();
   newWin.print();
   newWin.close();
}

// 
/** This method is called when the Reply(All) links are clicked on a decrypted message (in the reading pane).
 * It opens a new compose window with the ---original message---.
 * @param {ZmMailMsg} msg - an email in {@link https://files.zimbra.com/docs/zimlet/zcs/8.6.0/jsapi-zimbra-doc/symbols/ZmMailMsg.html ZmMailMsg} format
 * @param {string} decrypted - the decrypted mail body
 * @param {string} action - parameter to distinguish between 'replyAll' or reply
 * */
OpenPGPZimlet.prototype.reply = function(msg, decrypted, action) {
   var composeController = AjxDispatcher.run("GetComposeController");
   if(composeController) {
      var sendDate = String(msg.sentDate);
      sendDate = OpenPGPZimlet.prototype.timeConverter(sendDate.substring(0,10))

      var index=0;
      var to = '';
      for (index = 0; index < msg._addrs.TO._array.length; ++index) {
          to =  to  + '"'+msg._addrs.TO._array[index].name+'" <'+msg._addrs.TO._array[index].address+'>, ';
      }
      to = to.substring(0, to.length-2);

      var index=0;
      var cc = '';
      for (index = 0; index < msg._addrs.CC._array.length; ++index) {
          cc =  cc  + '"'+msg._addrs.CC._array[index].name+'" <'+msg._addrs.CC._array[index].address+'>, ';
      }
      cc = cc.substring(0, cc.length-2);

      var header = '----- Original Message -----\n' +
      '​​​​From: "'+msg._addrs.FROM._array[0].name+'" <'+msg._addrs.FROM._array[0].address+'>\n' +
      'To: '+to+'\n' +
      'Cc: '+cc+'\n' +
      'Sent: '+sendDate+'\n' +
      'Subject: '+msg.subject.replace(/\*\*\*.*\*\*\*/,'')+'\n\n';

      if (action == 'replyAll')
      {
         var ccOverride =  to + ', ' + cc;
      }
      else
      {
         var ccOverride = null;
      }
      
      var extraBodyText = header+document.getElementById(decrypted).dataset.decrypted;
      extraBodyText = extraBodyText.replace(/^/gm, "> ");
      extraBodyText = '-\r\n\r\n'+extraBodyText;
      
      var appCtxt = window.top.appCtxt;
      var zmApp = appCtxt.getApp();
      var newWindow = zmApp != null ? (zmApp._inNewWindow ? true : false) : true;
      var params = {action:ZmOperation.NEW_MESSAGE, inNewWindow:null, composeMode:Dwt.TEXT,
      toOverride:'"'+msg._addrs.FROM._array[0].name+'" <'+msg._addrs.FROM._array[0].address+'>\r\n', ccOverride:ccOverride, subjOverride:msg.subject.replace(/\*\*\*.*\*\*\*/,''), extraBodyText:extraBodyText, callback:null}
      composeController.doAction(params); // opens asynchronously the window.
   }
}

/** This method converts a UNIX time stamp to a time that is usable in JavaScript.
 * See {@link http://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript}.
 * @param {string} UNIX_timestamp - a UNIX timestamp
 * @returns {string} - a human formatted time string (1 Aug 2036 22:41:50)
 */
OpenPGPZimlet.prototype.timeConverter = function (UNIX_timestamp) {
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + ("0" + hour).slice(-2) + ':' + ("0" + min).slice(-2) + ':' + ("0" + sec).slice(-2) ;
  return time;
}

/** Function to handle a show/hide button for password type input fields
 */
OpenPGPZimlet.prototype.toggle_password = function (target) {
   var tag = document.getElementById(target);
   
   if (tag.getAttribute('type') == 'password')
   {
      tag.setAttribute('type', 'text');
   }
   else 
   {
      tag.setAttribute('type', 'password');   
   }
}
