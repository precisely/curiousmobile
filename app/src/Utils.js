define(function(require, exports, module) {
	'use strict';
	var Utils = {};
	// Base Javascript library extensions

	 Utils.isOnline = function() {
		return window.navigator.onLine;
	}

	Utils.supportsLocalStorage = function() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			return false;
		}
	}

	/*
	 * Logout callbacks; register callbacks to be called when user logs out
	 */
	var _logoutCallbacks = [];

	var _loginSessionNumber = 0;

	Utils.registerLogoutCallback = function(closure) {
		_logoutCallbacks.push(closure);
	}

	Utils.callLogoutCallbacks = function() {
		for (var i in _logoutCallbacks) {
			_logoutCallbacks[i]();
		}
		clearJSONQueue();
		++_loginSessionNumber;
	}

	/*
	 * Add universal startsWith method to all String classes
	 */
	String.prototype.startsWith = function(str) {
		return this.substring(0, str.length) === str;
	}
	String.prototype.endsWith = function(str) {
		return this.length >= str.length && this.substr(this.length - str.length) == str;
	}

	/*
	 * Low-level utility methods
	 */
	Utils.arrayEmpty = function(arr) {
		for (var i in arr) {
			return false;
		}

		return true;
	}

	Utils.removeElem = function(arr, elem) {
		return jQuery.grep(arr, function(v) {
			return v != elem;
		});
	}

	/*
	 * Number/date formatting
	 */
	Utils.isNumeric = function(str) {
		var chars = "0123456789.+-";

		for (i = 0; i < str.length; i++)
			if (chars.indexOf(str.charAt(i)) == -1)
				return false;
		return true;
	}

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
		if (hour == 0)
			hour = 12;
		if (hour > 12)
			hour = hour - 12;

		var min = d.getMinutes();

		if (shortForm && min == 0) {
			return hour + ap;
		}

		min = min + "";

		if (min.length == 1)
			min = "0" + min;

		return hour + ":" + min + ap;
	}

	//var DateUtil = new function() {
	Utils.DateUtil = function() {
		this.now = new Date();
	}

	Utils.DateUtil.prototype.getDateRangeForToday = function() {
		var now = this.now;
		var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
		var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
		return {
			start: start,
			end: end
		}
	}

	var numJSONCalls = 0;
	var pendingJSONCalls = [];

	Utils.backgroundPostJSON = function(description, url, args, successCallback, failCallback, delay) {
		queueJSON(description, url, args, successCallback, failCallback, delay, true, true);
	}

	Utils.queuePostJSON = function(description, url, args, successCallback, failCallback, delay) {
		queueJSON(description, url, args, successCallback, failCallback, delay, true, false);
	}

	Utils.queueJSON = function(description, url, args, successCallback, failCallback, delay, post, background) {
		var currentLoginSession = _loginSessionNumber; // cache current login session
		var stillRunning = true;
		var alertShown = false;
		window.setTimeout(function() {
			if (stillRunning) {
				alertShown = true;
				showAlert(description + ": in progress");
			}
		}, 4000);
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
				closeAlert();
			if (currentLoginSession != _loginSessionNumber)
				return; // if current login session is over, cancel callbacks
			if (successCallback)
				successCallback(data);
			if (!background) {
				--numJSONCalls;
				if (numJSONCalls < 0)
					numJSONCalls = 0;
				if (pendingJSONCalls.length > 0) {
					var nextCall = pendingJSONCalls.shift();
					nextCall();
				}
			}
		};
		var wrapFailCallback = function(data, msg) {
			stillRunning = false;
			if (alertShown)
				closeAlert();
			if (currentLoginSession != _loginSessionNumber)
				return; // if current login session is over, cancel callbacks
			if (failCallback)
				failCallback(data);
			if (!background) {
				--numJSONCalls;
				if (numJSONCalls < 0)
					numJSONCalls = 0;
				if (pendingJSONCalls.length > 0) {
					var nextCall = pendingJSONCalls.shift();
					nextCall();
				}
			}
			if (msg == "timeout") {
				if (delay * 2 > 1000000) { // stop retrying after delay too large
					showAlert("Server down... giving up");
					return;
				}
				if (!(delay > 0))
					showAlert("Server not responding... retrying " + description);
				delay = (delay > 0 ? delay * 2 : 5000);
				window.setTimeout(function() {
					queueJSON(description, url, args, successCallback, failCallback, delay, background);
				}, delay);
			}
		};
		if ((!background) && (numJSONCalls > 0)) { // json call in progress
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
			++numJSONCalls;
			pendingJSONCalls.push(jsonCall);
		} else { // first call
			if (!background)
			++numJSONCalls;
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

	Utils.backgroundJSON = function(description, url, args, successCallback, failCallback, delay, post) {
		queueJSON(description, url, args, successCallback, failCallback, delay, post, true);
	}

	Utils.clearJSONQueue = function() {
		numJSONCalls = 0;
		pendingJSONCalls = [];
	}

	var App = {};
	App.CSRF = {};
	App.CSRF.SyncTokenKeyName = "SYNCHRONIZER_TOKEN"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_KEY
	App.CSRF.SyncTokenUriName = "SYNCHRONIZER_URI"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_URI
	window.App = App;

	/**
	 * A method which returns an string representation of an url containing parameters
	 * related to CSRF prevention. This is useful to concate url in any url string of ajax call,
	 * @param key unique string which is passed in jqCSRFToken tag to create token.
	 * @param prefix any string to append before generated url like: <b>&</b>.
	 * @returns string representation of CSRF parameters.
	 */
	Utils.getCSRFPreventionURI = function(key) {
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
		if (App.CSRF[key]) {
			CSRFPreventionObject[App.CSRF.SyncTokenKeyName] = App.CSRF[key];
		} else {
			console.error("Missing csrf prevention token for key", key);
		}
		CSRFPreventionObject[App.CSRF.SyncTokenUriName] = key;

		return $.extend(CSRFPreventionObject, data);
	}

	// Singleton Class function.
	Utils.RepeatType = new function() {
			this.CONTINUOUS_BIT = 0x100;
			this.GHOST_BIT = 0x200;
			this.CONCRETEGHOST_BIT = 0x400;
			this.TIMED_BIT = 0x1 | 0x2 | 0x4;
			this.REPEAT_BIT = 0x1 | 0x2;
			this.REMIND_BIT = 0x4;

			this.isConcreteGhost = function(repeatType) {
				return (repeatType & this.CONCRETEGHOST_BIT) != 0;
			}
			this.isContinuous = function(repeatType) {
				return (repeatType & this.CONTINUOUS_BIT) != 0;
			}
			this.isGhost = function(repeatType) {
				return (repeatType & this.GHOST_BIT) != 0;
			}
			this.isRemind = function(repeatType) {
				return (repeatType & this.REMIND_BIT) != 0;
			}
			this.isRepeat = function(repeatType) {
				return (repeatType & this.REPEAT_BIT) != 0;
			}
			this.isTimed = function(repeatType) {
				return (repeatType & this.TIMED_BIT) != 0;
			}
		}

	module.exports = Utils;
});
