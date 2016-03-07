/*** main.js ***/

//main.js
var isMobile = false; //initiate as false
// device detection
if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) isMobile = true;
var showAlert, queuePostJSON, queueJSON, makeGetUrl, getCSRFPreventionObject, makePlainUrl, makePostUrl, checkData,
	makeGetArgs, backgroundJSON;

window.App = new App();
define(function(require, exports, module) {
	var u = require('util/Utils');
	var Timer = require('famous/utilities/Timer');
	Timer.every(function() {
		App.width = window.innerWidth;
		App.height = window.innerHeight;
	}, 100);
	showAlert = function(alertMessage) {
		u.showAlert(alertMessage);
	};

	queuePostJSON = function(description, url, args, successCallback, failCallback, delay) {
		u.queuePostJSON(description, url, u.getCSRFPreventionObject(null, args), successCallback, failCallback, delay);
	};

	queueJSON = function(description, url, args, successCallback, failCallback, delay, post, background) {
		u.queueJSON(description, url, args, successCallback, failCallback, delay, post, background);
	}

	makeGetUrl = function(url) {
		return u.makeGetUrl(url);
	}

	getCSRFPreventionObject = function(key, data) {
		return u.getCSRFPreventionObject(key, data);
	}

	makePlainUrl = function(url) {
		return u.makePlainUrl(url);
	}

	makePostUrl = function(url) {
		return u.makePostUrl(url);
	}

	checkData = function(data, status, errorMessage, successMessage) {
		return u.checkData(data, status, errorMessage, successMessage);
	}

	makeGetArgs = function(args) {
		return u.makeGetArgs(args);
	}

	backgroundJSON = function(description, url, args, successCallback, failCallback, delay, post) {
		u.backgroundJSON(description, url, args, successCallback, failCallback, delay, post)
	}

	var Engine = require('famous/core/Engine');
	var Cache = require('jscache');
	var TouchSync = require('famous/inputs/TouchSync');
	var FastClick = require('famous/inputs/FastClick');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var EventHandler = require('famous/core/EventHandler');
	var AppView = require('views/AppView');

	App.setCacheAndCoreEeventHandlers(EventHandler, Cache);

	var start = 0;
	var update = 0;
	var end = 0;
	var delta = [0, 0];
	var position = [0, 0];

	Engine.setOptions({
		containerClass: 'app-container'
	});
	var mainContext = Engine.createContext();
	window.mainContext = mainContext;

	var appView = new AppView();
	App.setAppView(appView);
	var mod = new Modifier({
		size: [App.width, App.height],
		origin: [0, 0],
		align: [0, 0]
	});
	mainContext.add(mod).add(appView);

	var touchSync = new TouchSync(function() {
		return position;
	});

	touchSync.on('start', function(data) {
		start = Date.now();
	});

	touchSync.on('end', function(data) {
		var movementY = data.position[1];
		var movementX = data.position[0];
		var velocityX = data.velocity[0];
		var currentView = App.pageView.getCurrentView();
		// Don't show context menu if there is intent to move something
		if (movementY > 100) {
			console.log('main.js: ', ' movementy: ', movementY);
			var currentView = App.pageView.getCurrentView();
			if (!currentView.currentOverlay) {
				if (currentView && currentView.refresh) {
					if (currentView.getScrollPosition && currentView.getScrollPosition() >= 0) {
						return;
					}
					currentView.refresh();
				}
			}
		} else if (movementX > 100 && velocityX > 0.7) {
			if (typeof currentView !== 'undefined') {
				currentView._eventOutput.emit('swiped-right');
			}
		} else if (movementX < -100 && velocityX < -0.7) {
			if (typeof currentView !== 'undefined') {
				currentView._eventOutput.emit('swiped-left');
			}
		}
	});

	Engine.on('click', function(e) {
		if (e instanceof CustomEvent) {
			var srcElement = e.srcElement;
			if (srcElement.tagName != 'INPUT' && srcElement.tagName != 'TEXTAREA') {
				if (typeof cordova !== 'undefined') {
					cordova.plugins.Keyboard.close();
				}
				e.stopPropagation();
			}
		}
	});
	Engine.pipe(touchSync);
	module.exports = App;
});

//TODO A cleaner approach to setting template format
//
window.templateSettings = {
	evaluate: /\{\{(.+?)\}\}/g,
	interpolate: /\{\{=(.+?)\}\}/g
};

window.ElementType = {
	surface: 1,
	domElement: 2
}
