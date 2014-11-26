/*** BaseView.js ***/

define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var HeaderFooter = require('famous/views/HeaderFooterLayout');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var FooterTemplate = require('text!templates/footer.html');
	var SequentialLayout = require('famous/views/SequentialLayout');
	var FastClick = require('famous/inputs/FastClick');

	function BaseView(options) {
		this._header = options? options.header : true;	
		View.apply(this, arguments);
		_createLayout.call(this);
		_createHeader.call(this);
		_createFooter.call(this);
		_setListeners.call(this);
	}

	BaseView.prototype = Object.create(View.prototype);
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
			headerSize: this.options.headerSize,
			footerSize: this.options.footerSize
		});

		var layoutModifier = new Modifier({
			size: [window.App.width, window.App.height],
		});

		this.add(layoutModifier).add(this.layout);
	}

	function _createHeader() {
		if (!this.options.header) {
			return;
		}

		var backgroundSurface = new Surface({
			origin: [0,0],
			align: [0,0],
			size: [window.innerWidth, 64],
			properties: {
				backgroundColor: 'white'
			}
		});

		var headerModifier = new Modifier({
			transform: Transform.translate(0, 0, App.zIndex.header - 1)
		});

		this.layout.header.add(headerModifier).add(backgroundSurface);
		if (this.options.backButton) {
			var leftSurface = new Surface({
				content: '<img src="content/images/left.png" />',	
				size: [61, 64],
				properties: {
					padding: '20px'
				}
			});
			leftSurface.on('click', function(e) {
				console.log("Clicked on menu icon image");
				if (e instanceof CustomEvent) {
					this._eventOutput.emit('go-back');
				}
			}.bind(this));
			var leftModifier = new StateModifier({
				transform: Transform.translate(0, 0, window.App.zIndex.header + 1)	
			});
			this.layout.header.add(leftModifier).add(leftSurface);
		} else {

			this.hamburgerSurface = new ImageSurface({
				size: [49, 64],
				content: 'content/images/hamburg-menu.png',
			});

			this.hamburgerSurface.on('click', function(e) {
				if (e instanceof CustomEvent) {
					console.log("Clicked on menu icon image");
					this._eventOutput.emit('show-menu');
				}
			}.bind(this));
			var hamburgerModifier = new StateModifier({
				origin: [0, 0],
				align: [0, 0],
				transform: Transform.translate(0, 0, window.App.zIndex.header)	
			});
			this.addLayoutContent(hamburgerModifier, this.hamburgerSurface, this.layout.header);
		}
	}

	function _createFooter() {
		if (!this.options.footer) {
			return;
		}
		var footerModifier = new StateModifier({
			transform: Transform.translate(0, 0, window.App.zIndex.header)	
		});

		var footerSurface = new Surface({
			content: FooterTemplate,
			size: [undefined, 50],
			properties: {
				borderTop: '1px solid #c0c0c0',
				backgroundColor: 'white',
			}
		});

		footerSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				console.log('footerSurface event');
				var classList = e.srcElement.classList;				
				e.data = classList[2];
				if (e.data == 'track' || e.data == 'community') {
					this._eventOutput.emit('change-page', e);
				}
			}
		}.bind(this));

		this.addLayoutContent(footerModifier, footerSurface, this.layout.footer);
	}

	function _setListeners() {
	}

	BaseView.prototype.setHeaderLabel = function(title) {
		var labelModifier = new Modifier({
			transform: Transform.translate(0, 0, App.zIndex.header)
		});
		var labelSurface = new Surface({
			size: [window.innerWidth, 64],
			content: title,
			properties: {
				fontSize: '15px',
				fontWeight: 'normal',
				color: '#F14A42',	
				textAlign: 'center',
				padding: '21px 0'
			}
		});

		this.addLayoutContent(labelModifier, labelSurface, this.layout.header);
	}

	BaseView.prototype.setHeaderSurface = function(headerSurface, surfaceModifier) {
		if (surfaceModifier == null) {
			var labelModifier = new Modifier({
				transform: Transform.translate(0, 0, App.zIndex.header)
			});
			this.addLayoutContent(labelModifier, headerSurface, this.layout.header);
		} else {
			this.addLayoutContent(surfaceModifier, headerSurface, this.layout.header);
		}
	}
	BaseView.prototype.setBody = function(body) {
		var bodyModifier = new StateModifier({
			origin: [0,0],
			transform: Transform.translate(0, 64, 2)
		});
		this.addContent(bodyModifier, body);
	}

	BaseView.prototype.addContent = function (modifier, renderable) {
		if (modifier && renderable) {
			this.addLayoutContent(modifier, renderable, this.layout.content);
		} else if (renderable) {
			this.addLayoutContent(renderable, null, this.layout.content);
		}
	}

	BaseView.prototype.addLayoutContent = function (modifier, renderable, section) {
		if (modifier && renderable && section) {
			section.add(modifier).add(renderable);
		} else if (renderable && section) {
			section.add(renderable);
		}
	}

	module.exports = BaseView;
});
