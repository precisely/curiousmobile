define(function(require, exports, module) {
	var IOS_DEVICE = 1;
	var ANDROID_DEVICE = 2;
	var u = require('util/Utils');
	var store = require('store');
	var User = require('models/User');

	var push = {};
	var pushNotification;
	window.push = push;
	push.register = function() {
		if (typeof PushNotification !== 'undefined') {
			push.pushNotification = PushNotification.init({
				android: {
					senderID: "852521907580"
				},
				ios: {
					sound: true,
					vibration: true,
					badge: true,
					clearBadge: true,
				}
			});
			PushNotification.hasPermission(function(data) {
				if (data.isEnabled) {
					console.log('PushNotification isEnabled');
					push.pushNotification.on('registration', function(data) {
						var user = store.get('user');
						var argsToSend = u.getCSRFPreventionObject('registerForPushNotificationCSRF', {
							userId: user.id,
							token: data.registrationId,
							deviceType: push.deviceType()
						});
						$.getJSON(u.makeGetUrl("registerForPushNotificationData"), argsToSend,
							function(data) {
								if (u.checkData(data)) {
									console.log("Notification token saved on the server")
								}
							});
						console.log("Regid " + data.registrationId);
						if (u.supportsLocalStorage()) {
							localStorage['pushNotificationToken'] = data.registrationId;
						}
					});

					push.pushNotification.on('notification', function(data) {
						// do something with the push data
						// then call finish to let the OS know we are done
						var keys = [];
						for (var key in data) {
							console.log("APN Event property name " + key);
							console.log("APN Event property val " + data[key]);
						}

						console.log("Entry ID: " + data.additionalData);
						var entryDate = new Date(data.additionalData.entryDate);
						data.additionalData.entryDate = entryDate;
						App.pageView.changePage('TrackView', data.additionalData);

						push.pushNotification.finish(function() {
							console.log("processing of push data is finished");
						});
					});

					push.pushNotification.on('error', function(e) {
						// e.message
						console.log('Error with push notification' + e);
					});
				}
			});
		}
	}

	push.unregister = function(argument) {
		if (typeof push.pushNotification !== 'undefined') {
			push.pushNotification.unregister(function() {
				console.log('Success: removing push notification');
				var token;
				if (u.supportsLocalStorage()) {
					token = localStorage['pushNotificationToken'];
				} else {
					token = push.pushNotificationToken;
				}

				var user = store.get('user');
				var argsToSend = u.getCSRFPreventionObject('registerForPushNotificationCSRF', {
					userId: user.id,
					token: token,
					deviceType: push.deviceType()
				});
				$.getJSON(u.makeGetUrl("unregisterPushNotificationData"), argsToSend,
					function(data) {
						if (u.checkData(data)) {
							console.log("Notification token removed from the server");
						}
						console.log("Failed to remove token from the server");
					});
				User.clearCache();
				return;
			}, function() {
				console.log('Error');
				User.clearCache();
			});
		}
	}

	push.deviceType = function() {
		return push.isAndroid() ? ANDROID_DEVICE : IOS_DEVICE;
	};

	push.isAndroid = function() {
		console.log('Device Type: ' + device.platform);
		return device.platform == 'android' || device.platform == 'Android';
	};

	push.isIOS = function() {
		return device.platform == 'ios' || device.platform == 'iOS';
	};
	module.exports = push;
});
