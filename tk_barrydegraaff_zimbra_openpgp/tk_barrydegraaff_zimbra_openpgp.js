/*
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
*/

//Constructor
tk_barrydegraaff_zimbra_openpgp = function() {
   tk_barrydegraaff_zimbra_openpgp.privateKeyCache='';
   tk_barrydegraaff_zimbra_openpgp.privatePassCache='';
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

   //Some options are set, but not auto_decrypt, so set it to 'true' by default
   if(!tk_barrydegraaff_zimbra_openpgp.settings['auto_decrypt'])
   {
      tk_barrydegraaff_zimbra_openpgp.settings['auto_decrypt'] = 'true';
   }

   //Some options are set, but not auto_decrypt, so set it to 'true' by default
   if(!tk_barrydegraaff_zimbra_openpgp.settings['direct_send'])
   {
      tk_barrydegraaff_zimbra_openpgp.settings['direct_send'] = 'false';
   }

   //Some options are set, but not store_passphrase_locally, so set it to 'false' by default
   if(!tk_barrydegraaff_zimbra_openpgp.settings['store_passphrase_locally'])
   {
      tk_barrydegraaff_zimbra_openpgp.settings['store_passphrase_locally'] = 'false';
   }

   /* The maximum email size ZmSetting.MAX_MESSAGE_SIZE, before Zimbra displays 'This message is too large to display'
    * This limit only applies to clear-signed messages, as they are read via ZmMailMsg object that is also truncated.
    * We still want to use ZmMailMsg object to avoid breaking ASCII Armored clear signed messages (decode utf-8 printed-quotable)
    * 
    * Encrypted messages are read via the REST API and are not limited in size. Since hardened to be only ASCII, they are never 
    * utf-8 or otherwise encoded, so we can use REST for this.
    */
   if(tk_barrydegraaff_zimbra_openpgp.settings['max_message_size'])
   {
      appCtxt.set(ZmSetting.MAX_MESSAGE_SIZE, tk_barrydegraaff_zimbra_openpgp.settings['max_message_size']);
   }

   this._zimletContext._panelActionMenu.args[0][0].label = tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][3];
   this._zimletContext._panelActionMenu.args[0][1].label = tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][4];
   this._zimletContext._panelActionMenu.args[0][2].label = tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][77];
   this._zimletContext._panelActionMenu.args[0][3].label = tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][87];
   this._zimletContext._panelActionMenu.args[0][4].label = tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][5];
   
   tk_barrydegraaff_zimbra_openpgp.prototype.readAddressBook();
   
   /* Check if an unencrypted private key was stored in html localStorage in Zimlet versions < 1.5.8
    * and if so, encrypt it with AES
    */
   if(localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()])
   {
      var pgpPrivKeyRegEx = new RegExp('[\-]*BEGIN PGP PRIVATE KEY BLOCK[\-]*');
      if (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()].match(pgpPrivKeyRegEx)) 
      {
         if (!tk_barrydegraaff_zimbra_openpgp.settings['aes_password'])
         {
            tk_barrydegraaff_zimbra_openpgp.settings['aes_password'] = tk_barrydegraaff_zimbra_openpgp.prototype.pwgen();
         }   
         this.setUserProperty("zimbra_openpgp_options", JSON.stringify(tk_barrydegraaff_zimbra_openpgp.settings), true);
         tk_barrydegraaff_zimbra_openpgp.prototype.localStorageSave(tk_barrydegraaff_zimbra_openpgp.settings['aes_password'], localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()]);
      }
   }
   
   var zimbra_openpgp_privatepass = this.getUserProperty("zimbra_openpgp_privatepass");
   if ((zimbra_openpgp_privatepass)  && (zimbra_openpgp_privatepass.indexOf('-cryptedpp-') < 1))
   {
      //found a zimbra_openpgp_privatepass on server that was stored in a previous version, encrypt it
      var encryptedPassphrase = Aes.Ctr.encrypt('-----openpgppassphrase-----'+zimbra_openpgp_privatepass, tk_barrydegraaff_zimbra_openpgp.settings['aes_password'], 256);
      if (tk_barrydegraaff_zimbra_openpgp.settings['store_passphrase_locally'] == 'true')
      {
         localStorage['zimbra_openpgp_privatepass'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] = '---cryptedpp---' + encryptedPassphrase;
         this.setUserProperty("zimbra_openpgp_privatepass", '', true);
      }
      else
      {
         localStorage['zimbra_openpgp_privatepass'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] = '';
         this.setUserProperty("zimbra_openpgp_privatepass", '---cryptedpp---' + encryptedPassphrase, true);
      }
   }

	if (appCtxt.get(ZmSetting.MAIL_ENABLED)) {
		AjxPackage.require({name:"MailCore", callback:new AjxCallback(this, this.addAttachmentHandler)});
	}
}


