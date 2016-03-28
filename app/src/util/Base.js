// Base Javascript library extensions

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
		return trimmedText +  '...';
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

/*
 * This method will return javascript object by mapping form input fields as name: value
 * See this for reference: http://stackoverflow.com/a/17784656/4395233
 */

function dataURItoBlob(dataURI) {
	if (!dataURI) {
		return false;
	}
	// convert base64/URLEncoded data component to raw binary data held in a string
	var byteString;
	if (dataURI.split(',')[0].indexOf('base64') >= 0) {
		byteString = atob(dataURI.split(',')[1]);
	} else {
		byteString = unescape(dataURI.split(',')[1]);
	}
	// separate out the mime component
	var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

	// write the bytes of the string to a typed array
	var ia = new Uint8Array(byteString.length);
	for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	return new Blob([ia], {type:mimeString});
}

/* 
 * Moves cursor to the end of the input box
 */
function moveCaretToEnd(el) {
	if (typeof el.selectionStart == "number") {
		el.selectionStart = el.selectionEnd = el.value.length;
	} else if (typeof el.createTextRange != "undefined") {
		var range = el.createTextRange();
		range.collapse(false);
		range.select();
	}
	el.focus();
}

linkify = function(input) {
	return Autolinker.link( input, {
		className: 'auto-link-color',
		email: false,
		phone: false,
		twitter: false,
		hashtag: false,
		replaceFn: function (autolinker, match) {
			return '<a onclick="window.open(\'' + match.getUrl() + '\'\, \'_blank\')">' + match.getUrl() + '</a>';
		}
	});
};