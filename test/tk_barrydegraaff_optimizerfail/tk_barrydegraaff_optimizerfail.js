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
tk_barrydegraaff_optimizerfail = function() {
};

//Required by Zimbra
tk_barrydegraaff_optimizerfail.prototype = new ZmZimletBase;
tk_barrydegraaff_optimizerfail.prototype.constructor = tk_barrydegraaff_optimizerfail;

//Required by Zimbra
tk_barrydegraaff_optimizerfail.prototype.toString =
function() {
   return "tk_barrydegraaff_optimizerfail";
};

//Required by Zimbra
tk_barrydegraaff_optimizerfail.prototype.init = function() {
};

/* doDrop handler for verify and decrypt messages
 * */
tk_barrydegraaff_optimizerfail.prototype.doDrop =
function(zmObject) {
   var msgObj = zmObject.srcObj;
   
   //if its a conversation i.e. "ZmConv" object, get the first loaded message "ZmMailMsg" object within that.
   if (zmObject.type == "CONV") {
      msgObj  = zmObject.getFirstHotMsg();
   }

   var clearSignedRegEx = new RegExp('[\-]*BEGIN PGP SIGNATURE[\-]*');
   var msg = '-----BEGIN PGP SIGNED MESSAGE-----\n' +
'Hash: SHA256\n' +
'\n' +
'This is a signed message\n' +
'-----BEGIN PGP SIGNATURE-----\n' +
'Version: OpenPGP.js v0.5.1\n' +
'Comment: http://openpgpjs.org\n' +
'\n' +
'wsBcBAEBCAAQBQJTY1fbCRDmC87aTTsT2wAApmgH/2q3hje2XPpm21CqmqkW\n' +
'nJYvlw3b7OEezRj+T09n+8/PhiK5VQZYoRTPSvbZAEDroGUyVKxV3a5r/v4J\n' +
'mhPdZ3a73P4CX1EvezOHIrgOY146/xo/5/nsDx0TbbAHs0sY2kqeLSZ0UM71\n' +
'Zc4Sfnrz0n6opaG5bG8N2EfHfB22ju/YI4Wf+x150fSb0kxDjPL48SW31/75\n' +
'JXKh2dFrderV0g9ZS6lwRJXxWdpIN/Tcq3EYmIKR0HNLi4dBcTsd+7tK9Kta\n' +
'v/+mCN6C6O/65OylvqbA3pnnDWCpwKW6N0kM7l2lGtXTnjCx1D6LSfhJa/Z6\n' +
'ypGsIUxClUFMDsV6uBj1Jdk=\n' +
'=iEYz\n' +
'-----END PGP SIGNATURE-----   \n'
   
   if (msg.match(clearSignedRegEx)) {      

       var mPubKey = '-----BEGIN PGP PUBLIC KEY BLOCK-----\n' +
                     'Version: GnuPG v1\n' +
                     '\n' +
                     'mQENBFNaGZsBCACor4dD3KIG5Ndj4Lj/AJahrFYagYvLvQbFjU+IUNyHsxmEAqJs\n' +
                     'yZJKNQNU41F21VWrvJsiUlyztcuAXmCaJIwKawXFUhyojgTKbMz1o3SBMpUP2S8+\n' +
                     'F9iUMN/Z5+2+OA941fD2dfeHVC+8cKBDrajMjPzELQN4WzFWLkzxjtb8lAbnO90b\n' +
                     'zkXtGfghKDHViMxbDBBx1xHqLirVUk1SZVM4/jpaiK4XteT/O3SLjy4INOf8QQeA\n' +
                     'DHKkRbJNRUwIGligkCu337ufMBbxKlLpgWDyKL4cOqSaQ5xMjN40eZcAmt4gIvg7\n' +
                     'WwaSbldjVoTkpjmPcXayJo/FXHH/aQHKuEr9ABEBAAG0dlppbWJyYSBPcGVuUEdQ\n' +
                     'IFppbWxldCBURVNUIEtFWSAob25seSB1c2UgZm9yIHRlc3RpbmcgcHVycG9zZSBO\n' +
                     'T1QgU0VDVVJFISEpIDxwbGVhc2UtdXNlLWZvci10ZXN0aW5nLW9ubHlAbXl6aW1i\n' +
                     'cmEudGVzdD6JATgEEwECACIFAlNaGZsCGwMGCwkIBwMCBhUIAgkKCwQWAgMBAh4B\n' +
                     'AheAAAoJEOYLztpNOxPbcBEH/0t3D6IVseHUM6lIimyW6aIorQy49+LkZgzWKgxD\n' +
                     '7y+tBH1gWt2Axf+2jn5U/FsGQn47qk4o5tmO4695OrFJbpF69IZwB64AitgfRoKh\n' +
                     'obh41Ec2qMhyZqV2ovfbMMa8vzEjsSnUaP8W1Uhtrougt1ZLx/hPIZu6V+2FEMbC\n' +
                     '5AOnMX1CVWPui49tgY4Sn5EFfkHcx+pPn5n2MWQ9CeQ5dK2RQbsViqcqJdCf0EY8\n' +
                     'ZVGGrMW7E0IwLdEiBeXsvjXNOLd2A3CyBpHMoqIlNIP2LHyrEPRk93jVQxT0Kqaa\n' +
                     'wj2QHjvG2rSw43wQcuwKqjH6vmY1qqKdvEELxB7yVNbSj5G5AQ0EU1oZmwEIAJkK\n' +
                     'e7mrneY6ZreTTvVwsVOxhb9ydH82lhM8bkGduh0vCLp/87ING8AGQzrc8SVymnCQ\n' +
                     'hNmzjRFsEdO/ETtFhEfiMoMxfB9JWTVJXx7ISvBfmMEYGnK9p5TXqRHxIuVj4jmY\n' +
                     '/d+FcY5HYItFAJKXWf9tGiSjix/ixf1XnXukfDNKWp79kPwLV8nHvSHCZSEVQFTC\n' +
                     'EuwufCg4S/N96v8g4urZ21xZO3eggfzO7TKEtzp7HnqcE9Aa4v7x/I++bLvHqwOr\n' +
                     'QLW+HmMIwyoMRD63JlNcwBX2HFmzPJm4CK01zrhhJ6JADv8QDVBiARB/OE7H3gbI\n' +
                     'Sl+uwcOlm7zcx+hedQUAEQEAAYkBHwQYAQIACQUCU1oZmwIbDAAKCRDmC87aTTsT\n' +
                     '23uXB/4ypjA0ZVNYGQctClGJ+1u/0c0+AuyCCQoSTsA+1IkxtuKJy3ibWekYhNd2\n' +
                     'bc4ju248zJIiHJkNLzrDk8oxe0W79ONjnhEkC0G4y1anGl8KAL47j0kkbeQku5hx\n' +
                     'yw3via/HzlUR3SARUON7xhKjKoqJCtdmkSGR0kSa13VdFpbF0i26FVWIurTm3YVg\n' +
                     'I2bJ8sl48d7fRR6GakGmTC9bw1EaFgovWFq6z3GKbxF7JvICt9svfqktf4EDGEfS\n' +
                     'y4H4yZ0xkCM+LsseQGOtcloPpgoyTVvN7Qd41cCXUKV2P3ZN1j0d4YPwckz2n3xy\n' +
                     '8p6Oio6x2QfjcWJQ4/HA44RXPni3\n' +
                     '=ldYW\n' +
                     '-----END PGP PUBLIC KEY BLOCK-----';
      var publicKeys = openpgp.key.readArmored(mPubKey);
      console.log("publicKeys: %o", publicKeys);
      
      var message = openpgp.cleartext.readArmored(msg);
      console.log("message: %o", message);
      
      var verified = openpgp.verifyClearSignedMessage(publicKeys.keys, message);        
      console.log("verified: %o", verified);
      
      if(verified.signatures[0].valid==true)
      {
         alert('<pre>Got a good signature.</pre>');
      }
      else
      {
         alert('<pre>SIGNATURE FAILED!'+verified.signatures[0].valid+'</pre>');
      }
      alert(msg);
   }   
   else {
      alert("No PGP message detected.");
      return;
   }
};
