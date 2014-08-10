define(function(require, exports, module) {
	var View = require('famous/core/View'),
		Surface = require('famous/core/Surface'),
		Transform = require('famous/core/Transform'),
		Easing = require("famous/transitions/Easing"),
		Modifier = require('famous/core/Modifier'),
		StateModifier = require('famous/modifiers/StateModifier'),
		RenderController = require("famous/views/RenderController"),
		EntryCollection = require('models/EntryCollection'),
		EntryView = require('views/entry/EntryView');
	var TransitionableTransform = require("famous/transitions/TransitionableTransform");
	var TweenTransition = require('famous/transitions/TweenTransition');
	TweenTransition.registerCurve('inSine', Easing.inSine);

	function EntryListView(collection) {
		View.apply(this, arguments);
		this.entryViews = [];
		this.entries = collection;
		this.renderController = new RenderController();
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
		this.add(this.renderController);
		this.nextYOffset = 0;
		this.entries.forEach(function(entry) {
			this.addEntry(entry, this.nextYOffset);
			this.nextYOffset += this.options.entryHeight;
		}.bind(this));

	}

	EntryListView.prototype.addEntry = function(entry) {
		var entryModifier = new StateModifier({
			size: [undefined, this.options.entryHeight],
			transform: Transform.translate(0, this.nextYOffset, 2)
		});
		var entryView = new EntryView(entry);
		entryView.modifier = entryModifier;
		this.add(entryModifier).add(entryView);
		this.entryViews.push(entryView);

		//Handle entry selection handler
		entryView.on('select-entry', function($data) {
			console.log('entry selected with id: ' + $data.id);
			this.selectEntryView($data);
		}.bind(this));

		entryView.on('delete-entry', function(entry) {
			console.log('EntryListView: Deleting an entry');
			this.entries.remove(entry);
			this.refreshEntries();
		}.bind(this));

		entryView.on('update-entry', function(resp) {
			console.log('EntryListView: Updating an entry');
			this.refreshEntries(resp.entries, resp.glowEntry);
		}.bind(this));
		return entryView;
	}

	EntryListView.prototype.selectEntryView = function(entry) {
		if (this.selectedEntryView != null) {
			//TODO if the entry is dirty send update
			this.selectedEntryView.hideFormView();
			this.selectedEntryView.formView.blur();
			this.unselectAllEntries();
		}

		this.nextYOffset = 0;
		for (var i = 0, len = this.entryViews.length; i < len; i++) {
			var entryView = this.entryViews[i];
			entryView.modifier.setTransform(
				Transform.translate(0, this.nextYOffset, 0), {
					curve: Easing.inOutQuad,
					duration: 1000
				}
			);


			this.nextYOffset += this.options.entryHeight;
			if (entryView.entry.id == entry.id) {
				this.selectedEntryView = entryView;
				console.log('Found the selected view');
				this.nextYOffset += this.options.selectionPadding;
			}
		}
	}

	EntryListView.prototype.unselectAllEntries = function(entry) {
		this.nextYOffset = 0;
		for (var i = 0, len = this.entryViews.length; i < len; i++) {
			var entryView = this.entryViews[i];
			entryView.modifier.setTransform(
				Transform.translate(0, this.nextYOffset, 0), {}
			);
			this.nextYOffset += this.options.entryHeight;
		}
	}

	EntryListView.prototype.refreshEntries = function(entries, glowEntry) {
		if (entries) {
			this.entries.set(entries);
		}
		this.nextYOffset = 0;
		var glowView = undefined;
		var lastIndex = 0;
		this.entries.each(function(entry, index) {
			lastIndex = index;
			var view = this.entryViews[index];
			if (view) {
				view.hideFormView();
				view.setEntry(entry);
			} else {
				//Add additional views if needed
				view = this.addEntry(entry, this.nextYOffset);
			}

			if ((glowEntry && entry.id == glowEntry.id) || entry.glow) {
				glowView = view;
			}

			this.nextYOffset += this.options.entryHeight;
		}.bind(this));

		//Hide additional views if all entries have been displayed
		for (var i = lastIndex + 1, len = this.entryViews.length; i < len; i++) {
			this.renderController.hide(this.entryViews[i]);
		}

		if (glowView) {
			glowView.glow();
		}
	}

	EntryListView.prototype.deleteEntry = function() {

	}

	module.exports = EntryListView;
});
