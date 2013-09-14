function attach(e)
{	
	chrome.tabs.getSelected(null, function(tab) {
	  chrome.tabs.sendMessage(tab.id, {method: "enableEncrypt"}, null);
	});
	
}

// NEED IT TO LOOK LIKE THE FOLLOWING FORLOOP EVENTUALLY, TO HAVE MULTIPLE 
// GROUPS SHOW UP ON CONTEXT MENU WHEN ENCRYPTING

// function setMenu(groups) {
// 	var differentGroups = groups.split();
// 	for (var i = differentGroups.length - 1; i >= 0; i--) {
// 		chrome.contextMenus.create ({
// 			title:differentGroups[i], contexts:["editable"], onclick:attach,
// 		});
// 	};
// }

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

chrome.contextMenus.create ({
	title:"Encrypt with Whisper", contexts:["editable"], onclick:attach
});