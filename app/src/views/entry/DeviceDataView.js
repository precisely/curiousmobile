define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var FastClick = require('famous/inputs/FastClick');
	var RenderNode = require("famous/core/RenderNode");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var RenderController = require("famous/views/RenderController");
	var Transitionable = require('famous/transitions/Transitionable');
	var StateView = require('views/StateView');
	var EntryReadView = require('views/entry/EntryReadView');
	var TrackEntryView = require('views/entry/TrackEntryView');
	var EntryCollection = require('models/EntryCollection');
	var User = require('models/User');
	var u = require('util/Utils');

	function DeviceDataView(options) {
		EntryReadView.apply(this, arguments);
		this.options = Object.create(DeviceDataView.DEFAULT_OPTIONS);
		this.entrySurface = new ContainerSurface();
		this.childrenController = new RenderController();
		this.groupedData = [];
		this.childrenSequentialView = new SequentialLayout({
			direction: 1,
			itemSpacing: 55
		});
		this.entries = new EntryCollection(this.entry); // This field is from TrackEntryView
		this.group();
		this.children = [];
		this.childrenSequentialView.sequenceFrom(this.children);
		this.collapsed = true;
		_createNode.call(this);
		this.createChildren();
	}

	DeviceDataView.prototype = Object.create(EntryReadView.prototype);
	DeviceDataView.prototype.constructor = DeviceDataView;

	DeviceDataView.DEFAULT_OPTIONS = {
		entryHeight: 55,
		lineHeight: 16,
	};

	function _createNode() {
		var readSurfaceOptions = _.extend({}, TrackEntryView.DEFAULT_OPTIONS.readSurfaceOptions);
		this.transitionalHeight = new Transitionable(55);
		readSurfaceOptions.size =  [window.innerWidth, this.transitionalHeight];
		readSurfaceOptions.content = this.getDisplayText();
		readSurfaceOptions.classes = ['entry'];
		this.deviceDataSurface = new Surface();
		this.deviceDataSurface.setOptions(readSurfaceOptions);
		this.entrySurface.add(this.deviceDataSurface);
		this.deviceDataSurface.pipe(this);
		this.deviceDataSurface.pipe(this.touchSync);
		this.entrySurface.pipe(this);
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
		var childrenModifier = new StateModifier({
			transform: Transform.translate(0, 55, App.zIndex.readView + 2)
		});
		this.add(entryModifier).add(this.entrySurface);
		this.entrySurface.add(childrenModifier).add(this.childrenController);
	}

	DeviceDataView.prototype.getTriangle = function () {
		if (this.collapsed) {
		    return '<i class="fa fa-chevron-right"></i>';//chevron right
		}
		return '<i class="fa fa-chevron-down"></i>';//chevron down
	};

	//Overriding select method from EntryView
	DeviceDataView.prototype.select = function() {
		if(this.collapsed) {
			this.childrenController.show(this.childrenSequentialView);
			this.transitionalHeight.set((this.children.length + 1) * 55);
		} else {
			this.transitionalHeight.set(55);
			this.childrenController.hide();
		}
		this.collapsed = !this.collapsed;
		this.deviceDataSurface.setContent(this.getDisplayText());
	};

	DeviceDataView.prototype.expand = function () {
		this.childrenController.show(this.childrenSequentialView);
		this.collapsed = false;
		this.deviceDataSurface.setContent(this.getDisplayText());
	};

	DeviceDataView.prototype.delete = function() {
	};

	module.exports = DeviceDataView;
});
