define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var Transform = require('famous/core/Transform');
	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var ContextMenuTemplate = require('text!templates/context-menu.html');
	var self = null;

	function ContextMenuView() {
		View.apply(this, arguments);
		self = this;
		this.createView();
	}

	ContextMenuView.prototype = Object.create(View.prototype);
	ContextMenuView.prototype.constructor = ContextMenuView;

	ContextMenuView.DEFAULT_OPTIONS = {
		entry: [
			{ class: 'select-entry', label: 'Edit Tag' },  
			{ class: 'trigger-delete-entry', label: 'Delete Tag' },
		],
		pinnedEntry: [
			{ class: 'trigger-delete-entry', label: 'Delete Tag' },
		],
		chart: {},
		discussion: {},
	};

	ContextMenuView.prototype.createView = function() {
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(function() {
			return Transform.translate(0, 0, App.zIndex.contextMenu);
		});

		this.contextMenuContainer = new ContainerSurface({});
		var backdropSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				opacity: '0.2',
				backgroundColor: '#000000',
			}	
		});

		var backdropModifer = new Modifier({
			opacity: 0.5,
		});

		this.contextMenu = new Surface({
		});

		this.contextMenu.on('click', function(e) {
			console.log('EventHandler: this.contextMenu event: click');
			if (e instanceof CustomEvent) {
				var classList = e.srcElement.classList;
				if (_.contains(classList, 'menu-item')) {
					var arg = this.eventArg;
					var target = this.target;
					target._eventOutput.emit(classList[1], arg);	
				}
				this.hide();	
			}
		}.bind(this));

		this.contextMenuContainer.add(backdropModifer).add(backdropSurface);
		this.contextMenuContainer.add(this.contextMenu);
	};

	ContextMenuView.prototype.show = function(e) {
		this.target = e.target;	
		this.eventArg = e.eventArg;
		var template = ContextMenuTemplate;
		this.contextMenu.setContent(_.template(template, { buttons: this.options[e.menu] }, templateSettings));
		this.renderController.show(this.contextMenuContainer);
	};

	ContextMenuView.prototype.hide = function() {
		this.renderController.hide({duration:0});	
		this.target = null;
	};
	module.exports = ContextMenuView;
});
