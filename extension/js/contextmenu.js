function attach(e)
{	
	chrome.tabs.getSelected(null, function(tab) {
	  chrome.tabs.sendMessage(tab.id, {method: "enableEncrypt"}, null);
	});
	
}

// // chrome.contextMenus.create ({
// // 	title:"Encrypt with Whisper", contexts:["editable"], onclick:attach,
// // });

// // chrome.contextMenus.create ({
// // 	title:"Option 1", contexts:["editable"], onclick:attach,
// // });

// // chrome.contextMenus.create ({
// // 	title:"Option 2", contexts:["editable"], onclick:attach, 
// // });

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
    if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, {method: "enableDecrypt"}, null);
    }
	
});

// Add a context menu item for each friend.
$.getJSON('http://whisper-signalfire.herokuapp.com/keystore/user/friends').done(function(data){
  var friends = data.friends;
  console.log(data);
  for (var i = 0; i < friends.length; i++) {
    chrome.contextMenus.create ({
      title:"Whisper to " + friends[i], contexts:["editable"], onclick:attach
    });
  }
});

console.log("FUCK");