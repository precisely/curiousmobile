define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var InputSurface = require('famous/surfaces/InputSurface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var Easing = require("famous/transitions/Easing");
	var RenderController = require("famous/views/RenderController");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var Entry = require('models/Entry');

	function EntryFormView(entry) {
		View.apply(this, arguments);
		this.entry = entry;
		this.renderController = new RenderController();
		this.iconRenderController = new RenderController();
		_createForm.call(this);
	}

	EntryFormView.prototype = Object.create(View.prototype);
	EntryFormView.prototype.constructor = EntryFormView;

	EntryFormView.DEFAULT_OPTIONS = {};

	function _createForm() {
		var sequentialLayout = new SequentialLayout({
			direction: 0,
			itemSpacing: 20,
			defaultItemSize: [24, 24],
		});

		sequentialLayout.setOutputFunction(function(input, offset, index) {
			//Bumping the offset to add additional padding on the left
			offset += 10;
			var transform = (this.options.direction === 0) ?
				Transform.translate(offset, 40, 0) : Transform.translate(0, offset);
			return {
				transform: transform,
				target: input.render()
			};
		});

		this.iconModifier = new Modifier({
			transform: Transform.translate(0, 5, 0)
		});

		this.inputModifier = new Modifier({
			align: [0, 0],
			transform: Transform.translate(5, 5, 0)
		});

		this.inputModifier.sizeFrom(function() {
			var mainContext = window.mainContext;
			var size = mainContext.getSize();
			return [0.97 * size[0], 30];
		});

		this.inputSurface = new InputSurface({
			value: this.cleanSuffix(this.entry.toString())
		});

		this.add(this.inputModifier).add(this.inputSurface);

		this.repeatSurface = new ImageSurface({
			content: 'content/images/repeat.png',
			size: [24, 24],
		});

		this.remindSurface = new ImageSurface({
			content: 'content/images/remind.png',
			size: [24, 24],
		});

		this.pinSurface = new ImageSurface({
			content: 'content/images/pin.png',
			size: [24, 24],
		});
		sequentialLayout.sequenceFrom([this.repeatSurface, this.pinSurface, this.remindSurface]);
		this.add(sequentialLayout);
	}

	EntryFormView.prototype.cleanSuffix = function(entryText) {

		var text = entryText;

		if (text.endsWith(" repeat") || text.endsWith(" remind") || text.endsWith(" pinned")) {
			text = text.substr(0, text.length - 7);
		}
		return text;
	}



	module.exports = EntryFormView;
});