/* Provide a link in the mail view to decrypt attachment sent via regular mime
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.addAttachmentHandler = function(mime)
{
	this._msgController = AjxDispatcher.run("GetMsgController");
	var viewType = appCtxt.getViewTypeFromId(ZmId.VIEW_MSG);
	this._msgController._initializeView(viewType);

   tk_barrydegraaff_zimbra_openpgp.mime = [
   'application/pgp-encrypted',
   'application/pgp-keys'
   ];
   tk_barrydegraaff_zimbra_openpgp.mime.forEach(function(mime) 
   {
      var MISSMIME = 'tk_barrydegraaff_zimbra_openpgp'+mime.replace("/","_");
      ZmMimeTable.MISSMIME=mime;
      ZmMimeTable._table[ZmMimeTable.MISSMIME]={desc:"OpenPGP encrypted file",image:"tk_barrydegraaff_zimbra_openpgp-file-pgp-encrypted",imageLarge:"tk_barrydegraaff_zimbra_openpgp-file-pgp-encrypted"};      
   });

   this._msgController._listView[viewType].addAttachmentLinkHandler('application/pgp-encrypted',"tk_barrydegraaff_zimbra_openpgp",this.addPGPLink);
   this._msgController._listView[viewType].addAttachmentLinkHandler('application/pgp-keys',"tk_barrydegraaff_zimbra_openpgp",this.addPubKeyLink);
};

/* Provide a link in the mail view to decrypt attachment sent via regular mime
 * html DOM
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.addPGPLink = 
function(attachment) {
	var html =
			"<a href='#' class='AttLink' style='text-decoration:underline;' " +
					"onClick=\"tk_barrydegraaff_zimbra_openpgp.prototype.decryptAttachment('" + attachment.label + "','" + attachment.url + "')\">"+
					tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][60] +
					"</a>";
               
	return html;
};

/* Provide a link to import public key attachments
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.addPubKeyLink = 
function(attachment) {
	var html =
			"<a href='#' class='AttLink' style='text-decoration:underline;' " +
					"onClick=\"tk_barrydegraaff_zimbra_openpgp.prototype.importPubKey('" + attachment.label + "','" + attachment.url + "')\">"+
					tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][73] +
					"</a>";
               
	return html;
};

/* Link next to attachment clicked
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.decryptAttachment =
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
      zimletInstance.displayDialog(10, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][60], [xmlHttp.response, name]);
   };
};

/* Link next to attachment clicked (pgp-keys)
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.importPubKey =
function(url) {
   //Now make an ajax request and fetch the attachment
   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", url, true );        
   xmlHttp.send( null );
  
   xmlHttp.onload = function(e) 
   {
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_zimbra_openpgp').handlerObject;
      zimletInstance.displayDialog(9, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][73],xmlHttp.response);
   };
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
   ZmMailMsg.requestHeaders["Content-Transfer-Encoding"] = "Content-Transfer-Encoding";
};

/* This method is called when a message is viewed in Zimbra
 * 
 * See the comment above in init function on maximum email size ZmSetting.MAX_MESSAGE_SIZE on why onMsgView function is a bit complicated.
 * 
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.onMsgView = function (msg, oldMsg, msgView) {
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
               this.displayDialog(9, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][73],pubKeyTxt[0]);  
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
                     tk_barrydegraaff_zimbra_openpgp.prototype.importPubKey(pgpKeysUrl);
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
               var message = tk_barrydegraaff_zimbra_openpgp.prototype.quoted_printable_decode(xmlHttp.responseText);
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
         if (tk_barrydegraaff_zimbra_openpgp.prototype.addressBookReadInProgress == true)
         {
            //Still loading contacts, ignoring your addressbook
            this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][6], ZmStatusView.LEVEL_INFO);   
         }
   
         try {
            var message = openpgp.cleartext.readArmored(bp.node.content);
         }
         catch(err) {
            //Could not read armored message!
            this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][7], ZmStatusView.LEVEL_CRITICAL);
            return;
         }
         var dispMessage = tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(bp.node.content);
         bodynode.innerHTML = '';
         document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id).innerHTML='<pre style="white-space: pre-wrap;word-wrap: break-word;">'+tk_barrydegraaff_zimbra_openpgp.prototype.urlify(dispMessage)+'</pre>';
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
            var subject = 'Zimbra OpenPGP ' + tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][54];
         }
         
         if(subject.length < 2)
         {
            subject = 'Zimbra OpenPGP ' + tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][54];
         }
         if(document.getElementById('tk_barrydegraaff_zimbra_openpgp_actionbar'+appCtxt.getCurrentAppName()+msg.id))
         {
            if(document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id))
            {
               document.getElementById('tk_barrydegraaff_zimbra_openpgp_actionbar'+appCtxt.getCurrentAppName()+msg.id).innerHTML = '<a id="btnReply'+msg.id+'" style="text-decoration: none" onclick="#"><img style="vertical-align:middle" src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/reply-sender.png"> '+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][82]+'</a>&nbsp;&nbsp;<a id="btnReplyAll'+msg.id+'" style="text-decoration: none" onclick="#"><img style="vertical-align:middle" src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/reply-all.png"> '+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][83]+'</a>&nbsp;&nbsp;<a id="btnPrint'+msg.id+'" style="text-decoration: none" onclick="#"><img style="vertical-align:middle" src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/printButton.png"> '+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][54]+'</a>&nbsp;&nbsp;';
               var btnPrint = document.getElementById("btnPrint"+msg.id);               
               btnPrint.onclick = AjxCallback.simpleClosure(this.printdiv, this, 'tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id, tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(subject));

               var btnReply = document.getElementById("btnReply"+msg.id);
               btnReply.onclick = AjxCallback.simpleClosure(this.reply, this, msg, 'tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id, 'reply');
               var btnReplyAll = document.getElementById("btnReplyAll"+msg.id);
               btnReplyAll.onclick = AjxCallback.simpleClosure(this.reply, this, msg, 'tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id, 'replyAll');               
            }
         }
            
         if (tk_barrydegraaff_zimbra_openpgp.prototype.addressBookReadInProgress == true)
         {
            //Still loading contacts, ignoring your addressbook
            this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][6], ZmStatusView.LEVEL_INFO);   
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
            document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+appCtxt.getCurrentAppName()+msg.id).innerHTML=tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(bp.node.content);
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
         this.displayDialog(1, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][8], args);  
      }
      else if (pgpKeys == true)
      {
         tk_barrydegraaff_zimbra_openpgp.prototype.importPubKey(pgpKeysUrl);
         return;
      }
      else {
         return;
      }   
   }
};   

/* Whenever a user tries to send a private key, warns them it is NOT a good idea. */
tk_barrydegraaff_zimbra_openpgp.prototype.emailErrorCheck =
function(mail, boolAndErrorMsgArray) {
   if (mail.textBodyContent.match(/----BEGIN PGP PRIVATE KEY BLOCK----/i))
   {
      var errParams = {
         hasError:true,
         errorMsg: tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][84]+'<br><br><img src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/help/send-public-key.png">',
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

/* Function to escape any HTML prior to putting it in the DOM
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml =
function (unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

/* This method gets called by the Zimlet framework when single-click is performed.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.singleClicked =
function() {  
   //Launch Manage keys
   this.displayDialog(3, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][3], null);
};

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
   case "pubkeys":
      this.displayDialog(3, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][3], null);
      break;
   case "sendTo":
      tk_barrydegraaff_zimbra_openpgp.prototype.sendTo(btoa(this.getUserPropertyInfo("zimbra_openpgp_pubkeys1").value));
      break;
   case "keypair":
      this.displayDialog(5, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][4], null);
      break;
   case "help":
      window.open("/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/help/index.html");
      break;
   case "lookup":
      this.displayDialog(7, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][87], null);
      break;
   }
};

/* doDrop handler for verify and decrypt messages
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.doDrop =
function(zmObject) {
};

/* verify method checks against known public keys and
 * will update the status bar with the result (good/bad signature).
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.verify = function(arguments) {
   var message = arguments[0];
   openpgp.initWorker({ path:'/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js' });
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
   myWindow.arguments = arguments;

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
         sigStatus ='<b style="color:green">'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][14]+'</b>';
         document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar'+myWindow.arguments[1]).innerHTML= '<img style="vertical-align:middle" src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/icon.png"> OpenPGP: '+sigStatus;
      } else {
         //Got a BAD signature
         sigStatus ='<b style="color:red">'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][15]+'</b>';
         document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar'+myWindow.arguments[1]).innerHTML= '<img style="vertical-align:middle" src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/icon.png"> OpenPGP: '+sigStatus;
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
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_zimbra_openpgp').handlerObject;
   switch(id) {
   case 1:
      //Decrypt message
      if((tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead()) && (tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead() !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead();
      } 
      
      tk_barrydegraaff_zimbra_openpgp.prototype.passphraseRead(zimletInstance.getUserPropertyInfo("zimbra_openpgp_privatepass").value);

      html = "<div style='width:650px; height: 140px; overflow-x: hidden; overflow-y: scroll;'><table><tr><td colspan='2'>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][8] + '. ' + tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][18]+"<br><br>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][19] + ":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20] + ":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + tk_barrydegraaff_zimbra_openpgp.privatePassCache + "'>" +
      "</td></tr></table></div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      var arguments = message;
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, zimletInstance.okBtnDecrypt, [arguments]));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, zimletInstance.cancelBtn));
      
      //If a private key is available and a password is stored, auto decrypt the message if option auto_decrypt is set to true
      if((tk_barrydegraaff_zimbra_openpgp.privateKeyCache.length > 10) && 
      (tk_barrydegraaff_zimbra_openpgp.settings['auto_decrypt'] == 'true') &&
      (tk_barrydegraaff_zimbra_openpgp.privatePassCache.length > 0))
      {
         zimletInstance.okBtnDecrypt(message);
      }   
      break;
   case 2:
      //Default dialog
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(message);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, zimletInstance.cancelBtn));
      break;
   case 3:
      //Manage keys
      if((tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead()) && (tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead() !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead();
      } 
      
      tk_barrydegraaff_zimbra_openpgp.prototype.passphraseRead(zimletInstance.getUserPropertyInfo("zimbra_openpgp_privatepass").value);

      // make supported languages list in HTML
      langListName = ['Deutsch','English','Español','Français','Italiano','Nederlands','Português (Brasil)','Tiếng Việt','简体中文','русский'];
      langListValue = ['german','english','spanish','french','italian','dutch','portuguese_brazil','vietnamese','chinese','russian'];
      
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
         var pubkeyTxt = ''
         if (numStr == 1)
         {
            pubkeyTxt = '<b>&bull; '+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][72]+'</b>';
         }
         pubkeyListHtml += "<tr><td>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][26]+" "+numStr+":</td><td><br><textarea maxlength=\"51000\" class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='publicKeyInput"+numStr+"'/>" + (zimletInstance.getUserPropertyInfo(pubkeyNumStr).value ? zimletInstance.getUserPropertyInfo(pubkeyNumStr).value : '') + "</textarea>"+ pubkeyTxt + "<br>" + "<label for='publicKeyInfo"+numStr+"'>"+(zimletInstance.getUserPropertyInfo(pubkeyNumStr).value ? zimletInstance.pubkeyInfo(zimletInstance.getUserPropertyInfo(pubkeyNumStr).value) : '')+"</label>" + "</td></tr>";
      }
      
      html = "<div style='width:650px; height: 500px; overflow-x: hidden; overflow-y: scroll;'><table><tr><td colspan='2'>" +
      "<ul>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][22]+"</ul><br>" +
      "</td></tr>" +      
      "<tr><td style=\"width:100px\">"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][19]+":</td><td style=\"width:500px\">"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][25]+"<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "<input type='checkbox' id='set_new_aes_password' name='set_new_aes_password' value='true'>" + tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][67] +
      "<tr><td>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20]+":</td><td><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][24]+"<input class=\"barrydegraaff_zimbra_openpgp-input\" id='privatePassInput' type='password' value='" + tk_barrydegraaff_zimbra_openpgp.privatePassCache + "'><br><button type=\"button\" onclick=\"tk_barrydegraaff_zimbra_openpgp.prototype.toggle_password('privatePassInput')\">"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][55]+"</button><input type='checkbox' id='store_passphrase_locally' name='store_passphrase_locally' " + (tk_barrydegraaff_zimbra_openpgp.settings['store_passphrase_locally']=='false' ? '' : 'checked') + " value='false'> "+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][71]+"</td></tr>" +
      "<tr><td><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][23]+":</td><td><br>" + langListHtml + "</td></tr>" +
      "<tr><td><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][27]+":</td><td><br><input type='checkbox' id='enable_contacts_scanning' name='enable_contacts_scanning' " + (tk_barrydegraaff_zimbra_openpgp.settings['enable_contacts_scanning']=='false' ? '' : 'checked') + " value='true'>" + "</td></tr>" +
      "<tr><td><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][66]+":</td><td><br><input type='checkbox' id='auto_decrypt' name='auto_decrypt' " + (tk_barrydegraaff_zimbra_openpgp.settings['auto_decrypt']=='false' ? '' : 'checked') + " value='true'>" + "</td></tr>" +
      "<tr><td><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][86]+":</td><td><br><input type='checkbox' id='direct_send' name='direct_send' " + (tk_barrydegraaff_zimbra_openpgp.settings['direct_send']=='false' ? '' : 'checked') + " value='true'>" + "</td></tr>" +
      pubkeyListHtml + 
      "<tr><td colspan=\"2\"><br><b>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][69]+"</b></td></tr>" +
      "<tr><td><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][68]+":</td><td><br><input onkeypress='return event.charCode >= 48 && event.charCode <= 57' type='number' id='max_message_size' name='max_message_size' value='" + (tk_barrydegraaff_zimbra_openpgp.settings['max_message_size'] > 0 ? tk_barrydegraaff_zimbra_openpgp.settings['max_message_size'] : '1000000') + "'</td></tr>" +
      "<tr><td>User settings:</td><td><textarea readonly class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"65\">" + zimletInstance.getUserProperty("zimbra_openpgp_options") + "</textarea></td></tr><tr><td colspan='2'><br><br><b>Zimbra OpenPGP Zimlet "+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][10]+": " + tk_barrydegraaff_zimbra_openpgp.version + "</b></td></tr>" +
      "</table></div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, zimletInstance.okBtnPubKeySave));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, zimletInstance.cancelBtn));
      break;
   case 4:
      //Sign message
      if((tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead()) && (tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead() !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead();
      }
      
      tk_barrydegraaff_zimbra_openpgp.prototype.passphraseRead(zimletInstance.getUserPropertyInfo("zimbra_openpgp_privatepass").value);

      html = "<div style='width:650px; height: 120px; overflow-x: hidden; overflow-y: hidden;'><table style='width:100%'><tr><td colspan='2'>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][36]+" <a style='color:blue; text-decoration: underline;' onclick=\"tk_barrydegraaff_zimbra_openpgp.prototype.menuItemSelected('help')\">"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][11]+"</a>.<br><br>" +
      "</td></tr><tr><td style=\"width:100px;\">" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][19]+":" +
      "</td><td style=\"width:500px\">" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + tk_barrydegraaff_zimbra_openpgp.privatePassCache + "'>" +
      "<textarea style=\"display:none\" class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'>"+ (message ? message : '' ) +"</textarea>" +
      "</td></tr></table></div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, zimletInstance.okBtnSign));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, zimletInstance.cancelBtn));
      break;
   case 5:
      //Generate keypair
      if((tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead()) && (tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead() !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead();
      } 
      
      tk_barrydegraaff_zimbra_openpgp.prototype.passphraseRead(zimletInstance.getUserPropertyInfo("zimbra_openpgp_privatepass").value);
            
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
         aliases = tk_barrydegraaff_zimbra_openpgp.prototype.uniq(aliases);
         aliases.forEach(function(alias) {
            aliasesString = aliasesString + ',' + alias;
         });      
      }
      
      html = "<div style='width:650px; height: 240px; overflow-x: hidden; overflow-y: hidden;'><table style='width:650px;'><tr><td colspan='2'>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][29]+"<br><br>" +
      "</td></tr><tr><td style=\"width:100px;\">" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][79]+":" +
      "</td><td style=\"width:500px\">" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='uidName' value='" + displayname +"'>" +
      "</td></tr><tr><tr><td style=\"width:100px;\">" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][80]+":" +
      "</td><td style=\"width:500px\">" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='uidEmail' value='" + appCtxt.getActiveAccount().name+aliasesString+"'>" +
      "</td></tr><tr><td></td><td>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][81]+
      "</td></tr><tr><td>"+
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + (tk_barrydegraaff_zimbra_openpgp.privatePassCache ? tk_barrydegraaff_zimbra_openpgp.privatePassCache : tk_barrydegraaff_zimbra_openpgp.prototype.pwgen()) + "'>" +
      "</td></tr><tr><td></td><td><button type=\"button\" onclick='document.getElementById(\"passphraseInput\").value=tk_barrydegraaff_zimbra_openpgp.prototype.pwgen()'>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][34]+"</button>" +
      "<button type=\"button\" onclick=\"tk_barrydegraaff_zimbra_openpgp.prototype.toggle_password('passphraseInput')\">"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][55]+"</button></td></tr><tr><td style=\"width:100px;\">" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][31]+":" +
      "</td><td style=\"width:500px\">" +
      "<select class=\"barrydegraaff_zimbra_openpgp-input\" id=\"keyLength\" name=\"keyLength\"><option selected=\"selected\" value=\"1024\">1024</option><option value=\"2048\">2048</option><option value=\"4096\">4096</option></select>" +
      "</td></tr><tr><td colspan='2'>" +
      "<br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][32]+"<br><br>" +
      "</td></tr><tr><td colspan='2'>" +
      "<input type='checkbox' checked='checked' name='keyStore' id='keyStore' value='yes'>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][33]+"<br>" +
      "</td></tr></table></div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true  } );
      zimletInstance._dialog.setContent(html);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, zimletInstance.okBtnKeyPair));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, zimletInstance.cancelBtn));
      break;
   case 6:
      //Encrypt message
      if((tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead()) && (tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead() !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead();
      } 
      
      tk_barrydegraaff_zimbra_openpgp.prototype.passphraseRead(zimletInstance.getUserPropertyInfo("zimbra_openpgp_privatepass").value);

      html = "<div style='width:650px; height: 350; overflow-x: hidden; overflow-y: hidden;'><table style='width:100%'><tr><td colspan='2'>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][36]+" <a style='color:blue; text-decoration: underline;' onclick=\"tk_barrydegraaff_zimbra_openpgp.prototype.menuItemSelected('help')\">"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][11]+"</a>.<br><br>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][35]+":" +
      "</td><td>" + zimletInstance.pubKeySelect() +
      "<textarea style=\"display:none\" class=\"barrydegraaff_zimbra_openpgp-msg\" id='message'>"+ (message ? message : '' ) +"</textarea><br><br>" +
      "</td></tr>" +
      "<tr><td colspan='2'>OpenPGP " + tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][40] + "<br></td></tr>" +
      "<tr><td></td><td><div id='fileInputPgpAttach'></div></td></tr>" +
      "<tr><td colspan='2'><br>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][37]+"</td></tr><tr><td>" +
      "<tr><td>" + tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][19]+":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + tk_barrydegraaff_zimbra_openpgp.privatePassCache + "'>" +
      "</td></tr></table></div>";      
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      tk_barrydegraaff_zimbra_openpgp.prototype.addFileInputPgpAttach();
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, zimletInstance.okBtnEncrypt));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, zimletInstance.cancelBtn));
      break;
   case 7:
   //lookup keyserver
      html = "<div style='width:650px; height: 500px; overflow-x: hidden; overflow-y: scroll;'><table><tr><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='barrydegraaff_zimbra_openpgpQuery' type='text' value=''>" +
      "</td><td>&nbsp;<button id='btnSearch' onclick=\"#\">"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][88]+"</button></td></tr><tr><td>" +
      "<div id='barrydegraaff_zimbra_openpgpResult'></div>" +
      "</td><td></td></tr></table></div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      var btnSearch = document.getElementById("btnSearch");
      btnSearch.onclick = AjxCallback.simpleClosure(zimletInstance.lookup, this);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, zimletInstance.okBtnLookup));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, zimletInstance.cancelBtn));
      break;   
   case 9:
      //Import public key
      //Get selected mail message
      try {
         var publicKeys = openpgp.key.readArmored(message);
         userid = publicKeys.keys[0].users[0].userId.userid;
         userid = tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(userid);
         
         publicKeyPacket = publicKeys.keys[0].primaryKey;
         var keyLength = "";
         if (publicKeyPacket != null) {
            if (publicKeyPacket.mpi.length > 0) {
               keyLength = (publicKeyPacket.mpi[0].byteLength() * 8);
            }
         }
      } catch(err){
         //Could not read armored message!
         tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][7], ZmStatusView.LEVEL_WARNING);
         return;
      }   
      
      result = "<br><table style=\"padding: 5px;\"><tr><td>User ID[0]:</td><td>" + userid + "</td></tr><tr><td>Fingerprint:</td><td><b>" + publicKeyPacket.fingerprint + "</b></td></tr><tr><td> Primary key length:&nbsp;</td><td>" + keyLength + "</td></tr><tr><td>Created:<td>" + publicKeyPacket.created + "</td></tr></table>";

      html = "<div style='width:650px; height: 100px; overflow-x: hidden; overflow-y: hidden;'>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][74]+ "<br>" + result + "</div>";
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true  } );
      zimletInstance._dialog.setContent(html);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, zimletInstance.okBtnImportPubKey, publicKeys));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, zimletInstance.cancelBtn));
      break;
   case 10:
      //Decrypt file from attachment link
      if((tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead()) && (tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead() !== tk_barrydegraaff_zimbra_openpgp.privateKeyCache))
      {
         tk_barrydegraaff_zimbra_openpgp.privateKeyCache = tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead();
      }      

      tk_barrydegraaff_zimbra_openpgp.prototype.passphraseRead(zimletInstance.getUserPropertyInfo("zimbra_openpgp_privatepass").value);

      html = "<div style='width:650px; height: 350; overflow-x: hidden; overflow-y: hidden;'><table style='width:100%'><tr><td colspan='2'>"+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][64]+":<br><br></td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][19]+":" +
      "</td><td>" +
      "<textarea class=\"barrydegraaff_zimbra_openpgp-input\" rows=\"3\" cols=\"20\" id='privateKeyInput'/>" + tk_barrydegraaff_zimbra_openpgp.privateKeyCache + "</textarea>" +
      "</td></tr><tr><td>" +
      tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][20]+":" +
      "</td><td>" +
      "<input class=\"barrydegraaff_zimbra_openpgp-input\" id='passphraseInput' type='password' value='" + tk_barrydegraaff_zimbra_openpgp.privatePassCache + "'>" +
      "</td></tr></table></div>";      
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.CANCEL_BUTTON,DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(html);
      
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, zimletInstance.okBtnDecryptFile, [message]));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, zimletInstance.cancelBtn));

      //If a private key is available and a password is stored, auto decrypt the message if option auto_decrypt is set to true
      if((tk_barrydegraaff_zimbra_openpgp.privateKeyCache.length > 10) && 
      (tk_barrydegraaff_zimbra_openpgp.settings['auto_decrypt'] == 'true') &&
      (tk_barrydegraaff_zimbra_openpgp.privatePassCache.length > 0))
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

// Add another attachment file picker to the UI
tk_barrydegraaff_zimbra_openpgp.prototype.addFileInputPgpAttach = 
function () {
   var parentDiv = document.getElementById("fileInputPgpAttach");
   var newfileInputPgpAttach = document.createElement('div');
   newfileInputPgpAttach.insertAdjacentHTML('afterbegin',"<input type='file' multiple class='fileInputPgpAttach'><button onclick='tk_barrydegraaff_zimbra_openpgp.prototype.clearFileInputPgpAttach(this)'>-</button><button onclick='tk_barrydegraaff_zimbra_openpgp.prototype.addFileInputPgpAttach()'>+</button>");
   parentDiv.parentNode.insertBefore(newfileInputPgpAttach, parentDiv);
}

// Remove attachment file picker from the UI, in case there is only one file picker, clear that one.
tk_barrydegraaff_zimbra_openpgp.prototype.clearFileInputPgpAttach = 
function (obj) {
   var fileSelectors = document.getElementsByClassName("fileInputPgpAttach");
   if(fileSelectors.length > 1)
   {
      obj.parentNode.innerHTML = '';
   }
   else
   {
      obj.parentNode.innerHTML = '';
      tk_barrydegraaff_zimbra_openpgp.prototype.addFileInputPgpAttach();
   }   
}

// Remove Duplicates from JavaScript Array, allow string and objects to be deduped
tk_barrydegraaff_zimbra_openpgp.prototype.uniq = 
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

/* This method is called when the dialog "OK" button is clicked after private key has been entered.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnDecrypt =
function(arguments) {
   openpgp.initWorker({ path:'/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js' });
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("privateKeyInput").style.backgroundImage = "url('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/loading.gif')";

   var privateKeyInput = document.getElementById("privateKeyInput").value;
   tk_barrydegraaff_zimbra_openpgp.privateKeyCache = privateKeyInput;
   var passphraseInput = document.getElementById("passphraseInput").value;
   tk_barrydegraaff_zimbra_openpgp.privatePassCache = passphraseInput;

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
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][38], ZmStatusView.LEVEL_WARNING);
      return;
   }

   if (success) {
      try {
         var message = openpgp.message.readArmored(arguments['message']);
      }
      catch(err) {
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
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
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
         this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         //Could not parse your trusted public keys!
         tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][13], ZmStatusView.LEVEL_WARNING);
         return;
      }
      // There should be a cleaner way to do this than stashing 
      // the parent in myWindow but I've not worked it out yet!
      var myWindow = this;
      myWindow.arguments = arguments;
      
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
                  sigStatus ='<b style="color:green">'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][14]+'</b>';
               }
               else
               {
                  sigStatus ='<b style="color:red">'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][15]+'</b>';
               }
            }
         }
         catch (err) 
         {
            sigStatus =tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][41]+' '+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][39];
         }    
         document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar'+myWindow.arguments['domId']).innerHTML='<img style="vertical-align:middle" src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/icon.png"> OpenPGP: <b>'+ sigStatus + '</b>';

         // Got a decrypted message that does not need further mime parsing
         if(myWindow.arguments['hasMIME']== false)
         {
            document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).innerHTML=tk_barrydegraaff_zimbra_openpgp.prototype.urlify(tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(plaintext.data));
            document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).setAttribute('data-decrypted',plaintext.data);
         }
         // Go a message that needs MIME parsing (PGP/MIME)
         else
         {
            document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).innerHTML='';
            try {
               document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_att'+myWindow.arguments['domId']).innerHTML='';
            } catch (err) {}

            if(myWindow.getUserPropertyInfo("zimbra_openpgp_pubkeys30").value == 'debug')
            {
               document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).innerHTML='<textarea rows="20" cols="200" style="witdh:500px; height=500px">'+plaintext.data+'</textarea>';
            }   
                       
            var boundary = plaintext.data.match(/boundary="([^"\\]*(?:\\.[^"\\]*)*)"/i);
            boundary = '--'+boundary[1];

            var multipart = plaintext.data.split(boundary);
            
            //Remove the headers from the message
            multipart.shift();
            //Remove junk on the end of the message
            multipart.pop();

            //Check for nested multipart/mixed messages
            var partArr=multipart[0].split('\n\n', 2);
            if (partArr[0].indexOf('Content-Type: multipart/mixed')> 0)
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
               if (partArr[0].indexOf('Content-Disposition: attachment')> 0)
               {                                        
                  var filename = partArr[0].match(/filename="([^"\\]*(?:\\.[^"\\]*)*)"/i);
                  
                  if (partArr[0].indexOf('Content-Transfer-Encoding: base64')> -1)
                  {
                     partArr[1] = partArr[1].split('=\n', 1);
                     partArr[1] = partArr[1] + '=';
                     partArr[1] = partArr[1].replace(/(\r\n|\n|\r)/gm,"");
                     document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_att'+myWindow.arguments['domId']).innerHTML = document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_att'+myWindow.arguments['domId']).innerHTML + '<img style="vertical-align:middle" src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/file-pgp-encrypted.png"> <a class="AttLink" onclick="tk_barrydegraaff_zimbra_openpgp.prototype.downloadBlob(\''+tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(filename[1])+'\',\'octet/stream\',\''+partArr[1]+'\')">'+tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(filename[1])+'</a><br>';
                  }
                  else
                  {
                     document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_att'+myWindow.arguments['domId']).innerHTML = document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_att'+myWindow.arguments['domId']).innerHTML + '<img style="vertical-align:middle" src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/file-pgp-encrypted.png">?? <a class="AttLink" onclick="tk_barrydegraaff_zimbra_openpgp.prototype.downloadBlob(\''+tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(filename[1])+'\',\'octet/stream\',\''+btoa(partArr[1])+'\')">'+tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(filename[1])+'</a><br>';                     
                  }        
               }                     
               else if(partArr[0].indexOf('text/plain')> 0)
               {
                  if (partArr[0].indexOf('Content-Transfer-Encoding: base64')> -1)
                  {
                     document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).innerHTML = document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).innerHTML + tk_barrydegraaff_zimbra_openpgp.prototype.urlify(tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(atob(partArr[1])));
                     document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).setAttribute('data-decrypted',atob(partArr[1]));
                  }
                  if (partArr[0].indexOf('Content-Transfer-Encoding: quoted-printable')> -1)
                  {
                     document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).innerHTML = document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).innerHTML + tk_barrydegraaff_zimbra_openpgp.prototype.urlify(tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(tk_barrydegraaff_zimbra_openpgp.prototype.quoted_printable_decode(part)));
                     document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).setAttribute('data-decrypted',tk_barrydegraaff_zimbra_openpgp.prototype.quoted_printable_decode(part));
                  }                  
                  else
                  {
                     document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).innerHTML = document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).innerHTML + tk_barrydegraaff_zimbra_openpgp.prototype.urlify(tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(part));
                     document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).setAttribute('data-decrypted',part);
                  }   
               }
               else if(partArr[0].indexOf('text/html')> 0)
               {
                  //rendering html messages is currently not supported, this is a not so nice attempt to display html as text
                  part = part.substring(part.indexOf('\n\n'));
                  if (partArr[0].indexOf('Content-Transfer-Encoding: quoted-printable')> -1)
                  {
                     part = tk_barrydegraaff_zimbra_openpgp.prototype.quoted_printable_decode(part);
                  }                     
                  document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).innerHTML = document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).innerHTML + tk_barrydegraaff_zimbra_openpgp.prototype.urlify(tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(tk_barrydegraaff_zimbra_openpgp.prototype.htmlToText(part)));
                  document.getElementById('tk_barrydegraaff_zimbra_openpgp_infobar_body'+myWindow.arguments['domId']).setAttribute('data-decrypted',tk_barrydegraaff_zimbra_openpgp.prototype.htmlToText(part));
               }
            });

            //Got NO attachments, remove the attLinks div from UI
            try {
               if(document.getElementById("tk_barrydegraaff_zimbra_openpgp_infobar_att"+myWindow.arguments['domId']).innerHTML == '')
               {
                  var e = document.getElementById("tk_barrydegraaff_zimbra_openpgp_infobar_att"+myWindow.arguments['domId']);
                  e.parentNode.parentNode.parentNode.removeChild(e.parentNode.parentNode);
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
         tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][43], ZmStatusView.LEVEL_WARNING);
      });
   }
   else {
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);      
      //Wrong passphrase!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][44], ZmStatusView.LEVEL_WARNING);
   }
};

/* This method is called when the dialog "OK" button is clicked when decrypting file.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnDecryptFile =
function(arguments) {
   openpgp.initWorker({ path:'/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js' });
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("privateKeyInput").style.backgroundImage = "url('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/loading.gif')";
   
   var privateKeyInput = document.getElementById("privateKeyInput").value;
   tk_barrydegraaff_zimbra_openpgp.privateKeyCache = privateKeyInput;
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
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][38], ZmStatusView.LEVEL_WARNING);
      return;
   }

   if (success) {
      try {
         var message = openpgp.message.read(new Uint8Array(arguments[0]));
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
      options = {
          message: message,           // parse encrypted bytes
          publicKeys: pubKey,         // for verification (optional)
          privateKey: privKey,        // for decryption
          format: 'binary'
      };
      
      myWindow.arguments = arguments;
      
      openpgp.decrypt(options).then(function (plaintext) {
         try 
         {
            if(plaintext.data+plaintext.signatures[0].valid)
            {
               if(plaintext.signatures[0].valid==true)
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
         
         //Remove .pgp from decrypted file
         if (myWindow.arguments[1].substring(myWindow.arguments[1].length -4) == '.pgp')
         {
            myWindow.arguments[1] = myWindow.arguments[1].substring(0, myWindow.arguments[1].length -4);
         }
         
         tk_barrydegraaff_zimbra_openpgp.prototype.downloadBlob(myWindow.arguments[1],'zimbra/pgp',plaintext.data);

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
function(aes_password, privatekey) {
   //Do not allow to store invalid private keys
   var pgpPrivKeyRegEx = new RegExp('[\-]*BEGIN PGP PRIVATE KEY BLOCK[\-]*');
   if (privatekey.match(pgpPrivKeyRegEx)) 
   {      
      localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] = Aes.Ctr.encrypt(privatekey, tk_barrydegraaff_zimbra_openpgp.settings['aes_password'], 256);
      tk_barrydegraaff_zimbra_openpgp.privateKeyCache=privatekey;
   }
   else
   {
      localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] = '';
      tk_barrydegraaff_zimbra_openpgp.privateKeyCache='';
   }   
}

/* This method decrypts Private Key from localStorage
 * It also encrypts localStorage that was created in previous versions of the Zimlet
 */
tk_barrydegraaff_zimbra_openpgp.prototype.localStorageRead = 
function() {
   if(localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()])
   {
      var pgpPrivKeyRegEx = new RegExp('[\-]*BEGIN PGP PRIVATE KEY BLOCK[\-]*');
      if (localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()].match(pgpPrivKeyRegEx)) 
      {      
         return localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()];
      }
      else
      {
         //call decrypt function 
         var privkey = Aes.Ctr.decrypt(localStorage['zimbra_openpgp_privatekey'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()], tk_barrydegraaff_zimbra_openpgp.settings['aes_password'], 256);
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


tk_barrydegraaff_zimbra_openpgp.prototype.passphraseRead = 
function(zimbra_openpgp_privatepassFromUserProperty) {
   var decryptedPassphrase = '';
   if (tk_barrydegraaff_zimbra_openpgp.settings['store_passphrase_locally'] == 'true')
   {
      if(localStorage['zimbra_openpgp_privatepass'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()])
      {
         decryptedPassphrase = Aes.Ctr.decrypt(localStorage['zimbra_openpgp_privatepass'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()].substring(15), tk_barrydegraaff_zimbra_openpgp.settings['aes_password'], 256);
      }   
   }
   else
   {
      if(zimbra_openpgp_privatepassFromUserProperty)
      {
         decryptedPassphrase = Aes.Ctr.decrypt(zimbra_openpgp_privatepassFromUserProperty.substring(15), tk_barrydegraaff_zimbra_openpgp.settings['aes_password'], 256);
      }   
   }
   
   if (!decryptedPassphrase)
   {
      tk_barrydegraaff_zimbra_openpgp.privatePassCache = '';
   }
   else if (decryptedPassphrase.indexOf('-openpgppassphrase-') > 1)
   {
      tk_barrydegraaff_zimbra_openpgp.privatePassCache = decryptedPassphrase.substring(27);
   }
   else
   {
      tk_barrydegraaff_zimbra_openpgp.privatePassCache = '';
   }
}   

/* This method is called when the dialog "OK" button is clicked after public keys have been maintained
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnPubKeySave =
function() {   
   //Per user configuration options are jsonified into a single Zimbra userProperty
   tk_barrydegraaff_zimbra_openpgp.settings['enable_contacts_scanning'] = (document.getElementById("enable_contacts_scanning").checked ? 'true' : 'false');
   tk_barrydegraaff_zimbra_openpgp.settings['auto_decrypt'] = (document.getElementById("auto_decrypt").checked ? 'true' : 'false');
   tk_barrydegraaff_zimbra_openpgp.settings['direct_send'] = (document.getElementById("direct_send").checked ? 'true' : 'false');
   tk_barrydegraaff_zimbra_openpgp.settings['store_passphrase_locally'] = (document.getElementById("store_passphrase_locally").checked ? 'true' : 'false');
   tk_barrydegraaff_zimbra_openpgp.settings['language'] = (document.getElementById("zimbra_openpgp_language").value);
   tk_barrydegraaff_zimbra_openpgp.settings['max_message_size'] = (document.getElementById("max_message_size").value);
   
   if((!tk_barrydegraaff_zimbra_openpgp.settings['max_message_size']) ||
   (tk_barrydegraaff_zimbra_openpgp.settings['max_message_size'] < 100000) ||
   (tk_barrydegraaff_zimbra_openpgp.settings['max_message_size'] > 100000000))
   {
      tk_barrydegraaff_zimbra_openpgp.settings['max_message_size'] = 1000000;
   }

   appCtxt.set(ZmSetting.MAX_MESSAGE_SIZE, tk_barrydegraaff_zimbra_openpgp.settings['max_message_size']);   
   
   if ((!tk_barrydegraaff_zimbra_openpgp.settings['aes_password']) ||
   ((document.getElementById("set_new_aes_password").checked ? 'true' : 'false') == 'true')) 
   {   
      tk_barrydegraaff_zimbra_openpgp.settings['aes_password'] = tk_barrydegraaff_zimbra_openpgp.prototype.pwgen();
   }   
   tk_barrydegraaff_zimbra_openpgp.prototype.localStorageSave(tk_barrydegraaff_zimbra_openpgp.settings['aes_password'], document.getElementById("privateKeyInput").value);
   var encryptedPassphrase = Aes.Ctr.encrypt('-----openpgppassphrase-----'+document.getElementById("privatePassInput").value, tk_barrydegraaff_zimbra_openpgp.settings['aes_password'], 256);
   if (tk_barrydegraaff_zimbra_openpgp.settings['store_passphrase_locally'] == 'true') 
   {      
      localStorage['zimbra_openpgp_privatepass'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] = '---cryptedpp---' + encryptedPassphrase;
      this.setUserProperty("zimbra_openpgp_privatepass", '', false);
   }
   else
   {
      localStorage['zimbra_openpgp_privatepass'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] = '';
      this.setUserProperty("zimbra_openpgp_privatepass", '---cryptedpp---' + encryptedPassphrase, false);
   }

   //Store values to LDAP
   this.setUserProperty("zimbra_openpgp_options", JSON.stringify(tk_barrydegraaff_zimbra_openpgp.settings), false);
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

/* This method is called for importing a public key received via email
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnImportPubKey = 
function(publicKey) {
   openpgp.initWorker({ path:'/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js' });
   
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
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][78], ZmStatusView.LEVEL_INFO);       
   }
   else if((publicKey.keys[0]) && (openslots[0]))
   {
      this.setUserProperty('zimbra_openpgp_pubkeys'+openslots[0], publicKey.keys[0].armor(), true);
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][75] + " " + tk_barrydegraaff_zimbra_openpgp.lang['english'][26] + " " + openslots[0], ZmStatusView.LEVEL_INFO); 
   }
   else
   {
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][76], ZmStatusView.LEVEL_WARNING); 
   } 

   try{
      this._dialog.setContent('');
      this._dialog.popdown();
   }
      catch (err) {
   }
          
};

/* This method is called for signing messages
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnSign =
function() {
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("privateKeyInput").style.backgroundImage = "url('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/loading.gif')";
   openpgp.initWorker({ path:'/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js' });
   var privateKeyInput = document.getElementById("privateKeyInput").value;
   tk_barrydegraaff_zimbra_openpgp.privateKeyCache = privateKeyInput;
   var passphrase = document.getElementById("passphraseInput").value;
   tk_barrydegraaff_zimbra_openpgp.privatePassCache = passphrase;
   var message = document.getElementById("message").value;
   //Work-around bug: https://github.com/openpgpjs/openpgpjs/issues/311
   message = message.trim();
   
   //Remove Unicode Character 'ZERO WIDTH SPACE' (U+200B) from clear signed messages. To avoid breaking PGP Armor
   message = message.replace(/\u200B/g,'');
       
   /*Clear signing messages that have ----- in the body text, break PGP Armor,
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
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][38], ZmStatusView.LEVEL_WARNING);
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
      
         if (tk_barrydegraaff_zimbra_openpgp.settings['direct_send'] == 'true')
         {
            composeView._controller.sendMsg();
         }   

         try {
            myWindow._dialog.popdown();
         } catch (err) { }   
      },
      function(err) {
         myWindow._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
         myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
         document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
         //Signing failed!
         tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][45], ZmStatusView.LEVEL_WARNING);
      });
   }
   else {
      this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, true);
      this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      document.getElementById("privateKeyInput").style.backgroundImage = "url('')";
      //Wrong passphrase!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][44], ZmStatusView.LEVEL_WARNING);
   }
};

tk_barrydegraaff_zimbra_openpgp.prototype.sendTo =
function(message) {
   openpgp.initWorker({ path:'/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js' });
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
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][13], ZmStatusView.LEVEL_WARNING); 
   }   
   
};


/* This method is called when the dialog "OK" button is clicked for key pair generation.
 */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnKeyPair =
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
      this.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][46], ZmStatusView.LEVEL_WARNING);
      return;
   }

   openpgp.initWorker({ path:'/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js' });

   this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.cancelBtn));
   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);

   //Now generating your key pair
   this._dialog.setTitle(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][47]);
   this._dialog.setContent('<div style="width:650px; height: 240px; overflow-x: hidden; overflow-y: hidden;">'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][48]+'<br><br><br><br><img src="/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/loading.gif" style="width:48px; height:48px; display: block; margin-left: auto; margin-right: auto" alt="loading"></div>');

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
            if (!tk_barrydegraaff_zimbra_openpgp.settings['aes_password'])
            {
               tk_barrydegraaff_zimbra_openpgp.settings['aes_password'] = tk_barrydegraaff_zimbra_openpgp.prototype.pwgen();            
            }   
            myWindow.setUserProperty("zimbra_openpgp_options", JSON.stringify(tk_barrydegraaff_zimbra_openpgp.settings), false);
            tk_barrydegraaff_zimbra_openpgp.prototype.localStorageSave(tk_barrydegraaff_zimbra_openpgp.settings['aes_password'], key.privateKeyArmored);
            tk_barrydegraaff_zimbra_openpgp.privateKeyCache=key.privateKeyArmored;
            var encryptedPassphrase = Aes.Ctr.encrypt('-----openpgppassphrase-----'+passphrase, tk_barrydegraaff_zimbra_openpgp.settings['aes_password'], 256);
            if (tk_barrydegraaff_zimbra_openpgp.settings['store_passphrase_locally'] == 'true') 
            {      
               localStorage['zimbra_openpgp_privatepass'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] = '---cryptedpp---' + encryptedPassphrase;
               myWindow.setUserProperty("zimbra_openpgp_privatepass", '', false);
            }
            else
            {
               localStorage['zimbra_openpgp_privatepass'+tk_barrydegraaff_zimbra_openpgp.prototype.getUsername()] = '';
               myWindow.setUserProperty("zimbra_openpgp_privatepass", '---cryptedpp---' + encryptedPassphrase, false);
            }
            tk_barrydegraaff_zimbra_openpgp.privatePassCache = passphrase;
            myWindow.setUserProperty("zimbra_openpgp_pubkeys1", key.publicKeyArmored, true);
         }
         //Your new key pair
         myWindow._dialog.setTitle(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][50]);
         myWindow._dialog.setContent('<div style="width:650px; height: 240px; overflow-x: hidden; overflow-y: auto;"><table style="width:650px;">'+tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][49]+':<br><br><textarea class="barrydegraaff_zimbra_openpgp-msg" style="height:200px;">Passphrase ' + passphrase + ' for ' + uidName + ' <' + uidEmail + '>' + '\r\n\r\n'+key.privateKeyArmored+'\r\n\r\n'+key.publicKeyArmored+'\r\n\r\nlength: '+keyLength+' ' + '\r\nfingerprint: '+key.key.primaryKey.fingerprint+' \r\ncreated: '+key.key.primaryKey.created+'</textarea></div>');
         myWindow._dialog.setButtonVisible(DwtDialog.OK_BUTTON, true);
      },function(err) {
         // failure generating key
      });       
   } catch (err) {
      tk_barrydegraaff_zimbra_openpgp.prototype.status(err, ZmStatusView.LEVEL_WARNING);
      try {
         myWindow._dialog.popdown();
      } catch (err) { }  
   }   
};

