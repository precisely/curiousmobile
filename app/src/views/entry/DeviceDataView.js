define(function (require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var OptionsManager = require('famous/core/OptionsManager');
	var Utility = require('famous/utilities/Utility');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var FastClick = require('famous/inputs/FastClick');
	var RenderNode = require("famous/core/RenderNode");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var RenderController = require("famous/views/RenderController");
	var Transitionable = require('famous/transitions/Transitionable');
	var Timer = require('famous/utilities/Timer');
	var StateView = require('views/StateView');
	var EntryReadView = require('views/entry/EntryReadView');
	var TrackEntryView = require('views/entry/TrackEntryView');
	var EntryCollection = require('models/EntryCollection');
	var User = require('models/User');
	var u = require('util/Utils');

	function DeviceDataView(options) {
		options.doNotAddEntrySurface = true;
		EntryReadView.apply(this, arguments);
		this.options = Object.create(DeviceDataView.DEFAULT_OPTIONS);
		this._optionsManager = new OptionsManager(this.options);
		if (options) this.setOptions(options);
		this.childrenController = new RenderController();
		this.groupedData = [];
		this.childrenSequentialView = new SequentialLayout({
			direction: 1,
			itemSpacing: 0
		});

		this.entries = new EntryCollection(this.entry); // This field is from EntryView
		this.group();
		this.children = [];
		this.childrenSequentialView.sequenceFrom(this.children);
		this.collapsed = true;
		_createNode.call(this);
		this.createChildren();
	}

	DeviceDataView.prototype = Object.create(EntryReadView.prototype);
	DeviceDataView.prototype.constructor = DeviceDataView;

	DeviceDataView.DEFAULT_OPTIONS = _.extend({}, TrackEntryView.DEFAULT_OPTIONS);

	function _createNode() {
		var entrySurfaceOptions = this.options.readSurfaceOptions;
		entrySurfaceOptions.size = [window.innerWidth, 55];
		entrySurfaceOptions.content = this.getDisplayText();
		entrySurfaceOptions.classes = ['entry'];
		this.entryContainerSurface = new ContainerSurface();
		this.entrySurface.setOptions(entrySurfaceOptions);

		this.entryContainerSurface.add(this.entrySurface);
		this.entrySurface.pipe(this.options.scrollView);
		this.entryContainerSurface.pipe(this);

		this.entryContainerModifier = new StateModifier({
			transform: Transform.translate(0, 0, this.options.entryZIndex)
		});
		var childrenModifier = new StateModifier({
			transform: Transform.translate(0, 55, App.zIndex.readView + 2)
		});
		this.add(this.entryContainerModifier).add(this.entryContainerSurface);

		this.entryContainerSurface.add(childrenModifier).add(this.childrenController);
	}

	DeviceDataView.prototype.getTriangle = function () {
		if (this.collapsed) {
			return '<i class="fa fa-chevron-right"></i>';//chevron right
		}
		return '<i class="fa fa-chevron-down"></i>';//chevron down
	};

	//Overriding select method from EntryView
	DeviceDataView.prototype.select = function () {
		if (this.collapsed) {
			this.childrenController.show(this.childrenSequentialView);
		} else {
			this.childrenController.hide();
		}
		this.collapsed = !this.collapsed;
		this.entrySurface.setContent(this.getDisplayText());
	};

	DeviceDataView.prototype.expand = function () {
		this.childrenController.show(this.childrenSequentialView);
		this.collapsed = false;
		this.entrySurface.setContent(this.getDisplayText());
	};

	DeviceDataView.prototype.delete = function () {
	};

	DeviceDataView.prototype.getSize = function () {
		var size = [window.innerWidth, 55];

		if (this.collapsed) {
			return size;
		}

		for (var i in this.children) {
			var childView = this.children[i];
			var childSize = childView.getSize();
			size[1] += childSize[1];
		}

		return size;
	};

	module.exports = DeviceDataView;
});
