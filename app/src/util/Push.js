define(function(require, exports, module) {
	var IOS_DEVICE = 1;
	var ANDROID_DEVICE = 2;
	var u = require('util/Utils');
	var store = require('store');

	var push= {
		// push.ication Constructor
		registerNotification: function() {
			console.log("Registering Notification for "+device.platform);
			var pushNotification = window.plugins.pushNotification;
			console.log("Checking device type");
			if (u.isAndroid()) {
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
		unregisterNotification: function(user) {
			console.log("Unregistering push notification");
			var pushNotification = window.plugins.pushNotification;
			pushNotification.unregister(function() { 
				console.log("Unregistered Notification");
				var token;
				if (u.supportsLocalStorage()) {
					token = localStorage['pushNotificationToken'];
				} else {
					token = push.pushNotificationToken;
				}

				var user = store.get('user');
				var argsToSend = u.getCSRFPreventionObject('registerForPushNotificationCSRF', 
					{userId:user.id, token:token,deviceType:push.deviceType()});
					$.getJSON(u.makeGetUrl("unregisterPushNotificationData"), argsToSend,
					function(data){
						store.set('mobileSessionId', undefined);
						store.set('user', undefined);
						if (u.checkData(data)) {
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
			event.pushNotification = true;
			event.entryDate = new Date(event.entryDate);
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
			var user = store.get('user');	
			var argsToSend = u.getCSRFPreventionObject('registerForPushNotificationCSRF', 
				{userId:user.id, token:token,deviceType:push.deviceType()});
				$.getJSON(u.makeGetUrl("registerForPushNotificationData"), argsToSend,
				function(data){
					if (u.checkData(data)) {
						console.log("Notification token saved on the server")
					}
				});    	
				console.log("Regid " + token);
				push.pushNotificationToken = token;
				if (u.supportsLocalStorage()) {
					localStorage['pushNotificationToken'] = token;
				}
		},

		deviceType: function() {
			return u.isAndroid()?ANDROID_DEVICE:IOS_DEVICE;
		},
		isIOS: function() {
			return device.platform == 'ios' || device.platform == 'iOS';
		}

	};

	module.exports = push;
});
