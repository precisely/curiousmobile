define(function(require, exports, module) {

	var View = require('famous/core/View'),
	Surface = require('famous/core/Surface'),
	Transform = require('famous/core/Transform'),
	Modifier = require('famous/core/Modifier'),
	StateModifier = require('famous/modifiers/StateModifier'),
	RenderController = require("famous/views/RenderController"),
	EntryCollection = require('models/EntryCollection'),
	Entry = require('models/Entry'),
	TrackEntryView = require('views/entry/TrackEntryView'),
	PinnedView = require('views/entry/PinnedView');
	var DeviceDataGroupView = require('views/entry/DeviceDataGroupView');
	var InputWidgetGroupView = require('views/entry/InputWidgetGroupView');
	var Scrollview = require("famous/views/Scrollview");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var RenderNode = require('famous/core/RenderNode');
	var Draggable = require('famous/modifiers/Draggable');
	var FixedRenderNode = require('util/FixedRenderNode');
	var Utility = require('famous/utilities/Utility');
	var Timer = require('famous/utilities/Timer');
	var Transitionable  = require('famous/transitions/Transitionable');
	var SnapTransition  = require('famous/transitions/SnapTransition');

	Transitionable.registerMethod('snap', SnapTransition);
	var snap = {method: 'snap', period: 200, dampingRatio: 0.4};

	function EntryListView(collection, glowEntry, sortedTags) {
		View.apply(this, arguments);
		this.trackEntryViews = [];
		this.entries = collection;
		this.sortedTags = sortedTags || [];
		this.renderController = new RenderController();
		this.deviceEntries = [];
		this.tagGroupEntries = [];
		this.createList(this.entries, glowEntry);
	}

	EntryListView.prototype = Object.create(View.prototype);
	EntryListView.prototype.constructor = EntryListView;

	EntryListView.DEFAULT_OPTIONS = {
		entryHeight: 55, //Entry heigh needs to changed in FixedRenderNode as well
		selectionPadding: 24,
	};

	EntryListView.prototype.createList = function(entries, glowEntry) {
		var backgroundSurface = new Surface({
			classes: ['entry-list-background'],
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#ebebeb',
			}
		});

		var backgroundSurfaceModifier = new StateModifier({
			transform: Transform.translate(0,0,0)
		}); 
		this.add(backgroundSurfaceModifier).add(backgroundSurface);

		backgroundSurface.pipe(this._eventOutput);

		this.renderControllerMod = new StateModifier({
			transform: Transform.translate(0, 0, 10)
		});
		this.add(this.renderControllerMod).add(this.renderController);

		this.refreshEntries(entries, glowEntry, this.sortedTags, null);
	};

	EntryListView.prototype.addEntry = function(entries, entryInfo) {
		var draggable = new Draggable({
			xRange: [-90, 0],
			yRange: [0, 0],
		});

		var draggableNode;
		var trackEntryView;

		if (entryInfo.areDeviceEntries) {
			draggableNode = new RenderNode(draggable);

			trackEntryView = new DeviceDataGroupView({
				entry: entries,
				entryZIndex: App.zIndex.readView + 2,
				scrollView: this.scrollView
			});

			trackEntryView.on('delete-device-entry', function() {
				var indexOfTrackEntryView = this.trackEntryViews.indexOf(trackEntryView);

				if ((indexOfTrackEntryView > -1) && trackEntryView.children.length === 0) {
					this.trackEntryViews.splice(indexOfTrackEntryView, 1);
					this.draggableList.splice(indexOfTrackEntryView, 1);
				}

				this.scrollView.sequenceFrom(this.draggableList);
			}.bind(this));
		} else {
			draggableNode = new FixedRenderNode(draggable);
			trackEntryView = new InputWidgetGroupView({
				entryDetails: entries, // An object containing grouped entries with tag.
				scrollView: this.scrollView
			})
		}

		trackEntryView.pipe(draggable);
		draggableNode.add(trackEntryView);
		trackEntryView.pipe(this.scrollView);

		this.trackEntryViews.push(trackEntryView);
		this.draggableList.push(draggableNode);

		var snapTransition = {
			method: 'snap',
			period: 300,
			dampingRatio: 0.3,
			velocity: 0
		};
		trackEntryView.on('touchend', function(e) {
			console.log('EventHandler: trackEntryView event: mouseup');
			var distance = Math.abs(draggable.getPosition()[0]);
			if (distance < 85) {
				draggable.setPosition([0,0,0], snapTransition);
			}
		}.bind(trackEntryView));

		this.addEntryEventListeners(trackEntryView);

		return trackEntryView;
	};

	EntryListView.prototype.addEntryEventListeners = function(entryView) {
		entryView.on('delete-entry', function(entries) {
			console.log('EntryListView: Deleting an entry');
			if (entries && entries.fail) {
				console.log('EntryListView:85 failed to delete entry. Reloading cache');
				this._eventOutput.emit('delete-failed');
			} else {
				this.deleteEntry(entryView);
			}
		}.bind(this));

		entryView.on('select-entry', function(entry) {
			console.log('EntryListView: Selecting an entry');
			if (entryView.select) {
				entryView.select();
			}
		}.bind(this));
	};

	EntryListView.prototype.initDraggableViews = function() {
		this.draggableList = [];
		if (this.scrollView) {
			this.renderController.hide({duration:0});
		}
		this.scrollModifier = new Modifier();
		this.scrollModifier.sizeFrom(function(){
			if (this.pinnedViews) {
				return [320,window.App.height - 185 - Math.min(this.heightOfPins(), 140)]
			} else {
				return [320,window.App.height - 185]
			}
		}.bind(this));

		this.scrollWrapperSurface = new ContainerSurface({
			size: [undefined, undefined],
			properties: {
				overflow: 'hidden',
				backgroundColor: '#fff'
			}
		});

		this.scrollNode = new RenderNode(this.scrollModifier);
		this.scrollView = new Scrollview({
			direction: 1,
			defaultitemsize: [320, 55],
			itemspacing: 0,
			friction: 0.06,
			edgeDamp: 0.5
		});

		this.scrollView.trans = new Transitionable(0);

		// Vertical offset this.scrollView will start load at
		this.scrollView.refreshOffset = 80;

		// Reset scroller to default behavior
		this.scrollView.reset = function(){
			this.scrollView._scroller.positionFrom(this.scrollView.getPosition.bind(this.scrollView));
		}.bind(this);

		this.scrollView.sync.on('start',function(){

			this.scrollView.trans.halt();

			var pos = this.scrollView.trans.get();

			if (pos != 0) this.scrollView.setPosition(pos);

			this.scrollView.reset()

		}.bind(this));

		this.scrollView.sync.on('end',function(){

			var pos = this.scrollView.getPosition();

			if (pos < (-this.scrollView.refreshOffset)) {

				this.scrollView.trans.halt();
				this.scrollView.trans.set(pos);

				this.scrollView._scroller.positionFrom(function(){
					return this.scrollView.trans.get();
				}.bind(this));
			} else {
				this.scrollView.trans.halt();
				this.scrollView.trans.set(0);
			}
		}.bind(this));
	};

	EntryListView.prototype.refreshDraggableEntriesView = function(callback) {
		this.scrollNode.add(this.scrollView);
		this.scrollWrapperSurface.add(this.scrollNode);
		this.scrollView.sequenceFrom(this.draggableList);

		var scrollerBackgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#fff',
			}
		});

		var scrollWrapperSurfaceModifier = new Modifier({
			transform: Transform.translate(0, 0, 0)
		});

		this.scrollWrapperSurface.add(scrollWrapperSurfaceModifier).add(scrollerBackgroundSurface);

		this.scrollModifier.transformFrom(function() {
			return Transform.translate(0, 0, App.zIndex.readView + 22);
		}.bind(this));

		this.renderController.show(this.scrollWrapperSurface, null, function() {
			this.handleGlowEntry(callback);
		}.bind(this));
	};

	EntryListView.prototype.refreshEntries = function(entries, glowEntry, sortedTags, callback) {
		this.glowEntry = glowEntry;
		this.minYRange = 0;

		var refreshDraggableEntries = (!glowEntry || glowEntry.refreshAll || !glowEntry.isContinuous());

		if (!entries && this.entries) {
			entries = EntryCollection.getFromCache(this.entries.key);
		}

		if (entries instanceof EntryCollection) {
			this.entries = entries;
		} else if (entries instanceof Array){
			this.entries = EntryCollection.sortDescByTime(new EntryCollection(entries));
		} else {
			this.entries.set(entries);
		}

		entries = this.entries;

		if (refreshDraggableEntries) {
			this.trackEntryViews = [];
			this.nonBookmarkEntries = [];
			this.draggableList = [];
			var nonBookmarkEntriesCount = 0;
			this.initDraggableViews();
		}

		//Filter out the device data
		entries.forEach(function(entry) {
			var addedView = null;
			if (entry.get('sourceName') && refreshDraggableEntries) {
				var source = entry.get('sourceName');
				this.deviceEntries[source] = this.deviceEntries[source] || [];
				this.deviceEntries[source].push(entry);
				return;
			}

			if (this.glowEntry) {
				if ((Number.isFinite(this.glowEntry) && entry.id == this.glowEntry) || (entry.id == this.glowEntry.id)) {
					this.glowView = addedView;
					if (!entry.isContinuous()) {
						this.glowView.position = nonBookmarkEntriesCount - 1;
					}
				}
			}
		}.bind(this));

		if (sortedTags) {
			this.sortedTags = sortedTags;
		}

		this.sortedTags.forEach(function(tag) {
			var tagId = tag.tagId;
			this.tagGroupEntries[tagId] = this.tagGroupEntries[tagId] || [];

			entries.forEach(function(entry) {
				if (entry.get('tagId') === tagId && !entry.get('sourceName')) {
					this.tagGroupEntries[tagId].push(entry);
				}
			}.bind(this));

			if (this.tagGroupEntries[tagId].length > 0) {
				this.addEntry({entries: this.tagGroupEntries[tagId], tag: tag}, {areDeviceEntries: false});
			}
		}.bind(this));

		for (var device in this.deviceEntries) {
			this.addEntry(this.deviceEntries[device], {areDeviceEntries: true});
		}

		if (refreshDraggableEntries) {
			this.refreshDraggableEntriesView(callback);
		}
	};

	EntryListView.prototype.handleGlowEntry = function(callback) {
		if (this.glowView) {
			if (this.glowView.entry.isContinuous()) {
				var entryToDelete = this.getEntry(this.glowView.entry.id);
				if (entryToDelete) {
					var deletedSurfaceIndex = this.nonBookmarkEntries.indexOf(entryToDelete[0]);
					this.nonBookmarkEntries.splice(deletedSurfaceIndex, 1);
					this.trackEntryViews.splice(deletedSurfaceIndex, 1);
					this.draggableList.splice(deletedSurfaceIndex, 1);
				}
				setTimeout(function() {
					this.glowView.glow();
				}.bind(this), 100);
			} else {
				setTimeout(function() {
					this.scrollView.goToPage(this.trackEntryViews.indexOf(this.glowView));
					this.glowView.glow();
				}.bind(this), 100);
			}

		}
		if (callback) {
			callback();
		}
	};

	EntryListView.prototype.getEntry = function(entryId) {
		var entryList = _.filter(this.nonBookmarkEntries, function(entry) {
			return entry.id === entryId;
		});

		return entryList[0];
	};

	EntryListView.prototype.getTrackEntryView = function(entryId) {
		var trackEntryViewList = _.filter(this.trackEntryViews, function(trackEntryView) {
			return trackEntryView.entry.id === entryId;
		});

		return trackEntryViewList[0];
	};

	EntryListView.prototype.deleteEntry = function(entry) {
		var entryView = entry;
		if (entry instanceof Entry) {
			if (entry.isContinuous()) {
			} else {
				entryView = this.getTrackEntryView(entry.get('id'));
			}
		}

		if (entryView instanceof TrackEntryView) {
			var deletedSurfaceIndex = this.trackEntryViews.indexOf(entryView);
			this.nonBookmarkEntries.splice(deletedSurfaceIndex, 1);
			this.trackEntryViews.splice(deletedSurfaceIndex, 1);
			this.draggableList.splice(deletedSurfaceIndex, 1);
			this.scrollView.sequenceFrom(this.draggableList);
		}
	};

	module.exports = EntryListView;
});
