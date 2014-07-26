define(function(require, exports, module) {
	var View = require('famous/core/View'),
		Surface = require('famous/core/Surface'),
		Transform = require('famous/core/Transform'),
		Easing = require("famous/transitions/Easing"),
		Modifier = require('famous/core/Modifier'),
		StateModifier = require('famous/modifiers/StateModifier'),
		RenderController = require("famous/views/RenderController"),
		EntryCollection = require('models/EntryCollection'),
		EntryView = require('views/EntryView'),

		renderController = new RenderController();
	var TransitionableTransform = require("famous/transitions/TransitionableTransform");
	var TweenTransition = require('famous/transitions/TweenTransition');
	TweenTransition.registerCurve('inSine', Easing.inSine);

	function EntryListView(date) {
		View.apply(this, arguments);
		this.entryViews = [];
		this.entries = new EntryCollection().fetchEntries();
		_createList.call(this);
	}

	EntryListView.prototype = Object.create(View.prototype);
	EntryListView.prototype.constructor = EntryListView;

	EntryListView.DEFAULT_OPTIONS = {
		entryHeight: 44,
		selectionPadding: 24,
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
		for (var len = 0; len < this.entries.length; len++) {

			var entryModifier = new StateModifier({
				size: [undefined, this.options.entryHeight],
				transform: Transform.translate(0,yOffset,0)
			});
			var entryView = new EntryView(this.entries[len]);
			entryView.modifier = entryModifier;
			this.add(entryModifier).add(entryView);
			this.entryViews.push(entryView);
			yOffset += this.options.entryHeight;
			entryView.on('select-entry', function($data) {
				console.log('entry selected with id: ' + $data.id);
				this.selectEntryView($data);
			}.bind(this));
		}

	}

	EntryListView.prototype.selectEntryView = function(entry) {
		var yOffset = 0;
		for (var i = 0, len = this.entryViews.length; i < len; i++) {
			var entryView = this.entryViews[i];
			entryView.modifier.setTransform(
				Transform.translate(0, yOffset, 0), {
					curve: Easing.inOutQuad,
					duration: 1000
				}
			);
			yOffset += this.options.entryHeight;
			if (entryView.entry.id == entry.id) {
				console.log('Found the selected view');
				yOffset += this.options.selectionPadding;
			}
			entryView.selectio
		}
	}
	module.exports = EntryListView;
});
