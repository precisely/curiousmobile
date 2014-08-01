/*** PageView.js ***/

define(function(require, exports, module) {
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require("famous/views/RenderController");
	var TrackView = require('views/TrackView');
	var LoginView = require('views/LoginView');
	var Utils = require('util/Utils');

    function PageView() {
        View.apply(this, arguments);
		this.renderController = new RenderController();
		this.add(this.renderController);
		_addPages.call(this);
    }

    PageView.prototype = Object.create(View.prototype);
    PageView.prototype.constructor = PageView;

    PageView.DEFAULT_OPTIONS = {
    };

	function _addPages() {
		var windowSize = Utils.getWindowSize();
		this.loginView = new LoginView();
		this.trackView = new TrackView();
		this.hiddenModifier = new StateModifier({
			align: [1,1]
		});
		this.trackView.on('menuToggle', function(){
            this._eventOutput.emit('menuToggleNested');
        }.bind(this));

		this.loginView.on('login-success', function (data) {
			this.renderController.hide(this.loginView);
			this.renderController.show(this.trackView);
		}.bind(this));
		this.renderController.show(this.loginView, {duration:0});
	}

    module.exports = PageView;
});
