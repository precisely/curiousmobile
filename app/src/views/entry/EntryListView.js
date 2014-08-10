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
	var SequentialLayout = require("famous/views/SequentialLayout");
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
		this.refreshEntries();

	}

	EntryListView.prototype.addEntry = function(entry) {
		var formView = false;
		if (this.selectedEntry && entry.id == this.selectedEntry.id) {
			formView = true;	
		}
		var entryView = new EntryView(entry, formView);
		this.entryViews.push(entryView);

		//Handle entry selection handler
		entryView.on('select-entry', function(entry) {
			console.log('entry selected with id: ' + entry.id);
			this.selectedEntry = entry;
			this.refreshEntries();
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

	EntryListView.prototype.refreshEntries = function(entries, glowEntry) {
		this.entryViews = [];
		if (entries) {
			this.entries.set(entries);
		}

		if (this.sequentialLayout) {
			this.renderController.hide(this.sequentialLayout);
		}

		this.selectedIndex = undefined;
		this.sequentialLayout = new SequentialLayout({
			direction: 1,
			defaultItemSize: [undefined, 44],
			itemSpacing: 0,
		});
		this.entries.forEach(function(entry) {
			this.addEntry(entry);
		}.bind(this));

		this.sequentialLayout.setOutputFunction(function(input, offset, index) {
			//Bumping the offset to add additional padding on the left
			var currentView = this.entryViews[index];
			if (!currentView) {
				return;
			}
			if (this.selectedEntry && currentView.entry.id == this.selectedEntry.id) {
				this.selectedView = currentView;
				this.selectedIndex = index;	
			}
			if (this.selectedIndex && index > this.selectedIndex) {
				offset += 20;
			}
			var transform = Transform.translate(0, offset);
			return {
				transform: transform,
				target: input.render()
			};
		}.bind(this));

		this.sequentialLayout.sequenceFrom(this.entryViews);
		this.renderController.show(this.sequentialLayout);
	}

	EntryListView.prototype.deleteEntry = function() {

	}

	module.exports = EntryListView;
});
