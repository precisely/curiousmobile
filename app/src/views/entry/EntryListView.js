define(function(require, exports, module) {
	var View = require('famous/core/View'),
		Surface = require('famous/core/Surface'),
		Transform = require('famous/core/Transform'),
		Easing = require("famous/transitions/Easing"),
		Modifier = require('famous/core/Modifier'),
		StateModifier = require('famous/modifiers/StateModifier'),
		RenderController = require("famous/views/RenderController"),
		EntryCollection = require('models/EntryCollection'),
		EntryView = require('views/entry/EntryView'),

		renderController = new RenderController();
	var TransitionableTransform = require("famous/transitions/TransitionableTransform");
	var TweenTransition = require('famous/transitions/TweenTransition');
	TweenTransition.registerCurve('inSine', Easing.inSine);

	function EntryListView(collection) {
		View.apply(this, arguments);
		this.entryViews = [];
		this.entries = collection;
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
		backgroundSurface.pipe(this._eventOutput);
		var yOffset = 0;
		this.entries.forEach(function(entry) {

			var entryModifier = new StateModifier({
				size: [undefined, this.options.entryHeight],
				transform: Transform.translate(0, yOffset, 2)
			});
			var entryView = new EntryView(entry);
			entryView.modifier = entryModifier;
			this.add(entryModifier).add(entryView);
			this.entryViews.push(entryView);
			yOffset += this.options.entryHeight;

			//Handle entry selection handler
			entryView.on('select-entry', function($data) {
				console.log('entry selected with id: ' + $data.id);
				this.selectEntryView($data);
			}.bind(this));
		}.bind(this));

	}

	EntryListView.prototype.selectEntryView = function(entry) {
		if (this.selectedEntryView != null) {
			//TODO if the entry is dirty send update
			this.selectedEntryView.hideFormView();
			this.unselectAllEntries();
		}
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
				this.selectedEntryView = entryView;
				console.log('Found the selected view');
				yOffset += this.options.selectionPadding;
			}
		}
	}

	EntryListView.prototype.unselectAllEntries = function(entry) {
		var yOffset = 0;
		for (var i = 0, len = this.entryViews.length; i < len; i++) {
			var entryView = this.entryViews[i];
			entryView.modifier.setTransform(
				Transform.translate(0, yOffset, 0), {}
			);
			yOffset += this.options.entryHeight;
		}
	}

	module.exports = EntryListView;
});