/* This method gets public key details
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.pubkeyInfo =
function(pubkey) {
   openpgp.initWorker({ path:'/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js' });
   try {
      var publicKeys = openpgp.key.readArmored(pubkey);
      
      userid = publicKeys.keys[0].users[0].userId.userid;
      userid = tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(userid);
      
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
   openpgp.initWorker({ path:'/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js' });
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
      
      var result = '';
      var keycount = 0;
      var userIdCount = 0;
      combinedPublicKeys.forEach(function(entry) {
         if(entry[0]) {
            for (i = 0; i < entry[0].users.length; i++) {
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
         keycount++;
      });
      result = '<select class="barrydegraaff_zimbra_openpgp-input" id="pubKeySelect" multiple onclick="tk_barrydegraaff_zimbra_openpgp.prototype.forceSelectSelf('+userIdCount+')">' + result + '</select>';
   }
   catch(err) {
      //Could not parse your trusted public keys!
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][13], ZmStatusView.LEVEL_WARNING);
      return;
   }
   return result;
}

/* When a user encrypts a message, the zimlets selects the first public key by default (encrypt to self).
 * If you do not want to encrypt to yourself, you must click your name, and then the recipient
 */
tk_barrydegraaff_zimbra_openpgp.prototype.forceSelectSelf =
function(userIdCount) {
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

/* This method is called when OK is pressed in encrypt dialog
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnEncrypt =
function() {

   if (document.getElementById("message").value.match(/----BEGIN PGP PRIVATE KEY BLOCK----/i))
   {
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][85], ZmStatusView.LEVEL_WARNING);
      return;         
   }


   this._dialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   this._dialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   document.getElementById("privateKeyInput").style.backgroundImage = "url('/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/loading.gif')";
 
   openpgp.initWorker({ path:'/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/openpgp.worker.js' });
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
      tk_barrydegraaff_zimbra_openpgp.privatePassCache = passphrase;

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
            attBubble[index].style.backgroundImage = 'url(\'/service/zimlet/_dev/tk_barrydegraaff_zimbra_openpgp/progressround.gif\')';
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
                     //tk_barrydegraaff_zimbra_openpgp.prototype.downloadBlob(file.name + '.pgp','zimbra/pgp',message.message.packets.write());
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
                                 
                                 if (tk_barrydegraaff_zimbra_openpgp.settings['direct_send'] == 'true')                                 
                                 {
                                    controller.sendMsg(attachment_list);
                                 }
                                 else
                                 {
                                    controller.saveDraft(ZmComposeController.DRAFT_TYPE_MANUAL, attachment_list);
                                 }   

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
                     tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][52], ZmStatusView.LEVEL_WARNING);
                  });
               }
               reader.readAsArrayBuffer(file);
            })(fileInputs[inputIndex].files[multiselectIndex]);               
         }                      
      }

      if (numberOfAttachments == 0)
      {
         if (tk_barrydegraaff_zimbra_openpgp.settings['direct_send'] == 'true')
         {
            var composeView = appCtxt.getCurrentView();
            composeView._controller.sendMsg();
         }   
      
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
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][52], ZmStatusView.LEVEL_WARNING);
  });      
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

   if(composeMode != 'text/plain')
   {
      //Please format as plain text and try again.
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][70], ZmStatusView.LEVEL_INFO); 
      return;
   }
   
   if(message.length < 1)
   {
      //Please compose message first
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][56], ZmStatusView.LEVEL_INFO);
      return;
   }
  
   this.displayDialog(6, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][2], message);
};

/* Compose window integration
 * Call the sign dialog after Sign button pressed in Compose window
 * */
tk_barrydegraaff_zimbra_openpgp.prototype.composeSignHandler =
function(controller) {
   var composeMode = appCtxt.getCurrentView().getHtmlEditor().getMode();
   var message = controller._getBodyContent();
   
   if(composeMode != 'text/plain')
   {
      //Please format as plain text and try again.
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][70], ZmStatusView.LEVEL_INFO); 
      return;
   }
   
   if(message.length < 1)
   {
      //Please compose message first
      tk_barrydegraaff_zimbra_openpgp.prototype.status(tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][56], ZmStatusView.LEVEL_INFO);
      return;
   }
   
   this.displayDialog(4, tk_barrydegraaff_zimbra_openpgp.lang[tk_barrydegraaff_zimbra_openpgp.settings['language']][1], message);
};

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

