//content script
var clickedEl = null;
var _groups = null;
var user_logged_in = null;


//------------- PGP code ----------------------
// Initialize PGP once
openpgp.init();
// var keypair2 = generateKeyPair(1, 1024, "Amy Tai", "noob@pton.edu", "");

// utility functions to get armored keys
function getArmoredPublicKey(keypair) {
  return keypair.publicKeyArmored;
}

function getArmoredPrivateKey(keypair) {
  return keypair.privateKeyArmored;
}

// pass in 1 for algo to use RSA because nothing else is supported....
// leave password as blank for now.
function generateKeyPair(algo, size, name, email, password) {
  if (window.crypto.getRandomValues) {
    var name_email_pair = name + " <" + email + ">";
    var keypair = openpgp.generate_key_pair(algo, size, name_email_pair, password);
    chrome.storage.local.set({
      publicKeyArmored: getArmoredPublicKey(keypair),
      privateKeyArmored: getArmoredPrivateKey(keypair)
    });
    // upload public key

    return keypair;
  }
  else {
    return failAndWarn();
  }
}


var keypair2 = {};

chrome.storage.local.get(['publicKeyArmored', 'privateKeyArmored'], function(data) {
  if(data.privateKeyArmored && data.publicKeyArmored) {
    keypair2 = data;
  } else {
    keypair2 = generateKeyPair(1, 1024, user_logged_in, "noob@pton.edu", "");
  }
  $.getJSON("http://whisper-signalfire.herokuapp.com/keystore/key/set", {
    key: getArmoredPublicKey(keypair2)
  });
  console.log(keypair2.privateKeyArmored);
});


// need a private armored key - password should be blank for now
function pgpDecrypt(privateKey, ciphertext, password) {
  if (window.crypto.getRandomValues) {
    var priv_key = openpgp.read_privateKey(privateKey);

    if (priv_key.length < 1) {
      util.print_error("No private key found!")
      return;
    }

    // here's where the decrypting magic happens. don't ask, just do it.
    var msg = openpgp.read_message(ciphertext);
    if(!msg) return null;
    var keymat = null;
    var sesskey = null;
    // Find the private (sub)key for the session key of the message
    for (var i = 0; i< msg[0].sessionKeys.length; i++) {
      if (priv_key[0].privateKeyPacket.publicKey.getKeyId() == msg[0].sessionKeys[i].keyId.bytes) {
        keymat = { key: priv_key[0], keymaterial: priv_key[0].privateKeyPacket};
        sesskey = msg[0].sessionKeys[i];
        break;
      }
      for (var j = 0; j < priv_key[0].subKeys.length; j++) {
        if (priv_key[0].subKeys[j].publicKey.getKeyId() == msg[0].sessionKeys[i].keyId.bytes) {
          keymat = { key: priv_key[0], keymaterial: priv_key[0].subKeys[j]};
          sesskey = msg[0].sessionKeys[i];
          break;
        }
      }
    }

    // decrypt the string
    if (keymat != null) {
      if (!keymat.keymaterial.decryptSecretMPIs(password)) {
        util.print_error("Password for secrect key was incorrect!");
        return;
      }
      plaintext = msg[0].decrypt(keymat, sesskey);
      return plaintext;
    } else {
      util.print_error("No private key found!");
    }

  } else {
    return failAndWarn();
  }
}

function failAndWarn() {
  window.alert("Error: Browser not supported\nReason: We need a cryptographically secure PRNG to be implemented (i.e. the window.crypto method)\nSolution: Use Chrome >= 11, Safari >= 3.1 or Firefox >= 21");
  return false;
}

// need a public armored key
function pgpEncrypt(publicKey, plaintext) {
  if (window.crypto.getRandomValues) {

    var publicKeyObject = openpgp.read_publicKey(publicKey);

    return openpgp.write_encrypted_message(publicKeyObject, plaintext);
  // // var publicKey = openpgp.read_publicKey(keypair2.publicKeyArmored);
  // // ciphertext = openpgp.write_encrypted_message(publicKey, "Hello World!");
  //   var publicKeyObject = openpgp.read_publicKey(publicKey);
  //   ciphertext = openpgp.write_encrypted_message(publicKeyObject, plaintext);
  //   return ciphertext;
  }
  return failAndWarn();
}


//------------- Extension code --------------------


document.addEventListener("mousedown", function(event){
    //right click
    if(event.button === 2) { 
        clickedEl = event.target;
    }
}, true);
  
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(request);
  if(request.method == "enableEncrypt") {
    encryptedFormHandler.addInput(clickedEl, request.friendName);
  }
  if(request.method == "enableDecrypt") {
    decrypt();
  }
  if(request.method == "newGroup") {
    encryptedFormHandler.syncGroups();
  }
});

// implements a basic rot13
function rot13(s)
 {
    return (s ? s : this).split('').map(function(_)
     {
        if (!_.match(/[A-za-z]/)) return _;
        c = Math.floor(_.charCodeAt(0) / 97);
        k = (_.toLowerCase().charCodeAt(0) - 83) % 26 || 26;
        return String.fromCharCode(k + ((c == 0) ? 64 : 96));
     }).join('');
 }

