define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var FastClick = require('famous/inputs/FastClick');
	var RenderNode = require("famous/core/RenderNode");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var RenderController = require("famous/views/RenderController");
	var StateView = require('views/StateView');
	var Surface = require('famous/core/Surface');
	var EntryReadView = require('views/entry/EntryReadView');
	var TrackEntryView = require('views/entry/TrackEntryView');
	var User = require('models/User');
	var u = require('util/Utils');

	function DeviceDataView(deviceEntries) {
		EntryReadView.apply(this, arguments);
		this.options = Object.create(DeviceDataView.DEFAULT_OPTIONS);
		this.deviceEntries = deviceEntries;
		this.childrenController = new RenderController();
		this.childrenSequentialView = new SequentialLayout({
			direction: 1,
		});
		_createNode.call(this);
	}

	DeviceDataView.prototype = Object.create(EntryReadView.prototype);
	DeviceDataView.prototype.constructor = DeviceDataView;

	DeviceDataView.DEFAULT_OPTIONS = {
		entryHeight: 45,
		lineHeight: 16,
	};

	function _createNode() {
		var readSurfaceOptions = TrackEntryView.getSurfaceProperties(this.options.lineHeight, [undefined, this.options.entryHeight], this.getDisplayText());
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
			transform: Transform.translate(0, 2, App.zIndex.readView + 2)
		});
		this.add(entryModifier).add(this.entrySurface);
	}

	DeviceDataView.prototype.getTriangle = function () {
		if (this.expanded) {
		    return '<i class="fa fa-chevron-right"></i>';//chevron right
		}
		return '<i class="fa fa-chevron-down"></i>';//chevron down
	};

	//Overriding select method from EntryView
	DeviceDataView.prototype.select = function() {
		if (this.expanded) {
			this.childrenController.show(this.childrenSequentialView);
		} else {
			this.childrenController.hide();
		}
		this.expanded = !this.expanded;
	};

	DeviceDataView.prototype.delete = function() {
	};

	module.exports = DeviceDataView;
});