tk_barrydegraaff_zimbra_openpgp.prototype.quoted_printable_decode = function(str) {
//https://raw.githubusercontent.com/kvz/phpjs/master/functions/strings/quoted_printable_decode.js
  //       discuss at: http://phpjs.org/functions/quoted_printable_decode/
  //      original by: Ole Vrijenhoek
  //      bugfixed by: Brett Zamir (http://brett-zamir.me)
  //      bugfixed by: Theriault
  // reimplemented by: Theriault
  //      improved by: Brett Zamir (http://brett-zamir.me)
  //        example 1: quoted_printable_decode('a=3Db=3Dc');
  //        returns 1: 'a=b=c'
  //        example 2: quoted_printable_decode('abc  =20\r\n123  =20\r\n');
  //        returns 2: 'abc   \r\n123   \r\n'
  //        example 3: quoted_printable_decode('012345678901234567890123456789012345678901234567890123456789012345678901234=\r\n56789');
  //        returns 3: '01234567890123456789012345678901234567890123456789012345678901234567890123456789'
  //        example 4: quoted_printable_decode("Lorem ipsum dolor sit amet=23, consectetur adipisicing elit");
  //        returns 4: 'Lorem ipsum dolor sit amet#, consectetur adipisicing elit'

  var RFC2045Decode1 = /=\r\n/gm,
    // Decodes all equal signs followed by two hex digits
    RFC2045Decode2IN = /=([0-9A-F]{2})/gim,
    // the RFC states against decoding lower case encodings, but following apparent PHP behavior
    // RFC2045Decode2IN = /=([0-9A-F]{2})/gm,
    RFC2045Decode2OUT = function (sMatch, sHex) {
      return String.fromCharCode(parseInt(sHex, 16));
    };
  return str.replace(RFC2045Decode1, '').replace(RFC2045Decode2IN, RFC2045Decode2OUT);
}