var wispRegex = /\[\!wisp \| (\w*) \| (\w*)\]([^\[\|]*)\|([^\[\|]*)\[\/\/wisp\]/gi;

function wispRegexReplacer(match, sender, recipient, senderMessage, recipientMessage, offset, string) {
  // console.log(sender, recipient, user_logged_in, senderMessage, recipientMessage);
  if (!sender || !recipient || !senderMessage || !recipientMessage) {
    return match;
  }

  // return match;
  return decrypt_msg(sender, recipient, senderMessage, recipientMessage);
}

// value is text
function encrypt(key, group_id, value){
  console.log(keypair2);

  var publicKey = openpgp.read_publicKey(getArmoredPublicKey(keypair2));

  // // var text = "It is a rare to watch someone secure a freshly installed server right off the bat, yet the world we live in makes this a necessity. So why do so many people put it off until the end, if at all? I’ve done the exact same thing, and it often comes down to wanting to get right into the fun stuff. Hopefully this post will show that it is far easier than you think to secure a server, and can be quite entertaining to look down from your fortress, when the attacks begin to flow."

  var ciphertext = btoa(pgpEncrypt(getArmoredPublicKey(keypair2), value));

  var keyData;
  $.ajax({
    url: "http://whisper-signalfire.herokuapp.com/keystore/user/get/" + group_id + "/",
    dataType: 'json',
    async: false,
    success: function(data) {
      keyData = data;
    }
  });

  console.log(keyData);

  console.log(ciphertext);
  console.log(btoa(ciphertext));

  var recipientCiphertext = btoa(pgpEncrypt(keyData.key, value));

  var plaintext = pgpDecrypt(getArmoredPrivateKey(keypair2), atob(ciphertext), "");
  console.log(plaintext);


  // var encrypted = aes.encryptText(value, key, {nBits: 256});
  var encrypted = rot13(value); // this is temporary, rewrite this later
  return "[!wisp | " + user_logged_in + " | " +  group_id + "]" + ciphertext + "|"
    + recipientCiphertext + "[//wisp]";
}

// Scan element for wisp tags and decrypt if possible.
function decrypt (element) {
  var html = $(element).find('*:contains("[//wisp]")');
  // console.log(html.length, element);
  if (html.length > 0) {
    for (var i = html.length-1; i >= 0; i--) {
      var ele = $(html[i]);
      // Only replace text in elements with no children. Works as long as text
      // is not weirdly formatted.
      // .userContent is FB div
      if(ele.children().not('wbr').length > 0 && !ele.is('span.userContent')) continue;

      ele.find('wbr').remove();

      if(ele.is('span.userContent')) {
        var parentText = ele
          .clone()    //clone the element
          .children() //select all the children
          .remove()   //remove all the children
          .end()  //again go back to selected element
          .text();
        var textWithoutBreaks = $.map(ele.find('span'), function(el){return $(el).text();}).join('') + parentText;
        ele.text(textWithoutBreaks.replace(wispRegex, wispRegexReplacer));
      } else {

        var text = ele.html();
        if (text.indexOf("[!wisp | ") != -1 && text.indexOf("[//wisp]") != -1)
        {
          ele.text(text.replace(wispRegex, wispRegexReplacer));
        }
      }
    }
  }
}

function showMessages(msg){console.log(msg);};

$.getJSON('http://whisper-signalfire.herokuapp.com/keystore/user').done(function(data){
  user_logged_in = data.user;
  decrypt(document);
  encryptedFormHandler.setupDecryptObserver();
});
  
// decryption. only decrypts if user is the user_id
// if so, attempts to use the user's private key to decrypt.
function decrypt_msg(sender, recipient, senderMessage, recipientMessage)
{
  // console.log(senderMessage);
  if (sender === user_logged_in){
    var unb64 = null;
    try {
      unb64 = atob(senderMessage);
    } catch(err) {
      return "[whisper] Undecryptable message. [//whisper]"; 
    }
    // unecrypt using user's private key later
    var decrypted = pgpDecrypt(getArmoredPrivateKey(keypair2), unb64, "");
    if (!decrypted) {
      return "[whisper] Undecryptable message. [//whisper]";
    }
    return "(wisp to " + recipient + "): " + decrypted;
  } else if (recipient === user_logged_in) {
    var unb64 = null;
    try {
      unb64 = atob(recipientMessage);
    } catch(err) {
      return "[whisper] Undecryptable message. [//whisper]"; 
    }
    // console.log(unb64);
    // unecrypt using user's private key later
    var decrypted = pgpDecrypt(getArmoredPrivateKey(keypair2), unb64, "");
    if (!decrypted) {
      return "[whisper] Undecryptable message. [//whisper]";
    }
    return "(wisp from " + sender + "): " + decrypted;
  }
  return "[whisper] You don't have access to this message. [//whisper]";


  //  var aes = new pidCrypt.AES.CBC();
  //  var decrypted = aes.decryptText(msg, key, {nBits: 256});
  //  return decrypted;
}
