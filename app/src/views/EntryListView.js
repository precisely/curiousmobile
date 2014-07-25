define(function(require, exports, module) {
	var View = require('famous/core/View'),
		Surface = require('famous/core/Surface'),
		Transform = require('famous/core/Transform'),
		StateModifier = require('famous/modifiers/StateModifier'),
		RenderController = require("famous/views/RenderController"),
		EntryCollection = require('models/EntryCollection'),
		EntryView = require('views/EntryView'),

		renderController = new RenderController();

	function EntryListView() {
		View.apply(this, arguments);
		this.entryViews = [];
		_createList.call(this);
	}

	EntryListView.prototype = Object.create(View.prototype);
	EntryListView.prototype.constructor = EntryListView;

	EntryListView.DEFAULT_OPTIONS = {
		entryHeight: 44,
	};

	function _createList(argument) {
		var backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: 'white'
			}
		});
		this.add(backgroundSurface);

		var yOffset = 0;
		var entries = new EntryCollection().fetchEntries();
		for (var len = 0; len < entries.length; len++) {
			var entryModifier = new StateModifier({
				size: [undefined, this.options.entryHeight],
				transform: Transform.translate(0, yOffset, 0),
			});

			var entryView = new EntryView(entries[len]);
			this.add(entryModifier).add(entryView);
			this.entryViews.push(entryView);
			yOffset += this.options.entryHeight;
		}

	}
	module.exports = EntryListView;
});
