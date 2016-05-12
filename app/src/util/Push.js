define(function(require, exports, module) {
	var IOS_DEVICE = 1;
	var ANDROID_DEVICE = 2;
	var u = require('util/Utils');
	var store = require('store');
	var User = require('models/User');

	var push = {};
	window.push = push;

	var initOptions = {
		android: {
			senderID: '852521907580',
			iconColor: '#F98963'
		},
		ios: {
			alert: true,
			sound: true,
			vibration: true,
			badge: true,
			clearBadge: true
		}
	};

	function onRegistration(data) {
		console.log('PushPlugin: onRegistration event');

		var registrationId = data.registrationId;

		console.log('PushPlugin: Registration token ', registrationId);

		if (u.supportsLocalStorage()) {
			var token = localStorage['pushNotificationToken'];

			if (token === registrationId) {
				console.log('PushPlugin: token already registered for user');
				return;
			}
		}

		var user = store.get('user');
		var argsToSend = u.getCSRFPreventionObject('registerForPushNotificationCSRF', {
			userId: user.id,
			token: registrationId,
			deviceType: push.deviceType()
		});

		$.getJSON(u.makeGetUrl('registerForPushNotificationData'), argsToSend, function(data) {
			if (u.checkData(data)) {
				console.log('PushPlugin: Push Notification token saved on the server.');

				if (u.supportsLocalStorage()) {
					localStorage['pushNotificationToken'] = registrationId;
				}
			}
		});
	}

	function onNotification(data) {
		console.log('PushPlugin: onNotification event');

		// Payload received from the Push Notification.
		for (var key in data) {
			console.log('APN Event property name ' + key);
			console.log('APN Event property val ' + data[key]);
		}

		console.log('Entry ID: ' + data.additionalData.entryId);
		console.log('Entry Date: ' + data.additionalData.entryDate);

		data.additionalData.entryDate = new Date(data.additionalData.entryDate);
		data.additionalData.entryId = Number(data.additionalData.entryId);
		data.additionalData.isPushNotificaton = true;

		App.pageView.changePage('TrackView', data.additionalData);

		// Call finish to inform the plugin that the onNotification call was successful.
		push.pushNotification.finish(function() {
			console.log('PushPlugin: Processing of push notification data completed.');
		});
	}

	function onError(e) {
		console.log('PushPlugin: onError event' + e.message);
	}

	push.register = function() {
		var user = store.get('user');
		if ((user && user.id) && (typeof PushNotification !== 'undefined')) {

			// Initializing the PushPlugin.
			push.pushNotification = PushNotification.init(initOptions);

			// Registering the events for PushPlugin.
			push.pushNotification.on('registration', onRegistration);
			push.pushNotification.on('notification', onNotification);
			push.pushNotification.on('error', onError);
		}

		push.checkPermission();
	};

	push.unregister = function() {
		if (typeof push.pushNotification !== 'undefined') {
			push.pushNotification.unregister(function() {
				console.log('PushPlugin: Successfully removed push notifications.');

				var token;
				if (u.supportsLocalStorage()) {
					token = localStorage['pushNotificationToken'];
				}

				if (token) {
					var user = store.get('user');
					var argsToSend = u.getCSRFPreventionObject('registerForPushNotificationCSRF', {
						userId: user.id,
						token: token,
						deviceType: push.deviceType()
					});

					if (argsToSend.mobileSessionId) {
						$.getJSON(u.makeGetUrl('unregisterPushNotificationData'), argsToSend, function(data) {
							if (u.checkData(data)) {
								console.log('PushPlugin: Push Notification token removed from the server.');
							} else {
								console.log('PushPlugin: Failed to remove push notification token from the server.');
							}
						});
					}

					User.clearCache();
				}
			}, function() {
				console.log('PushPlugin: Error unregistering push notifications,hence removing the event callbacks');

				// Removing the event callbacks for PushPlugin.
				push.pushNotification.off('registration', onRegistration);
				push.pushNotification.off('notification', onNotification);
				push.pushNotification.off('error', onError);

				User.clearCache();
			});
		}
	};

	push.checkPermission = function() {
		// Checking after 30 seconds for permission, if the User denys notification permissions, then unregister.
		setTimeout(function () {
			if (typeof PushNotification !== 'undefined') {
				PushNotification.hasPermission(function (data) {
					if (data.isEnabled) {
						console.log('PushPlugin: Permission for notifications granted.');
					} else {
						console.log('PushPlugin: Permission denied, unregistering the user.');
						push.unregister();
					}
				});
			}
		}, 30000);
	};

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

	push.register();

	module.exports = push;
});