// Helper function to urlify links in the text.
//https://gist.github.com/vinitkumar/10000895
tk_barrydegraaff_zimbra_openpgp.prototype.urlify = function(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');  
}

// Keyserver lookup
tk_barrydegraaff_zimbra_openpgp.prototype.lookup = function() {
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
               '<table><tr><td><input name="lookupResult" value="'+pubkey.keys[index].armor()+'" type="radio">&nbsp;</td><td><b>User ID[0]: ' + tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(pubkey.keys[index].users[0].userId.userid) + '</b></td></tr>' +
               '<tr><td></td><td><b>Fingerprint:' + publicKeyPacket.fingerprint + '</b></td></tr>' +
               '<tr><td></td><td>Primary key length: ' + keyLength + '</td></tr>' +
               '<tr><td></td><td>Created:' + publicKeyPacket.created+'</td></tr></table><hr style="width:550px; color: #bbbbbb; background-color: #bbbbbb; height: 1px; border: 0;">';
            }
            document.getElementById('barrydegraaff_zimbra_openpgpResult').innerHTML = document.getElementById('barrydegraaff_zimbra_openpgpResult').innerHTML + '</form>';

         } 
         else 
         {  
            document.getElementById('barrydegraaff_zimbra_openpgpResult').innerHTML = '<br>' + xmlHttp.status + ' '+ xmlHttp.statusText;  
         }  
      }  
   }; 

   xmlHttp.send( null );
      
}

