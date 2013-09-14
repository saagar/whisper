//content script
var clickedEl = null;
var _groups = null;

document.addEventListener("mousedown", function(event){
    //right click
    if(event.button == 2) { 
        clickedEl = event.target;
    }
}, true);
	
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.method == "enableEncrypt")
	{
		EncryptedForms.add(clickedEl);
    }
	if(request.method == "enableDecrypt")
	{
		decrypt();
    }
	if(request.method == "newGroup")
	{
		EncryptedForms.syncGroups();
	}
});
    
function encrypt(key, group_id, value){
	//encrypted = CryptoJS.AES.encrypt(value, key);
	var aes = new pidCrypt.AES.CBC();
	var encrypted = aes.encryptText(value, key, {nBits: 256});
	return "[!wisp | " + group_id + " ] " + encrypted + " [/wisp]";
}

    function decrypt (element)
	{
	  var html = $(element).find('*:contains("[!wisp | ")');
	  if (html.length > 0)
	  {
		 for (var i = html.length-1; i >= 0; i--)
		 {
			var ele = $(html[i]);
			var text = ele.text();
			if (text.indexOf("[!wisp | ") != -1 && text.indexOf("[/wisp]") != -1)
			{
				var result = text.split("[")[1].split("]");
				var number = result[0].split("|")[1].trim();
				var encrypted = result[1].trim();
				ele.text(decrypt_msg(number, encrypted));
				decrypt();
			}
		 }
	  }
	}
	

	function decrypt_msg(group_id, msg)
	{
		var key = EncryptedForms.groups[group_id];
		if (key == null ){
			return "You don't have access to this message.";
		}
		else
		{
			var aes = new pidCrypt.AES.CBC();
			var decrypted = aes.decryptText(msg, key, {nBits: 256});
			return decrypted;
		}
	}

chrome.storage.local.get(["username", "pw"], function(data)
{
	$.getJSON("http://www.projectvoid.com/whisper/whisper_controller.php?action=retrieve&username="+data['username']+"&pw="+data['pw'], function (data)
	{
		_groups = data['groups'];
		chrome.storage.local.get("groups", function(data)
		{
			if (_groups != [] && _groups != null)
			{
				var groups = data['groups'];
				for (var i = 0; i < _groups.length; i++)
				{
					groups[_groups[i][0]] = _groups[i][1];
				}
				chrome.storage.local.set({"groups" : groups });
			}
		});
		
	});
});