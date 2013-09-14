// debugger;
_group = null;
document.addEventListener('DOMContentLoaded', function() {
	chrome.storage.local.get(["username", "pw", "groups"], function(data)
	{
		if (data['username'] == null) $(".login").show();
		else
		{
			$("#loggedin").html(data['username']);
			chrome.storage.local.get('groups', function(data)
			{
				$("#keys").text(array_to_string(data['groups']));
			});
			$(".success").show();
		}
	});
	$("#btn-register").click(function ()
	{
		$.getJSON("http://www.projectvoid.com/whisper/whisper_controller.php?action=register&username="+$("#inputUsername").get(0).value+"&pw="+$("#inputPassword").get(0).value, function (data)
		{
			if (data['success'])
			{
				$(".login").hide();
				$(".success").show();
				$("#loggedin").html(data['username']);
				chrome.storage.local.set({'username' : data['username']});
				chrome.storage.local.set({'pw' : data['pw']});
			}
		});
	});
	$("#btn-login").click(function ()
	{
		$.getJSON("http://www.projectvoid.com/whisper/whisper_controller.php?action=login&username="+$("#inputUsername").get(0).value+"&pw="+$("#inputPassword").get(0).value, function (data)
		{
			if (data['success'])
			{
				$(".login").hide();
				$(".success").show();
				$("#loggedin").html(data['username']);
				chrome.storage.local.set({'username' : data['username']});
				chrome.storage.local.set({'pw' : data['pw']});
			}
		});
	});
	$("#btn-newGroup").click(function () 
	{
		chrome.storage.local.get(["username", "pw"], function(data)
		{
			$.getJSON("http://www.projectvoid.com/whisper/whisper_controller.php?action=new_group&username="+data['username']+"&pw="+data['pw']+"&group_name="+$("#inputGroupName").val(), function (data)
			{
				var key = generate_key(256);
				var id = data['id']
				_group = [id, key];
				chrome.storage.local.get('groups', function(data) 
				{
					$("#inputGroupName").val("");
					var newgroups = data['groups'];
					newgroups[_group[0]] = _group[1];
					_group = null;
					chrome.storage.local.set({'groups' : newgroups});
					$("#keys").text(array_to_string(newgroups));
					chrome.tabs.getSelected(null, function(tab) {
	  					chrome.tabs.sendMessage(tab.id, {method: "newGroup"}, null);
					});
				});
			});
		});
	});
	$("#btn-logout").click(function ()
	{
		chrome.storage.local.get("username", function(data)
		{
			if (data['username'] != null)
			{
				$(".login").show();
				$(".success").hide();
				chrome.storage.local.set({'username' : null});
				chrome.storage.local.set({'pw' : null});
				chrome.storage.local.set({'groups' : {}});
				EncryptedForms.groups = {};
			}
		});
	});
	$("#btn-addFriend").click(function ()
	{
		chrome.storage.local.get(["username", 'pw', 'groups'], function(data)
		{
			var index = null;
			for (var i in data['groups'])
			{
				index = i;
				break;
			}
			$(".success").text("http://www.projectvoid.com/whisper/whisper_controller.php?action=share&username="+data['username']+"&pw="+data['pw']+"&group_id="+i+"&key="+data['groups'][i]+"&recipient="+$("#inputFriendName").get(0).value);
			$.getJSON("http://www.projectvoid.com/whisper/whisper_controller.php?action=share&username="+data['username']+"&pw="+data['pw']+"&group_id="+i+"&key="+data['groups'][i]+"&recipient="+$("#inputFriendName").get(0).value, function (data)
			{
				if (data['success'])
				{
					$("#inputFriendName").val("");
				}
		});
		});
	});
});

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