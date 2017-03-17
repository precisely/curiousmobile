define(function(require, exports, module) {

	'use strict';
	var View = require('famous/core/View');
	var Modifier = require('famous/core/Modifier');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var Transform = require('famous/core/Transform');
	var Utility = require('famous/utilities/Utility');
	var EntryCollection = require('models/EntryCollection');
	var SequentialLayout = require("famous/views/SequentialLayout");

	var SliderInputWidgetView = require('views/widgets/SliderInputWidgetView'); // InputType 1
	var LevelInputWidgetView = require('views/widgets/LevelInputWidgetView'); // InputType 2
	var BooleanInputWidgetView = require('views/widgets/BooleanInputWidgetView'); // InputType 3
	var SmileInputWidgetView = require('views/widgets/SmileInputWidgetView'); // InputType 4
	var ThumbsUpInputWidgetView = require('views/widgets/ThumbsUpInputWidgetView'); // InputType 5

	function InputWidgetGroupView(options) {
		View.apply(this, arguments);
		this.initialize(options);
	}

	InputWidgetGroupView.prototype = Object.create(View.prototype);
	InputWidgetGroupView.prototype.constructor = InputWidgetGroupView;

	InputWidgetGroupView.DEFAULT_OPTIONS = {};

	InputWidgetGroupView.prototype.initialize = function(options) {
		this.entries = new EntryCollection(options.entryDetails.entries);
		this.tag = options.entryDetails.tag;
		this.scrollView = options.scrollView;
		this.inputWidgetViewList = [];
		this.inputWidgetViewClass = this.getInputWidgetView();
		this.createDrawer();

		this.inputWidgetSequentialView = new SequentialLayout();
		this.inputWidgetSequentialView.sequenceFrom(this.inputWidgetViewList);

		this.drawerController = new RenderController();
		this.add(this.drawerController);
		this.drawerController.show(this.inputWidgetSequentialView);
	};

	InputWidgetGroupView.prototype.getInputWidgetView = function() {
		switch (this.tag.inputType) {
			case 1:
				return SliderInputWidgetView;
				break;
			case 2:
				return LevelInputWidgetView;
				break;
			case 3:
				return BooleanInputWidgetView;
				break;
			case 4:
				return SmileInputWidgetView;
				break;
			case 5:
				return ThumbsUpInputWidgetView;
		}
	};

	InputWidgetGroupView.prototype.createDrawer = function () {
		this.entries.each(function(entry) {
			var InputWidgetView = this.inputWidgetViewClass;
			this.inputWidgetViewList.push(new InputWidgetView(entry, this));
		}.bind(this));
	};

	module.exports = InputWidgetGroupView;
});
