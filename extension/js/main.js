//content script
var clickedEl = null;
var _groups = null;
var user_logged_in = null;

openpgp.init();

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

var wispRegex = /\[\!wisp \| (\w*) \| (\w*) \] ([^\[\|]*) \| ([^\[\|]*) \[\/\/wisp\]/gi;

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
  //encrypted = CryptoJS.AES.encrypt(value, key);
  var aes = new pidCrypt.AES.CBC();
  var encrypted = aes.encryptText(value, key, {nBits: 256});
  var encrypted = rot13(value); // this is temporary, rewrite this later
  return "[!wisp | " + user_logged_in + " | " +  group_id + " ] " + encrypted + " | "
    + encrypted + " [//wisp]";
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
      if(ele.children().length > 0) continue;

      var text = ele.html();
      if (text.indexOf("[!wisp | ") != -1 && text.indexOf("[//wisp]") != -1)
      {
        ele.text(text.replace(wispRegex, wispRegexReplacer));
      }
    }
  }
}

$.getJSON('http://whisper-signalfire.herokuapp.com/keystore/user').done(function(data){
  user_logged_in = data.user;
  decrypt(document);
  encryptedFormHandler.setupDecryptObserver();
});
  
// decryption. only decrypts if user is the user_id
// if so, attempts to use the user's private key to decrypt.
function decrypt_msg(sender, recipient, senderMessage, recipientMessage)
{
  if (sender === user_logged_in){
    // unecrypt using user's private key later
    return "(wisp to " + recipient + "): " + rot13(senderMessage);
  } else if (recipient === user_logged_in) {
    return "(wisp from " + sender + "): " + rot13(recipientMessage);
  }
  return "[whisper] You don't have access to this message. [//whisper]";


  //  var aes = new pidCrypt.AES.CBC();
  //  var decrypted = aes.decryptText(msg, key, {nBits: 256});
  //  return decrypted;
}
