define(['require', 'exports', 'module', 'store', 'jstzdetect', 'exoskeleton', 'views/AlertView'],
	function(require, exports, module, store, jstz, exoskeleton, AlertView) {
		'use strict';
		var Engine = require('famous/core/Engine');
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
			if (!options || options == '') {
				return false;
			}

			if (_.isString(options)) {
				options = {
					message: options
				};
			}
			var alert = new AlertView(options);
			u.alertViewsOpen.push(alert);
			if (typeof cordova	!== 'undefined') {
				cordova.plugins.Keyboard.close();
			}
			return alert;
		};

		Utils.closeAlerts = function() {
			_.each(u.alertViewsOpen, function(view) {
				view.controller.hide(null, function() {
					if (this.options.onHide) {
						this.options.onHide();
					}
				}.bind(view));
				view.removeHandler();
			});
			u.alertViewsOpen = [];
		};

		Utils.isOnline = function() {

			if (typeof cordova == 'undefined') {
				return window.navigator.onLine;
			}

			var networkState = navigator.connection.type;
			return networkState !== Connection.NONE;
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
		};

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
		};

		Utils.backgroundPostJSON = function(description, url, args, successCallback, failCallback, delay) {
			u.queueJSON(description, url, args, successCallback, failCallback, delay, true, true);
		};

		Utils.queuePostJSON = function(description, url, args, successCallback, failCallback, delay) {
			u.queueJSON(description, url, args, successCallback, failCallback, delay, true, false);
		};

		Utils.queueJSON = function(description, url, args, successCallback, failCallback, delay, post, background) {
			u.queueJSONAll(description, url, args, successCallback, failCallback, delay, post ? {requestMethod: 'POST'} : {requestMethod: 'GET'}, background);
		};

		Utils.queueJSONAll = function(description, url, args, successCallback, failCallback, delay, httpArgs, background) {
			if (u.isOnline()) {
				/*
				 * Searching for current page in pageMap instead of calling getCurentView() so that it does not try to
				 * create new instance of view if view does not exist
				 */
				var currentView = App.pageView.pageMap[App.pageView.getCurrentPage()];
				if (currentView) {
					currentView.noInternetRenderController.hide();
				}
			}
			var currentLoginSession = u._loginSessionNumber; // cache current login session
			var stillRunning = true;
			var alertShown = false;
			var requestMethod = (httpArgs.requestMethod || 'get').toUpperCase();
			var contentType;
			var processData;

			if (httpArgs.contentType == false) {
				contentType = httpArgs.contentType;
			} else {
				contentType = (requestMethod == 'PUT') ? 'application/json; charset=UTF-8' : 'application/x-www-form-urlencoded; charset=UTF-8'
			}

			if (httpArgs.processData == false) {
				processData = httpArgs.processData;
			} else {
				processData = true;
			}

			window.setTimeout(function() {
				if (stillRunning) {
					stillRunning = false;
					if (!background) {
						u.showAlert(description + ": in progress");
					}
				}
			}, 6000);

			setTimeout(function () {
				if (!u.isOnline()) {
					App.pageView.getCurrentView().showNoInternetSurface();
				}
			}, 12000);

			if (typeof args == "function") {
				background = requestMethod;
				requestMethod = delay;
				delay = failCallback;
				failCallback = successCallback;
				successCallback = args;
				args = undefined;
			}
			requestMethod = requestMethod || 'GET';

			if (url.indexOf('dateToken=') < 0) {
				if (url.indexOf('?') < 0) {
					url += '?dateToken=' + new Date().getTime();
				} else {
					url += '&dateToken=' + new Date().getTime();
				}
			}

			var wrapSuccessCallback = function(data, msg) {
				u.spinnerStop();
				stillRunning = false;
				if (alertShown)
					u.closeAlerts();
				if (currentLoginSession != u._loginSessionNumber)
					return; // if current login session is over, cancel callbacks

				try {
					if (u.checkData(data) && successCallback) {
						successCallback(data);
					}
				} catch (error) {
					u.showAlert('Some error occured while ' + description);
					console.error(error);
				} finally {
					u.nextJSONCall(background);
				}
			};
			var wrapFailCallback = function(data, msg) {
				stillRunning = false;
				u.spinnerStop();
				if (alertShown)
					u.closeAlerts();
				if (currentLoginSession != u._loginSessionNumber)
					return; // if current login session is over, cancel callbacks

				try {
					if (u.checkData(data) && failCallback) {
						failCallback(data);
					}
				} catch (error) {
					u.showAlert('Some error occured while ' + description);
					console.error(error);
				} finally {
					u.nextJSONCall(background);
					if (msg == "timeout") {
						if (delay * 2 > 1000000) { // stop retrying after delay too large
							console.log('server down...');
							u.showAlert("Server down... giving up");
							return;
						}
						if (!(delay > 0) && !background) {
							u.showAlert("Server not responding... retrying " + description);
						}
						delay = (delay > 0 ? delay * 2 : 5000);
						window.setTimeout(function() {
							u.queueJSONAll(description, url, args, successCallback, failCallback, delay, httpArgs, background);
						}, delay);
					}
				}
			};
			if ((!background) && ((u.numJSONCalls > 0) || !u.isOnline())) { // json call in progress
				if (!u.isOnline()) {
					wrapFailCallback({}, 'timeout');
				} else {
					var jsonCall = function() {
						$.ajax({
							type: requestMethod,
							dataType: "json",
							contentType: (requestMethod == 'PUT') ? 'application/json; charset=UTF-8' : 'application/x-www-form-urlencoded; charset=UTF-8',
							url: url,
							data: args,
							timeout: 20000 + (delay > 0 ? delay : 0)
						})
							.done(wrapSuccessCallback)
							.fail(wrapFailCallback);
					};
					++u.numJSONCalls;
					u.pendingJSONCalls.push(jsonCall);
				}
			} else { // first call
				if (!background) {
					++u.numJSONCalls;
				}

				if (!background) {
					u.spinnerStart();
				}
				$.ajax({
					type: requestMethod,
					dataType: "json",
					contentType: contentType,
					processData: processData,
					url: url,
					data: args,
					timeout: 20000 + (delay > 0 ? delay : 0)
				})
				.done(wrapSuccessCallback)
				.fail(wrapFailCallback);
			}
		};

		Utils.nextJSONCall = function(background) {
			if (!background) {
				--u.numJSONCalls;
				if (u.numJSONCalls < 0)
					u.numJSONCalls = 0;
				if (u.pendingJSONCalls.length > 0) {
					var nextCall = u.pendingJSONCalls.shift();
					nextCall();
				}
			}
		};
		Utils.backgroundJSON = function(description, url, args, successCallback, failCallback, delay, post) {
			u.queueJSON(description, url, args, successCallback, failCallback, delay, post, true);
		};

		Utils.clearJSONQueue = function() {
			u.numJSONCalls = 0;
			u.pendingJSONCalls = [];
		};

		/*
		 * This method reloads DOM with images in it to
		 * get actual size of the surface in scroll view
		 *
		 */
		Utils.reloadDOMWithImage = function(domContainerId, currentSurface, callback) {
			var addListener = function() {
				var containerDOM = document.getElementsByClassName(domContainerId)[0];
				if (typeof containerDOM === 'undefined') {
					setTimeout(addListener.bind(this), 100);
				} else {
					var images = containerDOM.getElementsByTagName('img');
					_.each(images, function(image) {
						image.addEventListener('load', function(e) {
							var documentHeight = document.getElementsByClassName(domContainerId)[0].offsetHeight;
							currentSurface.setSize([undefined, documentHeight]);
							if (callback) {
								callback();
							}
						}.bind(this));
					}.bind(this));
				}
			};
			addListener.call(this);
		};

		/**
		 * A method which returns an string representation of an url containing parameters
		 * related to CSRF prevention. This is useful to concate url in any url string of ajax call,
		 * @param key unique string which is passed in jqCSRFToken tag to create token.
		 * @param prefix any string to append before generated url like: <b>&</b>.
		 * @returns string representation of CSRF parameters.
		 */
		Utils.getCSRFPreventionURI = function(key) {
			var App = window.App;
			var mobileSessionId = store.get('mobileSessionId');
			var preventionURI;
			if (mobileSessionId) {
				preventionURI = "mobileSessionId=" + mobileSessionId;
			} else {
				console.error("Missing mobileSessionId for CSRF protection");
			}
			return preventionURI;
		};

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
		};

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
					User.logout(function() {
						App.pageView.changePage('LoginView');
					});
				}
				return false;
			}
			if (data == 'success') {
				if (successMessage && status != 'cached')
					u.showAlert(successMessage);
				return true;
			}
			if (data == 'refresh') {
				u.showAlert("Server timeout, refreshing page.");
				location.reload();
				return false;
			}
			if (typeof(data) == 'string') {
				if (status != 'cached' && data != "") {
					u.showAlert(data);
				}
				return false;
			}
			return true;
		};

		Utils.isLoggedIn = function() {
			return store.get('mobileSessionId') != null;
		};

		Utils.makeGetUrl = function(action, controller) {
			if (controller) {
				return u.getServerUrl() + '/' + controller + '/' + action + '?callback=?';
			}
			return u.getServerUrl() + '/mobiledata/' + action + '?callback=?';
		};

		Utils.spinnerStart = function () {
			App.pageView.spinnerView.show();
		};

		Utils.spinnerStop = function () {
			App.pageView.spinnerView.hide();
		};

		Utils.makeGetArgs = function(args) {
			args['mobileSessionId'] = store.get('mobileSessionId');

			return args;
		};

		Utils.makePostUrl = function(action, controller) {
			if (controller) {
				return u.getServerUrl() + '/' + controller + '/' + action;
			}
			return u.getServerUrl() + "/mobiledata/" + action;
		};

		Utils.makePostArgs = function(args) {
			args['mobileSessionId'] = store.get('mobileSessionId');

			return args;
		};

		Utils.makePlainUrl = function(url) {
			var url = u.getServerUrl() + "/mobile/" + url;
			url = url;
			return url;
		};

		/*
		 * HTML escape utility methods
		 */
		Utils.escapeHTML = function(str) {
			return ('' + str).replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/  /g, '&nbsp;&nbsp;');
		};

		Utils.addSlashes = function(str) {
			return str.replace(/\'/g, '\\\'').replace(/\"/g, '\\"')
				.replace(/\\/g, '\\\\').replace(/\0/g, '\\0');
		};


		Utils.formatAmount = function(amount, amountPrecision) {
			if (amount == null) return " ___";
			if (amountPrecision < 0) return "";
			if (amountPrecision == 0) {
				return amount ? " yes" : " no";
			}
			return " " + amount;
		};

		Utils.getWindowSize = function() {
			var mainContext = window.mainContext;
			return mainContext.getSize();
		};

		Utils.getMobileSessionId = function() {
			return store.get('mobileSessionId');
		};

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
		};

		Utils.mmddyy = function(date) {
			return (date.getDate() + date.getMonth() + 1) + '/' + '/' + date.getFullYear()
		};

		Utils.formatAMPM = function formatAMPM(date) {
			var hours = date.getHours();
			var minutes = date.getMinutes();
			var ampm = hours >= 12 ? 'pm' : 'am';
			hours = hours % 12;
			hours = hours ? hours : 12; // the hour '0' should be '12'
			minutes = minutes < 10 ? '0' + minutes : minutes;
			var strTime = hours + ':' + minutes + ' ' + ampm;
			return strTime;
		};

		Utils.parseNewLine = function(text) {
			if (!text) {
				return '';
			}
			var lines = text.split("\n");
			var parsedText = '';
			_.each(lines, function(line) {
				if (line) {
					parsedText += '<div>' + Utils.escapeHTML(line) + '</div>'
				}
			});
			return parsedText || text;
		};

		Utils.parseDivToNewLine = function(text) {
			if (!text) {
				return '';
			}
			var parsedText = text.replace(/<div>/g, '').replace(/<\/div>/g, "\n").replace(/^\s+|\s+$/g, '');;
			return parsedText;
		};

		Utils.oauththirdparty = function(actionName, callback) {
			u.oauthWindow = window.open(App.serverUrl + '/home/' + actionName + '?mobileRequest=1&mobileSessionId=' + u.getMobileSessionId(), '_blank');
			u.oauthWindow.addEventListener('loadstart', u.checkAuthentication);
		};

		Utils.checkAuthentication = function(e) {
			var successIndex = e.url.indexOf('success=true');
			var failureIndex = e.url.indexOf('success=false');
			var homeRedirectOnDeny = e.url.indexOf(App.serverUrl + '/home/login') >= 0;
			if (successIndex >= 0 || failureIndex >= 0 || homeRedirectOnDeny) {
				u.oauthWindow.removeEventListener('loadstart', u.checkAuthentication);
				u.oauthWindow.close();
				App.pageView.getCurrentView().showProfile();
				if (!homeRedirectOnDeny) {
					var message = decodeURI(e.url.split("message=")[1]);
					u.showAlert(message);
				}
			}
		};

		Utils.isAndroid = function() {
			if (typeof device === 'undefined') {
				return;
			}

			return device.platform == 'android' || device.platform == 'Android';
		};

		Utils.isIOS = function() {
			if (typeof device === 'undefined') {
				return;
			}

			return device.platform == 'ios' || device.platform == 'iOS';
		};

		/**
		* @param {String} HTML representing a single element
		* @return {Element}
		*/
		Utils.htmlToElement = function(html) {
			var template = document.createElement('template');
			template.innerHTML = html;
			return template.content.firstChild;
		};

		Utils.setCursorAtEnd = function(inputElement) {
			var value = inputElement.value;
			inputElement.focus();
			setTimeout(function() {
				inputElement.value = '';
				inputElement.value = value;
			}, 5);
		};

		var device = {};
		if (/iPhone|iPod|iPad/i.test(navigator.userAgent)) {
			device.platform = "ios"
		} else if (/Android/i.test(navigator.userAgent)) {
			device.platform = "android"
		}

		/**
		* This method add generated event of users in google analytics page for analysis purpose.
		*/
		Utils.saveEventForAnalysis = function(catagory, action, label, value, successlog) {
			if(window.ga) {
				window.ga.trackView('Precise.ly Mobile')
				window.ga.trackEvent(catagory, action, label, value , true,
						function() {
							console.log(successlog);
						}.bind(this),
						function() {
							console.log('Error to add event.');
						}.bind(this)
				)}
			};

		module.exports = Utils;
	});