// Handle selected keyserver lookup result
tk_barrydegraaff_zimbra_openpgp.prototype.okBtnLookup = function() {
var lookupResult = document.getElementsByName("lookupResult");
   for(var i = 0; i < lookupResult.length; i++) {
      if(lookupResult[i].checked == true) {
         this.okBtnImportPubKey(openpgp.key.readArmored(lookupResult[i].value));
      }
   }
};

// Function to open a browser print dialog of a certain div
tk_barrydegraaff_zimbra_openpgp.prototype.printdiv = function(printdivname, subject) {
   var divToPrint=document.getElementById(printdivname);
   var newWin=window.open('','Print-Window','width=800,height=600');
   newWin.document.open();
   newWin.document.write('<html><head><title>'+tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(subject)+'</title></head><body><h1>'+tk_barrydegraaff_zimbra_openpgp.prototype.escapeHtml(subject)+'</h1><pre style="white-space: pre-wrap;word-wrap: break-word;">'+divToPrint.innerHTML+'</pre></body></html>');
   newWin.document.close();
   newWin.focus();
   newWin.print();
   newWin.close();
}

// Reply(All) decrypted message (from reading pane)
tk_barrydegraaff_zimbra_openpgp.prototype.reply = function(msg, decrypted, action) {
   var composeController = AjxDispatcher.run("GetComposeController");
   if(composeController) {
      var sendDate = String(msg.sentDate);
      sendDate = tk_barrydegraaff_zimbra_openpgp.prototype.timeConverter(sendDate.substring(0,10))

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

      var header = '----- Original Message -----\r\n' +
      '​​​​From: "'+msg._addrs.FROM._array[0].name+'" <'+msg._addrs.FROM._array[0].address+'>\r\n' +
      'To: '+to+'\r\n' +
      'Cc: '+cc+'\r\n' +
      'Sent: '+sendDate+'\r\n' +
      'Subject: '+msg.subject.replace(/\*\*\*.*\*\*\*/,'')+'\r\n\r\n';

      if (action == 'replyAll')
      {
         var ccOverride =  to + ', ' + cc;
      }
      else
      {
         var ccOverride = null;
      }
      var appCtxt = window.top.appCtxt;
      var zmApp = appCtxt.getApp();
      var newWindow = zmApp != null ? (zmApp._inNewWindow ? true : false) : true;
      var params = {action:ZmOperation.NEW_MESSAGE, inNewWindow:null, composeMode:Dwt.TEXT,
      toOverride:'"'+msg._addrs.FROM._array[0].name+'" <'+msg._addrs.FROM._array[0].address+'>\r\n', ccOverride:ccOverride, subjOverride:msg.subject.replace(/\*\*\*.*\*\*\*/,''), extraBodyText:'-\r\n\r\n\r\n\r\n'+header+document.getElementById(decrypted).dataset.decrypted, callback:null}
      composeController.doAction(params); // opens asynchronously the window.
   }
}

// http://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
tk_barrydegraaff_zimbra_openpgp.prototype.timeConverter = function (UNIX_timestamp) {
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}

// Function to handle a show/hide button for password type input fields
tk_barrydegraaff_zimbra_openpgp.prototype.toggle_password = function (target) {
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
