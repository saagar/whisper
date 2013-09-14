var EncryptedFormHandler = function() {
	var that = this;

	this.forms = {};
	this.targetFriends = {};
	this.loaded = false;

	this.setupDecryptObserver = function(){
		// Set up an observer to watch the DOM and decrypt necessary divs
		this.MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
		var observer = new MutationObserver(function(mutations, observer) {
			// fired when a DOM mutation occurs
			if (mutations.length > 0 && $(mutations[0].target).find("*:contains('[!wisp | ')").length > 0) {
				decrypt(mutations[0].target);
			}
		});

		observer.observe(document, { characterData : true, childList : true, subtree: true });
	};

	this.addInput = function(element, friendName) {
		$(element).data("whisper-friend", friendName);
		console.log($(element).data("whisper-friend"));

		// if it is a form (supposedly), works for facebook status (confirmed), but not gmail
		if (element.form)
		{
			// Change div background to green and put lock on right-hand side
			$(element).closest(".uiTypeahead").css({ "background": "top right no-repeat url('"+chrome.extension.getURL("img/lock.png")+"')", "background-color": "#5cff68" });
			this.forms[element.form.name] = [element, false];
			this.targetFriends[element.form.name] = friendName;
			$(element.form).submit(function (e)
			{
				if (!that.forms[e.target.name][1])
				{
					that.forms[e.target.name][1] = true;
					that.forms[e.target.name][0].value = encrypt(
						"",
						that.targetFriends[e.target.name],
						that.forms[e.target.name][0].value);
					console.log(that.forms[e.target.name][0].value);
					$(e.target).find("input[name='xhpc_message']").val(that.forms[e.target.name][0].value);
					$(e.target).find(".highligherContent .hidden_elem").html(that.forms[e.target.name][0].value);

					// Delay form submission in order to propagate the value change to the textbox
					setTimeout(function(){
						$(element.form).find("input[type='submit'], button").trigger("click");
					}, 10);
					return false;
				}
			});
		}
		/* gmail
		else if($('[g_editable*="true"]') != null)
		{
			alert(element);
			var text = $('[g_editable*="true"]').html(); // gets contents inside 'compose email' in gmail
			alert($(element).closest(".editable").length); // this doesn't work for some reason
			$(element).closest(".editable").css({ "background": "top right no-repeat url('"+chrome.extension.getURL("img/lock.png")+"')", "background-color": "#5cff68" });
		}*/
		else { // if it's not a form - works for facebook chat and gchat (confirmed)
			$(element).closest("table").css({ "background": "top right no-repeat url('"+chrome.extension.getURL("img/lock.png")+"')", "background-color": "#5cff68" });
			
			// second argument true to use event capturing instead of bubbling (described http://www.quirksmode.org/js/events_order.html)
			// In order to ensure our event listener gets added first, adds the listener to the parent of the clicked element
			// so that event capturing hits the outside wrapper first and gets our listener first
			$(element).parent().get(0).addEventListener('keydown', function(e) { 
				if (e.keyCode === 13 && !e.shiftKey) { 
					clickedEl.value = encrypt("",
						$(element).data("whisper-friend"),
						clickedEl.value);
					return false;
				} 
			}, true);
		}
	}

	this.setupDecryptObserver();
};

var encryptedFormHandler = new EncryptedFormHandler();


var EncryptedForms = new function ()
{
	this.groups = [];
	this.loaded = false;
	this.currentGroup = null;
	this.forms = {};
	this.targetFriends = [];
	
	this.syncGroups = function ()
	{
		chrome.storage.local.get("groups", function(data)
		{
			if (data['groups'] == null)
			{
				chrome.storage.local.set({ "groups" : {} });
			}
			else
			{
				EncryptedForms.groups = data['groups'];
				for (var i in EncryptedForms.groups)
				{
					EncryptedForms.currentGroup = i;
					break;
				}
			}
			
			if (!EncryptedForms.loaded)
			{
				MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

				var observer = new MutationObserver(function(mutations, observer) {
					// fired when a mutation occurs
					if ( mutations.length > 0 && $(mutations[0].target).find("*:contains('[!wisp | ')").length > 0)
					{
						decrypt(mutations[0].target);
					}
				});
				
				observer.observe(document, { characterData : true, childList : true, subtree: true });
				EncryptedForms.loaded = true;
			}
		});
	}
	
	// this.syncGroups();
	
	this.add = function(element, friend)
	{	// if it is a form (supposedly), works for facebook status (confirmed), but not gmail
		if (element.form)
		{
			$(element).closest(".uiTypeahead").css({ "background": "top right no-repeat url('"+chrome.extension.getURL("img/lock.png")+"')", "background-color": "#5cff68" });
			EncryptedForms.forms[element.form.name] = [element, false];
			$(element.form).submit(function (e)
			{
				if (!EncryptedForms.forms[e.target.name][1])
				{
					EncryptedForms.forms[e.target.name][1] = true;
					EncryptedForms.forms[e.target.name][0].value = encrypt(EncryptedForms.groups[EncryptedForms.currentGroup], EncryptedForms.currentGroup, EncryptedForms.forms[e.target.name][0].value);
					$(e.target).find("input[name='xhpc_message']").val(EncryptedForms.forms[e.target.name][0].value);
					$(e.target).find(".highligherContent .hidden_elem").html(EncryptedForms.forms[e.target.name][0].value);
					setTimeout("EncryptedForms.submit('"+e.target.name+"');", 10);
					return false;
				}
			});
		}
		/* gmail
		else if($('[g_editable*="true"]') != null)
		{
			alert(element);
			var text = $('[g_editable*="true"]').html(); // gets contents inside 'compose email' in gmail
			alert($(element).closest(".editable").length); // this doesn't work for some reason
			$(element).closest(".editable").css({ "background": "top right no-repeat url('"+chrome.extension.getURL("img/lock.png")+"')", "background-color": "#5cff68" });
		}*/
		else { // if it's not a form - works for facebook chat and gchat (confirmed)
			$(clickedEl).closest("table").css({ "background": "top right no-repeat url('"+chrome.extension.getURL("img/lock.png")+"')", "background-color": "#5cff68" });
			// second argument true to use event capturing instead of bubbling (described http://www.quirksmode.org/js/events_order.html)
			// In order to ensure our event listener gets added first, adds the listener to the parent of the clicked element
			// so that event capturing hits the outside wrapper first and gets our listener first
			$(clickedEl).parent().get(0).addEventListener('keydown', function(e){ 
				console.log(clickedEl.value);
				if (e.keyCode == 13 && !e.shiftKey) { 
					clickedEl.value = encrypt(EncryptedForms.groups[EncryptedForms.currentGroup], EncryptedForms.currentGroup, clickedEl.value);
					return false;
				} 
			}, true);
		}
	}
	
	// this.submit = function(id)
	// {
	// 	$(this.forms[id][0].form).find("input[type='submit'], button").trigger("click");
	// 	this.forms[id][1] = false;
	// }
}

function array_to_string(arr)
{
	var str = "{ ";
	for (var i in arr)
	{
		str += "[ "+i+" : "+ arr[i] +" ], ";
	}
	str = str.substr(0, str.length - 2);
	str += " }";
	return str;
}