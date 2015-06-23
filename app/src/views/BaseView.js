/*** BaseView.js ***/

define(function(require, exports, module) {
	'use strict';
	var Surface = require('famous/core/Surface');
	var OptionsManager = require('famous/core/OptionsManager');
	var Transform = require('famous/core/Transform');
	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var HeaderFooter = require('famous/views/HeaderFooterLayout');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var FooterTemplate = require('text!templates/footer.html');
	var SequentialLayout = require('famous/views/SequentialLayout');
	var FastClick = require('famous/inputs/FastClick');
	var StateView = require('views/StateView');
	var RenderController = require("famous/views/RenderController");
	var u = require('util/Utils');

	function BaseView(options) {
		this.options = Object.create(BaseView.DEFAULT_OPTIONS);
		this._optionsManager = new OptionsManager(this.options);
		if (options) {
			this._optionsManager.setOptions(options);
		}
		this._header = options ? options.header : true;
		this.topLevelPage = true;
		this.overlayController = new RenderController();
		this.headerController = new RenderController();
		StateView.apply(this, arguments);
		_createLayout.call(this);
		_createHeader.call(this);
		_createFooter.call(this);
		_setListeners.call(this);
	}

	BaseView.prototype = Object.create(StateView.prototype);
	BaseView.prototype.constructor = BaseView;

	BaseView.DEFAULT_OPTIONS = {
		headerSize: 44,
		footerSize: 55,
		header: true,
		backButton: false,
		footer: false,
	};

	function _createLayout() {
		this.layout = new HeaderFooter({
			headerSize: 64,
			footerSize: 50
		});

		var layoutModifier = new Modifier({
			size: [window.App.width, window.App.height],
		});

		this.add(layoutModifier).add(this.layout);
	}

	function _createHeader() {
		var headerMainControllerModifier = new StateModifier({
			transform: Transform.translate(50, 0, window.App.zIndex.header + 1)
		});
		this.layout.header.add(headerMainControllerModifier).add(this.headerController);
		this.headerContainer = new ContainerSurface({
			size: [undefined, undefined],
		});

		if (!this.options.header) {
			return;
		}
		var backgroundSurface = new Surface({
			origin: [0, 0],
			align: [0, 0],
			size: [window.innerWidth, 64],
			properties: {
				backgroundColor: '#fff'
			}
		});

		var headerBackgroundModifier = new Modifier({
			transform: Transform.translate(0, 0, App.zIndex.header - 1)
		});

		this.headerContainer.add(headerBackgroundModifier).add(backgroundSurface);
		this.headerLeftIconController = new RenderController();
		this.headerRightIconController = new RenderController();

		var leftModifier = new StateModifier({
			transform: Transform.translate(0, 0, window.App.zIndex.header + 1)
		});
		var rightModifier = new StateModifier({
			align: [1, 0],
			origin: [1, 0],
			transform: Transform.translate(0, 0, window.App.zIndex.header + 1)
		});

		this.layout.header.add(leftModifier).add(this.headerLeftIconController);
		this.layout.header.add(rightModifier).add(this.headerRightIconController);
		this.leftSurface = new Surface({
			content: '<img src="content/images/left.png" />',
			size: [61, 64],
			properties: {
				padding: '20px'
			}
		});
		this.leftSurface.on('click', function(e) {
			console.log("Clicked on menu icon image");
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				this.goBack();
			}
		}.bind(this));

		this.hamburgerSurface = new ImageSurface({
			size: [49, 64],
			content: 'content/images/hamburg-menu.png',
		});

		this.hamburgerSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				console.log("Clicked on menu icon image");
				this._eventOutput.emit('show-menu');
			}
		}.bind(this));

		if (this.options.backButton) {
			this.headerLeftIconController.show(this.leftSurface);
		} else {
			this.headerLeftIconController.show(this.hamburgerSurface);
		}
		this.layout.header.add(this.headerContainer);
	}

	function _createFooter() {
		if (!this.options.footer) {
			return;
		}
		var footerModifier = new StateModifier({
			transform: Transform.translate(0, 0, window.App.zIndex.footer)
		});

		var footerSurface = new Surface({
			content: FooterTemplate,
			classes: ['footer-surface'],
			size: [undefined, 50],
			properties: {
				borderTop: '1px solid #c0c0c0',
				backgroundColor: 'white',
			}
		});

		footerSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				console.log('footerSurface event');
				var pageName = e.srcElement.getAttribute('data');
				e.data = pageName;
				if (e.data == 'TrackView' || e.data == 'FeedView') {
					this._eventOutput.emit('change-page', e);
				}
			}
		}.bind(this));

		this.addLayoutContent(footerModifier, footerSurface, this.layout.footer);
	}

	function _setListeners() {}

	BaseView.prototype.showMenuButton = function() {
		this.headerLeftIconController.show(this.hamburgerSurface);
	};

	BaseView.prototype.showBackButton = function() {
		this.headerLeftIconController.show(this.leftSurface);
	};

	BaseView.prototype.setRightIcon = function (iconSurface) {
		this.headerRightIconController.show(iconSurface);
	};

	BaseView.prototype.onShow = function(state) {
		if (this.options.header) {
			if (!this.options.noBackButton && App.pageView.hasHistory()) {
				return this.showBackButton();
			}
			if (this.options.noBackButton) {
				App.pageView.clearHistory();
			}
		}

		if (state) {
			this.loadState(state);
		}
	};

	BaseView.prototype.preShow = function() {
		return true;
	};

	BaseView.prototype.goBack = function(state) {
		App.pageView.goBack(this.parentPage, state);
	};

	BaseView.prototype.setHeaderLabel = function(title) {
		var labelSurface = new Surface({
			size: [window.innerWidth - 100, 64],
			content: title,
			properties: {
				fontSize: '15px',
				fontWeight: 'normal',
				color: '#F14A42',
				textAlign: 'center',
				padding: '21px 0'
			}
		});

		this.setHeaderSurface(labelSurface);
	}

	BaseView.prototype.setHeaderSurface = function(headerSurface, surfaceModifier) {
			this.headerController.show(headerSurface);
	}

	BaseView.prototype.setBody = function(body) {
		var bodyModifier = new StateModifier({
			origin: [0, 0],
			transform: Transform.translate(0, 0, 2)
		});
		this.addContent(bodyModifier, body);
	}

	BaseView.prototype.addContent = function(modifier, renderable) {
		if (modifier && renderable) {
			this.addLayoutContent(modifier, renderable, this.layout.content);
		} else if (renderable) {
			this.addLayoutContent(renderable, null, this.layout.content);
		}
	}

	BaseView.prototype.addLayoutContent = function(modifier, renderable, section) {
		if (modifier && renderable && section) {
			section.add(modifier).add(renderable);
		} else if (renderable && section) {
			section.add(renderable);
		}
	}

	BaseView.prototype.showOverlayContent = function(renderable, callback) {
		var overlayModifier = new StateModifier({
			origin: [0, 0],
			transform: Transform.translate(0, 0, 25)
		});
		this.layout.content.add(overlayModifier).add(this.overlayController);
		this.overlayController.show(renderable, null, callback);
	}

	BaseView.prototype.killOverlayContent = function(renderable) {
		this.overlayController.hide();
	}

	module.exports = BaseView;
});
