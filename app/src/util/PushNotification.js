var IOS_DEVICE = 1;
var ANDROID_DEVICE = 2;

var push= {
	// push.ication Constructor
	registerNotification: function() {
		console.log("Registering Notification for "+device.platform);
		var pushNotification = window.plugins.pushNotification;
		console.log("Checking device type");
		if (push.isAndroid()) {
			console.log("Device type = "+device.platform);
			pushNotification.register(push.successHandler, 
			push.errorHandler, {"senderID":"852521907580","ecb":"window.push.onNotificationGCM"});
		} else {
			console.log("Device type = "+device.platform);
			pushNotification.register(
				push.successHandler,
				push.errorHandler, {
					"badge":"true",
					"sound":"true",
					"alert":"true",
					"ecb":"push.onNotificationAPN"
				});
		}

	},
	unregisterNotification: function() {
		console.log("Unregistering push notification");
		var pushNotification = window.plugins.pushNotification;
		pushNotification.unregister(function() { 
			console.log("Unregistered Notification");
			var token;
			if (supportsLocalStorage()) {
				token = localStorage['pushNotificationToken'];
			} else {
				token = push.pushNotificationToken;
			}

			var argsToSend = getCSRFPreventionObject('registerForPushNotificationCSRF', 
				{ date:cachedDateUTC, userId:currentUserId, token:token,deviceType:push.deviceType()});
				$.getJSON(makeGetUrl("unregisterPushNotification"), makeGetArgs(argsToSend),
				function(data){
					if (checkData(data)) {
						console.log("Notification token removed from the server");
					}
				});    	

		}, 
		function() { console.log("Error trying to unregister: "+error); });
	},
	errorHandler: function(error) {
		console.log("Error trying to register: "+error);
		var keys = [];
		for(var key in error){
			console.log("Error property name "+key);
			console.log("Error property val "+error[key]);
		}

	},
	successHandler: function(result) {
		if (push.isIOS()) {
			push.tokenHandler(result);
		}
		console.log("Push notification registration successful. Result: "+result);
	},

	onNotificationAPN: function(event) {
		var keys = [];
		for(var key in event){
			console.log("APN Event property name "+key);
			console.log("APN Event property val "+event[key]);
		}

		console.log("Entry ID: "+event.entryId);
		window.entryId = "Testing";
		window.entryId1 = event.entryId;
		//TODO Change date for track view
		// event.entryDate, glow using entry.entryid
		//
		App.pageView.changePage('track', event);

		if ( event.alert ) {
			navigator.notification.alert(event.alert);
		}

		if ( event.sound ) {
			var snd = new Media(event.sound);
			snd.play();
		}

		if ( event.badge ) {
			pushNotification.setpush.icationIconBadgeNumber(successHandler, 
			errorHandler, event.badge);
		}
	},
	onNotificationGCM: function(e) {
		switch( e.event )
		{
			case 'registered':
				if ( e.regid.length > 0 )
				{
					console.log("GCM Registered");
					push.tokenHandler(e.regid);
				}
				break;

			case 'message':
				// this is the actual push notification. its format depends on the data model from the push server
				console.log("Push notification received ..")
				showAlert(e.message);
				//var pushNotification = window.plugins.pushNotification;
				//pushNotification.unregister(push.successHandler, push.errorHandler);
				break;

			case 'error':
				alert('GCM error = '+e.msg);
				break;

			default:
				alert('An unknown GCM event has occurred');
				break;
		}
	},
	tokenHandler: function(token) {
		var argsToSend = getCSRFPreventionObject('registerForPushNotificationCSRF', 
			{ date:cachedDateUTC, userId:currentUserId, token:token,deviceType:push.deviceType()});
			$.getJSON(makeGetUrl("registerForPushNotification"), makeGetArgs(argsToSend),
			function(data){
				if (checkData(data)) {
					console.log("Notification token saved on the server")
				}
			});    	
			console.log("Regid " + token);
			push.pushNotificationToken = token;
			if (supportsLocalStorage()) {
				localStorage['pushNotificationToken'] = token;
			}
	},

	deviceType: function() {
		return push.isAndroid()?ANDROID_DEVICE:IOS_DEVICE;
	},
	isAndroid: function() {
		return device.platform == 'android' || device.platform == 'Android';
	},
	isIOS: function() {
		return device.platform == 'ios' || device.platform == 'iOS';
	}

};
push.serverUrl = "http://192.168.0.107";
//push.serverUrl = "https://dev.wearecurio.us";

// Overriding url methods from index.gsp

function makeGetUrl(url) {
	console.log("makeGetUrl at index.js");
	return push.serverUrl+"/mobiledata/" + url + '?callback=?';
}

function makePostUrl(url) {
	console.log("makePostUrl at index.js");
	return push.serverUrl+"/mobiledata/" + url;
}

function makePlainUrl(url) {
	var url = push.serverUrl+"/mobile/" + url;
	url = url;
	return url;
}

/**
* A method which returns an object containing key & its token based on given key.
* This is useful to be easily passed in some jQuery methods like <b>getJSON</b>,
* which accepts parameters to be passed as Object.
* @param key unique string which is passed in jqCSRFToken tag to create token.
* @param data optional object to attach to new object using jQuery's extend method.
* @returns the object containing parameters for CSRF prevention.
*/
function getCSRFPreventionObject (key, data) {
	var CSRFPreventionObject = new Object();
	if (localStorage['mobileSessionId']) {
		CSRFPreventionObject['mobileSessionId'] = localStorage['mobileSessionId'];
	} else {
		console.error("Missing mobileSessionId for CSRF protection");
	}

	return $.extend(CSRFPreventionObject, data);
}
