// Base Javascript library extensions

/*requirejs(['Utils'], function(u) {
	showAlert = function (alertMessage) {
		u.showAlert(alertMessage);
	};

	queuePostJSON = function (description, url, args, successCallback, failCallback, delay) {
		u.queuePostJSON(description, url, args, successCallback, failCallback, delay);
	};

	queueJSON = function (description, url, args, successCallback, failCallback, delay, post, background) {
		u.queueJSON(description, url, args, successCallback, failCallback, delay, post, background);
	}

	makeGetUrl = function (url) {
		return u.makeGetUrl(url);
	}

	getCSRFPreventionObject = function (key, data) {
		return u.getCSRFPreventionObject(key, data);
	}

	makePlainUrl = function (url) {
		return u.makePlainUrl(url);
	}

	makePostUrl = function (url) {
		return u.makePostUrl(url);
	}

	checkData = function (data, status, errorMessage, successMessage) {
		return u.checkData(data, status, errorMessage, successMessage);
	}

	makeGetArgs = function (args) {
		return u.makeGetArgs(args);
	}

	backgroundJSON = function(description, url, args, successCallback, failCallback, delay, post) {
		u.backgroundJSON(description, url, args, successCallback, failCallback, delay, post)
	}
});*/
function isOnline() {
	return window.navigator.onLine;
}

function supportsLocalStorage() {
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

function registerLogoutCallback(closure) {
	_logoutCallbacks.push(closure);
}

function callLogoutCallbacks() {
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

/**
 * Universal indexOf method to get index by passing regex as argument
 */
String.prototype.indexOfRegex = function(regex){
	var match = this.match(regex);
	return match ? this.indexOf(match[0]) : -1;
}
/*
 * Simple, clean Javascript inheritance scheme
 *
 * Based on: http://kevinoncode.blogspot.com/2011/04/understanding-javascript-inheritance.html
 *
 * Usage:
 *
 * function Person(age) {
 * 	this.age = age;
 * }
 *
 * function Fireman(age, station) {
 * 	Person.call(this, age);
 * 	this.station = station;
 * }
 * inherit(Fireman, Person);
 *
 * var fireman = new Fireman(35, 1001);
 * assert(fireman.age == 35);
 *
 *
 */
function inherit(subclass, superclass) {
	function TempClass() {}
	TempClass.prototype = superclass.prototype;
	var newSubPrototype = new TempClass();
	newSubPrototype.constructor = subclass;
	subclass.prototype = newSubPrototype;
}

/*
 * HTML escape utility methods
 */
function escapehtml(str) {
    return (''+str).replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/  /g,'&nbsp;&nbsp;');
}

/*
 * Low-level utility methods
 */
function arrayEmpty(arr) {
	for (var i in arr) {
		return false;
	}

	return true;
}

function removeElem(arr, elem) {
	return jQuery.grep(arr, function(v) {
		return v != elem;
	});
}

/*
 * Number/date formatting
 */
function isNumeric(str) {
	var chars = "0123456789.+-";

	for (i = 0; i < str.length; i++)
		if (chars.indexOf(str.charAt(i)) == -1)
			return false;
	return true;
}

function dateToTime(date) {
	if (typeof(date) == 'string') {
		return Date.parse(date);
	}
	return date.getTime();
}

function dateToTimeStr(d, shortForm) {
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

var numJSONCalls = 0;
var pendingJSONCalls = [];


var App = {};
App.CSRF = {};
window.App = App;
App.CSRF.SyncTokenKeyName = "SYNCHRONIZER_TOKEN"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_KEY
App.CSRF.SyncTokenUriName = "SYNCHRONIZER_URI"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_URI

/*
 * Curious data json return value check
 */
function checkData(data, status, errorMessage, successMessage) {
	if (data == 'error') {
		if (errorMessage && status != 'cached')
			showAlert(errorMessage);
		return false;
	}
	if (data == 'login') {
		if (status != 'cached') {
			showAlert("Session timed out.");
			doLogout();
			location.reload(true);
		}
		return false;
	}
	if (data == 'success') {
		if (successMessage && status != 'cached')
			showAlert(successMessage);
		return true;
	}
	if (data == 'refresh') {
		showAlert("Server timeout, refreshing page.")
		refreshPage();
		return false;
	}
	if (typeof(data) == 'string') {
		if (status != 'cached' && data != "") {
			showAlert(data);
			location.reload(true);
		}
		return false;
	}
	return true;
}

/**
 * A method used to trim a given text upto the given length including or excluding the last word at boundary.
 * For example: Trimming a string "The quick brown fox jumps over the lazy dog" with following max length should result
 * something (consider includeLastWord = false}
 *
 * Max 1:function""
 * Max 2:function""
 * Max 5:function"The"
 * Max 15:function"The quick brown"
 * Max 21:function"The quick brown fox"
 * Max 70:function"The quick brown fox jumps over the lazy dog"
 *
 * (Now consider includeLastWord = true}
 *
 * Max 1:function"The"
 * Max 2:function"The"
 * Max 5:function"The quick"
 * Max 15:function"The quick brown"
 * Max 21:function"The quick brown fox jumps"
 * Max 70:function"The quick brown fox jumps over the lazy dog"
 *
 * http://stackoverflow.com/questions/5454235/javascript-shorten-string-without-cutting-words
 */
function shorten(text, maxLength, includeLastWord) {
	if (text.length <= maxLength) {
		return text;
	}

	if (includeLastWord) {
		var regex = new RegExp("^(.{" + maxLength + "}[^\s]*).*");
		return text.replace(regex, "$1") + '...';
	} else {
		var trimmedText = text.substring(0, maxLength + 1);
		return trimmedText.substring(0, Math.min(trimmedText.length, trimmedText.lastIndexOf(" "))) + '...';
	}
}


function DateUtil() {
	this.now = new Date();
}

DateUtil.prototype.getDateRangeForToday = function() {
	var now = this.now;
	var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
	var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
	return {
		start: start,
		end: end
	}
}
