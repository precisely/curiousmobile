define(['require', 'exports', 'module', 'store', 'jstzdetect', 'exoskeleton', 'views/AlertView'],
	function(require, exports, module, store, jstz, exoskeleton, AlertView) {
		'use strict';
		var Utils = {};
		var u = Utils;

		u.numJSONCalls = 0;
		u.pendingJSONCalls = [];
		u.alertViewsOpen = [];


		// Base Javascript library extensions
		Utils.getServerUrl = function() {
			return window.App.serverUrl;
		};

		Utils.showAlert = function(options) {
			if (_.isString(options)) {
				options = {
					message: options
				};
			}
			var alert = new AlertView(options);
			u.alertViewsOpen.push(alert);
			return alert;
		};

		Utils.closeAlerts = function() {
			_.each(u.alertViewsOpen, function(view) {
				view.controller.hide();
			});
		};

		Utils.isOnline = function() {
			return window.navigator.onLine;
		};

		Utils.supportsLocalStorage = function() {
			try {
				return 'localStorage' in window && window.localStorage !== null;
			} catch (e) {
				return false;
			}
		};

		// flag to determine whether the system is ready to submit data
		u.dataReady = false;

		u.dataReadyCallbacks = [];

		Utils.addDataReadyCallback = function(closure) {
			console.log('Adding dataReady callback');
			u.dataReadyCallbacks.push(closure);
		};

		Utils.callDataReadyCallbacks = function() {
			console.log('Calling dataReadyCallbacks');
			for (var i in u.dataReadyCallbacks) {
				console.log('Calling dataReadyCallback ' + i);
				u.dataReadyCallbacks[i]();
			}

			u.dataReadyCallbacks = [];
		};

		Utils.clearDataReadyCallbacks = function() {
			u.dataReadyCallbacks = [];
		};


		/*
		* Logout callbacks; register callbacks to be called when user logs out
		*/
		u._logoutCallbacks = [];

		u._loginSessionNumber = 0;

		Utils.registerLogoutCallback = function(closure) {
			u._logoutCallbacks.push(closure);
		};

		Utils.callLogoutCallbacks = function() {
			for (var i in u._logoutCallbacks) {
				u._logoutCallbacks[i]();
			}
			u.clearJSONQueue();
			++u._loginSessionNumber;
		};

		/*
		* Add universal startsWith method to all String classes
		*/
		String.prototype.startsWith = function(str) {
			return this.substring(0, str.length) === str;
		};

		String.prototype.endsWith = function(str) {
			return this.length >= str.length && this.substr(this.length - str.length) === str;
		};

		/*
		* Low-level utility methods
		*/
		Utils.arrayEmpty = function(arr) {
			for (var i in arr) {
				return false;
			}

			return true;
		};

		Utils.removeElem = function(arr, elem) {
			return jQuery.grep(arr, function(v) {
				return v !== elem;
			});
		};

		/*
		* Number/date formatting
		*/
		Utils.isNumeric = function(str) {
			var chars = '0123456789.+-';

			for (i = 0; i < str.length; i++) {
				if (chars.indexOf(str.charAt(i)) == -1)
					return false;
			}
			return true;
		};

		Utils.dateToTime = function(date) {
			if (typeof(date) == 'string') {
				return Date.parse(date);
			}
			return date.getTime();
		}

		Utils.dateToTimeStr = function(d, shortForm) {
			var ap = "";
			var hour = d.getHours();
			if (hour < 12)
				ap = "am";
			else
				ap = "pm";
			if (hour === 0) {
				hour = 12;
			}
			if (hour > 12) {
				hour = hour - 12;
			}

			var min = d.getMinutes();

			if (shortForm && min === 0) {
				return hour + ap;
			}

			min = min + '';

			if (min.length == 1)
				min = '0' + min;

			return hour + ':' + min + ap;
		};

		//var DateUtil = new function() {
			Utils.DateUtil = function() {
				this.now = new Date();
			};

			Utils.DateUtil.prototype.getDateRangeForToday = function() {
				var now = this.now;
				var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
				var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
				return {
					start: start,
					end: end
				}
			};

			Utils.getMidnightDate = function(date) {
				var start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
				return start;
			};

			Utils.getTimezone = function() {
				return window.jstz.determine().name();
			}

			Utils.backgroundPostJSON = function(description, url, args, successCallback, failCallback, delay) {
				u.queueJSON(description, url, args, successCallback, failCallback, delay, true, true);
			}

			Utils.queuePostJSON = function(description, url, args, successCallback, failCallback, delay) {
				u.queueJSON(description, url, args, successCallback, failCallback, delay, true, false);
			}

			Utils.queueJSON = function(description, url, args, successCallback, failCallback, delay, post, background) {
				var currentLoginSession = u._loginSessionNumber; // cache current login session
				var stillRunning = true;
				var alertShown = false;
				window.setTimeout(function() {
					if (stillRunning) {
						stillRunning = false;
						window.location.reload();
					}
				}, 10000);
				if (typeof args == "function") {
					delay = failCallback;
					failCallback = successCallback
					successCallback = args;
					args = undefined;
				}
				if (args == undefined || args == null) {
					args = {
						dateToken: new Date().getTime()
					};
				} else if (!args['dateToken']) {
					args['dateToken'] = new Date().getTime();
				}
				var wrapSuccessCallback = function(data, msg) {
					stillRunning = false;
					if (alertShown)
						u.closeAlerts();
					if (currentLoginSession != u._loginSessionNumber)
						return; // if current login session is over, cancel callbacks
					if (successCallback)
						successCallback(data);
					u.nextJSONCall(background);
				};
				var wrapFailCallback = function(data, msg) {
					stillRunning = false;
					if (alertShown)
						u.closeAlerts();
					if (currentLoginSession != u._loginSessionNumber)
						return; // if current login session is over, cancel callbacks
					if (failCallback)
						failCallback(data);

					u.nextJSONCall(background);
					if (msg == "timeout") {
						if (delay * 2 > 1000000) { // stop retrying after delay too large
							console.log('server down...');
							u.showAlert("Server down... giving up");
							return;
						}
						if (!(delay > 0))
							u.showAlert("Server not responding... retrying " + description);
						delay = (delay > 0 ? delay * 2 : 5000);
						window.setTimeout(function() {
							u.queueJSON(description, url, args, successCallback, failCallback, delay, background);
						}, delay);
					}
				};
				if ((!background) && (u.numJSONCalls > 0)) { // json call in progress
					var jsonCall = function() {
						$.ajax({
							type: (post ? "post" : "get"),
							dataType: "json",
							url: url,
							data: args,
							timeout: 20000 + (delay > 0 ? delay : 0)
						})
						.done(wrapSuccessCallback)
						.fail(wrapFailCallback);
					};
					++u.numJSONCalls;
					u.pendingJSONCalls.push(jsonCall);
				} else { // first call
					if (!background)
						++u.numJSONCalls;
					$.ajax({
						type: (post ? "post" : "get"),
						dataType: "json",
						url: url,
						data: args,
						timeout: 20000 + (delay > 0 ? delay : 0)
					})
					.done(wrapSuccessCallback)
					.fail(wrapFailCallback);
				}
			}

			Utils.nextJSONCall = function (background) {
				if (!background) {
					--u.numJSONCalls;
					if (u.numJSONCalls < 0)
						u.numJSONCalls = 0;
					if (u.pendingJSONCalls.length > 0) {
						var nextCall = u.pendingJSONCalls.shift();
						nextCall();
					}
				}
			}
			Utils.backgroundJSON = function(description, url, args, successCallback, failCallback, delay, post) {
				u.queueJSON(description, url, args, successCallback, failCallback, delay, post, true);
			}

			Utils.clearJSONQueue = function() {
				u.numJSONCalls = 0;
				u.pendingJSONCalls = [];
			}


			/**
			* A method which returns an string representation of an url containing parameters
			* related to CSRF prevention. This is useful to concate url in any url string of ajax call,
			* @param key unique string which is passed in jqCSRFToken tag to create token.
			* @param prefix any string to append before generated url like: <b>&</b>.
			* @returns string representation of CSRF parameters.
			*/
			Utils.getCSRFPreventionURI = function(key) {
				var App = window.App;
				var preventionURI = App.CSRF.SyncTokenKeyName + "=" + App.CSRF[key] + "&" + App.CSRF.SyncTokenUriName + "=" + key;
				if (App.CSRF[key] == undefined) {
					console.error("Missing csrf prevention token for key", key);
				}
				return preventionURI;
			}

			/**
			* A method which returns an object containing key & its token based on given key.
			* This is useful to be easily passed in some jQuery methods like <b>getJSON</b>,
			* which accepts parameters to be passed as Object.
			* @param key unique string which is passed in jqCSRFToken tag to create token.
			* @param data optional object to attach to new object using jQuery's extend method.
			* @returns the object containing parameters for CSRF prevention.
			*/
			Utils.getCSRFPreventionObject = function(key, data) {
				var CSRFPreventionObject = new Object();
				var mobileSessionId = store.get('mobileSessionId');
				if (mobileSessionId) {
					CSRFPreventionObject['mobileSessionId'] = mobileSessionId;
				} else {
					console.error("Missing mobileSessionId for CSRF protection");
				}

				return $.extend(CSRFPreventionObject, data);
			}

			/*
			* Curious data json return value check
			*/
			Utils.checkData = function(data, status, errorMessage, successMessage) {
				var User = require('models/User');
				if (data == 'error') {
					if (errorMessage && status != 'cached')
						u.showAlert(errorMessage);
					return false;
				}
				if (data == 'login') {
					if (status != 'cached') {
						u.showAlert("Session timed out.");
						App.pageView.changePage('launch');
						User.logout();
					}
					return false;
				}
				if (data == 'success') {
					if (successMessage && status != 'cached')
						u.showAlert(successMessage);
					return true;
				}
				if (data == 'refresh') {
					u.showAlert("Server timeout, refreshing page.")
					refreshPage();
					return false;
				}
				if (typeof(data) == 'string') {
					if (status != 'cached' && data != "") {
						u.showAlert(data);
						location.reload(true);
					}
					return false;
				}
				return true;
			}

			Utils.isLoggedIn = function() {
				return store.get('mobileSessionId') != null;
			}

			Utils.makeGetUrl = function(url) {
				return u.getServerUrl() + "/mobiledata/" + url + '?callback=?';
			}

			Utils.makeGetArgs = function(args) {
				args['mobileSessionId'] = store.get('mobileSessionId');

				return args;
			}

			Utils.makePostUrl = function(url) {
				return u.getServerUrl() + "/mobiledata/" + url;
			}

			Utils.makePostArgs = function(args) {
				args['mobileSessionId'] = store.get('mobileSessionId');

				return args;
			}

			Utils.makePlainUrl = function(url) {
				var url = u.getServerUrl() + "/mobile/" + url;
				url = url;
				return url;
			}

			/*
			* HTML escape utility methods
			*/
			Utils.escapeHTML = function(str) {
				return ('' + str).replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/  /g, '&nbsp;&nbsp;');
			}

			Utils.addSlashes = function(str) {
				return str.replace(/\'/g, '\\\'').replace(/\"/g, '\\"')
				.replace(/\\/g, '\\\\').replace(/\0/g, '\\0');
			}


			Utils.formatAmount = function(amount, amountPrecision) {
				if (amount == null) return " ___";
				if (amountPrecision < 0) return "";
				if (amountPrecision == 0) {
					return amount ? " yes" : " no";
				}
				return " " + amount;
			}

			Utils.getWindowSize = function() {
				var mainContext = window.mainContext;
				return mainContext.getSize();
			}

			Utils.prettyDate = function prettyDate(time) {
				var date = time,
				diff = (((new Date()).getTime() - date.getTime()) / 1000),
				day_diff = Math.floor(diff / 86400);

				if (isNaN(day_diff) || day_diff < 0)
					return;

				if (day_diff >= 31) {
					return date.getMonth() + '/' + date.getDate() + '/' + date.getFullYear();	
				}

				return day_diff == 0 && (
					diff < 60 && "just now" ||
					diff < 120 && "1 minute ago" ||
					diff < 3600 && Math.floor(diff / 60) + " minutes ago" ||
					diff < 7200 && "1 hour ago" ||
					diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
					day_diff == 1 && "Yesterday" ||
					day_diff < 7 && day_diff + " days ago" ||
					day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago";
			}

			Utils.mmddyy = function (date) {
				return (date.getDate() + date.getMonth() + 1) + '/' + '/' +  date.getFullYear()
			}

			Utils.formatAMPM = function formatAMPM(date) {
				var hours = date.getHours();
				var minutes = date.getMinutes();
				var ampm = hours >= 12 ? 'pm' : 'am';
				hours = hours % 12;
				hours = hours ? hours : 12; // the hour '0' should be '12'
				minutes = minutes < 10 ? '0'+minutes : minutes;
				var strTime = hours + ':' + minutes + ' ' + ampm;
				return strTime;
			}

			Utils.isAndroid = function() {
				console.log('checking if android....' + device.platform);
				return device.platform == 'android' || device.platform == 'Android';
			}
			var device = {};
			if (/iPhone|iPod|iPad/i.test(navigator.userAgent)) {
			    device.platform = "ios"
			} else if (/Android/i.test(navigator.userAgent)) {
			    device.platform = "android"
			}

			module.exports = Utils;
	});
