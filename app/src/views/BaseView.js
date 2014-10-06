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
	var FastClick = require('famous/inputs/FastClick');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var FooterTemplate = require('text!templates/footer.html');
	var SequentialLayout = require('famous/views/SequentialLayout');

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
		header: true,
		
	};

	function _createLayout() {
		this.layout = new HeaderFooter({
			headerSize: this.options.headerSize
		});

		var layoutModifier = new StateModifier({
			transform: Transform.translate(0, 0, 0.1)
		});

		this.add(layoutModifier).add(this.layout);
	}

	function _createHeader() {
		if (!this.options.header) {
			return;
		}
		var backgroundSurface = new Surface({
			size: [undefined, 70],
			properties: {
				backgroundColor: '#ffffff'
			}
		});

		var backgroundModifier = new StateModifier({
			transform: Transform.behind
		});

		this.layout.header.add(backgroundModifier).add(backgroundSurface);

		this.hamburgerSurface = new ImageSurface({
			size: [44, 44],
			content: 'content/images/menu-icon.png',
			properties: {
				marginTop: '15px',
				marginLeft: '5px',
			}
		});

		this.hamburgerSurface.on('click', function() {
			console.log("Clicked on menu icon image");
			this._eventOutput.emit('show-menu');
		}.bind(this));

		var iconSurface = new ImageSurface({
			size: [44, 44],
			content: 'content/images/icon.png'
		});
		var hamburgerModifier = new StateModifier({
			origin: [0, 0],
			align: [0, 0]
		});

		var iconModifier = new StateModifier({
			origin: [1, 0.5],
			align: [1, 0.5]
		});
		this.layout.header.add(hamburgerModifier).add(this.hamburgerSurface);

	}

	function _createFooter() {
		var footerModifier = new StateModifier({
			transform: Transform.translate(0, 0, window.App.zIndex.menu)	
		});

		var footerSurface = new Surface({
			content: FooterTemplate,
			size: [undefined, 25],
			properties: {
				borderTop: '1px solid #c0c0c0',
				backgroundColor: 'white'
			}
		});

		footerSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				console.log('footerSurface event');
				var classList = e.srcElement.classList;				
				e.data = classList[0];
				this._eventOutput.emit('change-page', e);
			}
		}.bind(this));

		this.layout.footer.add(footerModifier).add(footerSurface);
	}

	function _setListeners() {
	}

	BaseView.prototype.setHeaderLabel = function(title) {
		var labelModifier = new Modifier({
			transform: Transform.translate(44, 0, 3)
		});
		var labelSurface = new Surface({
			size: [window.innerWidth - 44, 74],
			content: title,
			properties: {
				fontSize: '22px',
				fontWeight: 'bold',
				color: '#e83838',	
				textAlign: 'center',
				padding: '24px 0'
			}
		});

		this.layout.header.add(labelModifier).add(labelSurface);
	}

	BaseView.prototype.setBody = function(body) {
		var bodyModifier = new StateModifier({
			origin: [0,0],
			transform: Transform.translate(0, 70, 1)
		});
		this.layout.content.add(bodyModifier).add(body);
	}
	module.exports = BaseView;
});
