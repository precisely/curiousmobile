define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var FastClick = require('famous/inputs/FastClick');
	var RenderNode = require("famous/core/RenderNode");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var RenderController = require("famous/views/RenderController"),
	var StateView = require('views/StateView');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var Surface = require('famous/core/Surface');
	var EntryReadView = require('views/entry/EntryReadView');
	var User = require('models/User');
	var u = require('util/Utils');

	function DeviceEntryReadView(deviceData) {
		EntryReadView.apply(this, arguments);
		this.deviceData = deviceData;
		this.renderController = new RenderController();
		this.childrenSequentialView = new SequentialLayout({
		this.treeCollapsed = true;
			direction: 1,
		});
		this.add(new StateModifier({transform: Transform.translate(0, 40, App.zIndex.readView)})).add(this.renderController);
		//_createTagSurface.call(this);
	}

	DeviceEntryReadView.prototype = Object.create(EntryReadView.prototype);
	DeviceEntryReadView.prototype.constructor = DeviceEntryReadView;

	DeviceEntryReadView.DEFAULT_OPTIONS = {
		entryHeight: 45,
		lineHeight: 16,
	};

	function _createiNode(entry) {
		var properties = {
			padding: '11px 45px 0px 15px',
			fontSize: this.options.lineHeight + 'px',
			fontWeight: 'lighter',
			lineHeight: this.options.lineHeight + 'px',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			color: '#fff',
		};

		var size = [window.innerWidth, 36];

		var readSurfaceOptions = {
			size: size,
			content: entry,
			properties: properties
		};

		this.entrySurface.setOptions(readSurfaceOptions);

		var deleteModifier = new StateModifier({
			transform: Transform.translate(window.innerWidth, -2, window.App.zIndex.readView + 2)
		});
		this.deleteSurface.setProperties({
			padding: '8px 0px',
			borderBottom: '1px solid #f6a583',
			lineHeight: '23px',
		});
		this.deleteSurface.setSize([80, true]);
		this.add(deleteModifier).add(this.deleteSurface);
		var entryModifier = new Modifier({
			transform: Transform.translate(0, 2, 0)
		});
		this.add(entryModifier).add(this.entrySurface);
	}

	//Overriding select method from EntryView
	DeviceEntryReadView.prototype.select = function() {
		if (this.treeCollapsed) {
			this.renderController.show(this.childrenSequentialView);
		} else {
			this.renderController.hide();
		}
		this.treeCollapsed = !this.treeCollapsed;
	};

	DeviceEntryReadView.prototype.delete = function() {
		User.deleteInterestTags(this.entry, function() {
			var currentView = App.pageView.getCurrentView();
			if (typeof currentView !== 'undefined') {
				currentView.killOverlayContent();
			}
		}.bind(this));
	};

	module.exports = DeviceEntryReadView;
});
