define(function(require, exports, module) {

	'use strict';

	require('jquery');

	var View = require('famous/core/View');
	var SizeAwareView = require('famous/views/SizeAwareView');
	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var Transform = require('famous/core/Transform');
	var Utility = require('famous/utilities/Utility');
	var EntryCollection = require('models/EntryCollection');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var Surface = require('famous/core/Surface');

	var SliderInputWidgetView = require('views/widgets/SliderInputWidgetView'); // InputType 1
	var LevelInputWidgetView = require('views/widgets/LevelInputWidgetView'); // InputType 2
	var BooleanInputWidgetView = require('views/widgets/BooleanInputWidgetView'); // InputType 3
	var SmileInputWidgetView = require('views/widgets/SmileInputWidgetView'); // InputType 4
	var ThumbsUpInputWidgetView = require('views/widgets/ThumbsUpInputWidgetView'); // InputType 5

	var TagInputType = require('util/TagInputType'); 

	function InputWidgetGroupView(options) {
		SizeAwareView.apply(this, arguments);
		this.initialize(options);
	}

	InputWidgetGroupView.prototype = Object.create(View.prototype);
	InputWidgetGroupView.prototype.constructor = InputWidgetGroupView;

	InputWidgetGroupView.DEFAULT_OPTIONS = {
		inputWidgetHeight: 100,
	};

	InputWidgetGroupView.prototype.initialize = function(options) {
		this.entries = EntryCollection.sortAscByTime(new EntryCollection(options.entryDetails.entries));

		var tagDetails = options.entryDetails.tagDetails;
		this.tagInputType = new TagInputType(tagDetails.tagId, tagDetails.description, tagDetails.inputType,
				tagDetails.min, tagDetails.max, tagDetails.noOfLevels);

		this.scrollView = options.scrollView;
		this.draggable = options.draggable;

		this.inputWidgetViewList = [];
		this.inputWidgetViewClass = this.getInputWidgetView();

		this.createDrawer();
	};

	InputWidgetGroupView.prototype.getInputWidgetView = function() {
		switch (this.tagInputType.inputType) {
			case 'SLIDER':
				return SliderInputWidgetView;
				break;
			case 'LEVEL':
				return LevelInputWidgetView;
				break;
			case 'BOOLEAN':
				return BooleanInputWidgetView;
				break;
			case 'SMILEY':
				return SmileInputWidgetView;
				break;
			case 'THUMBS':
				return ThumbsUpInputWidgetView;
		}
	};

	InputWidgetGroupView.prototype.createDrawer = function () {
		this.collapsed = true;

		this.addDrawerSurface();
		this.addWidgetsToDrawer();
		this.createSequentialLayout();
		this.createDrawerContainer();
		this.createCloseIconSurface();
	};

	InputWidgetGroupView.prototype.createDrawerContainer = function() {
		this.drawerController = new RenderController();

		this.drawerContainerSurface = new ContainerSurface({
			classes: ['entry-drawer-container']
		});

		this.drawerContainerSurfaceModifier = new StateModifier({
			transform: Transform.translate(10, 0, 0)
		});
		this.add(this.drawerContainerSurfaceModifier).add(this.drawerController);

		this.drawerElementsModifier = new StateModifier({
			transform: Transform.translate(0, 30, 0)
		});
		this.drawerContainerSurface.add(this.drawerElementsModifier).add(this.inputWidgetSequentialView);
	};

	InputWidgetGroupView.prototype.addDrawerSurface = function() {
		this.drawerSurfaceModifier = new StateModifier({
			transform: Transform.translate(0, 0, 0)
		});

		var InputWidgetView = this.inputWidgetViewClass;
		this.drawerSurface = new InputWidgetView(this.entries, this);
		this.add(this.drawerSurfaceModifier).add(this.drawerSurface);
	};

	InputWidgetGroupView.prototype.createSequentialLayout = function() {
		this.inputWidgetSequentialView = new SequentialLayout({
			direction: 1,
			itemSpacing: 0
		});

		this.inputWidgetSequentialView.sequenceFrom(this.inputWidgetViewList);
	};

	InputWidgetGroupView.prototype.createCloseIconSurface = function() {
		this.closeIconSurface = new Surface({
			content: '<div class="drawer-close-icon"><i class="fa fa-times-circle fa-lg"></i><div>',
			size: [25, 25],
			classes: ['drawer-close-surface']
		});

		this.closeIconSurfaceModifier = new StateModifier({
			transform: Transform.translate(App.width - 45, 3, 20)
		});

		this.closeIconSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.select();
			}
		}.bind(this));

		this.drawerContainerSurface.add(this.closeIconSurfaceModifier).add(this.closeIconSurface);
	};

	InputWidgetGroupView.prototype.expand = function() {
		this.showDrawer();
	};

	InputWidgetGroupView.prototype.showDrawer = function() {
		this.drawerController.show(this.drawerContainerSurface);

		this.drawerSurface.inputWidgetSurface.addClass('input-widget-view-selected');

		this.drawerContainerSurface.setSize([App.width - 20, this.getDrawerContainerSurfaceHeight()]);
		this.drawerSurfaceModifier.setTransform(
			Transform.translate(0, this.getDrawerContainerSurfaceHeight(), 0)
		);
	};

	InputWidgetGroupView.prototype.getDrawerContainerSurfaceHeight = function() {
		return (this.getTotalHeight() - this.options.inputWidgetHeight);
	};

	InputWidgetGroupView.prototype.hideDrawer = function() {
		this.drawerController.hide();
		this.drawerSurface.inputWidgetSurface.removeClass('input-widget-view-selected');
		this.drawerSurfaceModifier.setTransform(
			Transform.translate(0, 0, 0)
		);
	};

	InputWidgetGroupView.prototype.select = function() {
		if (this.inputWidgetViewList.length <= 0) {
			return;
		}

		if (this.collapsed) {
			this.showDrawer();
		} else {
			this.hideDrawer();
		}
		this.collapsed = !this.collapsed;
	};

	InputWidgetGroupView.prototype.addWidgetsToDrawer = function() {
		this.entries.each(function(entry) {
			var InputWidgetView = this.inputWidgetViewClass;
			this.inputWidgetViewList.push(new InputWidgetView(entry, this));
		}.bind(this));
	};

	InputWidgetGroupView.prototype.getSize = function () {
		if (this.collapsed) {
			return [undefined, this.options.inputWidgetHeight];
		}

		return [undefined, this.getTotalHeight()];
	};

	InputWidgetGroupView.prototype.getTotalHeight = function() {
		var totalHeight = this.options.inputWidgetHeight;

		for (var i in this.inputWidgetViewList) {
			totalHeight += this.inputWidgetViewList[i].getSize()[1];
		}

		// Adding extra height for close icon.
		totalHeight += 30;

		return totalHeight;
	};

	InputWidgetGroupView.prototype.handleGlowEntry = function(entryId) {
		var inputWidgetView = this.getInputWidgetViewForEntryId(entryId);

		if (inputWidgetView) {
			if (this.collapsed) {
				this.select();
			}

			inputWidgetView.glow();
		}
	};

	InputWidgetGroupView.prototype.getInputWidgetViewForEntryId = function(entryId) {
		return _.find(this.inputWidgetViewList, function(inputWidgetView) {
			return inputWidgetView.entry.get('id') === entryId;
		});
	};

	module.exports = InputWidgetGroupView;
});
