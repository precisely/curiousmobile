define(function(require, exports, module) {

	'use strict';

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
	var FixedRenderNode = require('util/FixedRenderNode');
	var Utility = require('famous/utilities/Utility');
	var Timer = require('famous/utilities/Timer');
	var Transitionable  = require('famous/transitions/Transitionable');
	var SnapTransition  = require('famous/transitions/SnapTransition');

	Transitionable.registerMethod('snap', SnapTransition);
	var snap = {method: 'snap', period: 200, dampingRatio: 0.4};

	function EntryListView(collection, glowEntry, recentlyUsedTags, callback) {
		View.apply(this, arguments);

		this.entries = collection;
		this.recentlyUsedTags = recentlyUsedTags || [];

		this.initializeEntryViewList();

		this.renderController = new RenderController();
		this.createList(this.entries, glowEntry, callback);
	}

	EntryListView.prototype = Object.create(View.prototype);
	EntryListView.prototype.constructor = EntryListView;

	EntryListView.DEFAULT_OPTIONS = {
		entryHeight: 110, //Entry height needs to changed in FixedRenderNode as well
		selectionPadding: 24,
	};

	EntryListView.prototype.initializeEntryViewList = function() {
		// List of all views added to this EntryListView.
		this.trackEntryViews = [];

		// For legacy entries and its view(TrackEntryView) list.
		this.legacyEntries = [];
		this.legacyEntryViewList = [];

		// For device entries and its view(DeviceDataGroupView) list.
		this.deviceEntries = [];
		this.deviceDataGroupViewList = [];

		// For input widget entries and its view(InputWidgetGroupView) list.
		this.inputWidgetEntries = [];
		this.inputWidgetGroupViewList = [];
	};

	EntryListView.prototype.createList = function(entries, glowEntry, callback) {
		var backgroundSurface = new Surface({
			classes: ['entry-list-background'],
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#D3D3D3',
			}
		});

		var backgroundSurfaceModifier = new StateModifier({
			transform: Transform.translate(0, 5 ,0)
		});
		this.add(backgroundSurfaceModifier).add(backgroundSurface);

		backgroundSurface.pipe(this._eventOutput);

		this.renderControllerMod = new StateModifier({
			transform: Transform.translate(0, 5, 10)
		});
		this.add(this.renderControllerMod).add(this.renderController);

		this.initEntryViews();
		this.createScrollView();

		this.refreshEntries(entries, glowEntry, this.recentlyUsedTags, callback);
	};

	EntryListView.prototype.addEntry = function(entries, entryInfo) {
		var trackEntryView;

		if (entryInfo.areDeviceEntries) {
			trackEntryView = new DeviceDataGroupView({
				entry: entries,
				entryZIndex: App.zIndex.readView + 2,
				scrollView: this.scrollView
			});

			this.deviceDataGroupViewList.push(trackEntryView);

			trackEntryView.on('delete-device-entry', this.deleteLegacyEntryView.bind(this, trackEntryView));
		} else if (entryInfo.areInputWidgetEntries) {
			trackEntryView = new InputWidgetGroupView({
				entryDetails: entries, // An object containing grouped entries with tagDetails.
				entryListView: this
			});

			this.inputWidgetGroupViewList.push(trackEntryView);
		} else if (entryInfo.isLegacyEntry) {
			trackEntryView = new TrackEntryView({entry: entries});
			trackEntryView.on('delete-entry', this.deleteLegacyEntryView.bind(this, trackEntryView));
			this.legacyEntryViewList.push(trackEntryView);
		}

		trackEntryView.pipe(this.scrollView);

		this.trackEntryViews.push(trackEntryView);

		this.addEntryEventListeners(trackEntryView);

		return trackEntryView;
	};

	EntryListView.prototype.addEntryEventListeners = function(entryView) {
		entryView.on('delete-failed', function() {
			this._eventOutput.emit('delete-failed');
		}.bind(this));
	};

	EntryListView.prototype.initEntryViews = function() {
		if (this.scrollView) {
			this.renderController.hide({duration:0});
		}
		this.containerSurfaceModifier = new Modifier();
		this.containerSurfaceModifier.sizeFrom(function(){
			return [320, window.App.height - 185];
		}.bind(this));

		this.scrollWrapperSurface = new ContainerSurface({
			size: [undefined, undefined],
			properties: {
				overflow: 'hidden',
				backgroundColor: '#D3D3D3'
			},
			attributes: {
				id: 'scroll-wrapper-surface'
			}
		});

		this.scrollNode = new RenderNode(this.containerSurfaceModifier);
		this.scrollView = new Scrollview({
			direction: 1,
			defaultitemsize: [320, 110],
			itemspacing: 0,
			friction: 0.06,
			edgeDamp: 0.5
		});

		this.scrollView.trans = new Transitionable(0);

		// Vertical offset this.scrollView will start load at
		this.scrollView.refreshOffset = 120;

		// Reset scroller to default behavior
		this.scrollView.reset = function() {
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

	EntryListView.prototype.createScrollView = function() {
		this.scrollNode.add(this.scrollView);
		this.scrollWrapperSurface.add(this.scrollNode);
		this.scrollView.sequenceFrom(this.trackEntryViews);

		var scrollerBackgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#D3D3D3',
			},
			attributes: {
				id: 'scroll-bg-surface'
			}
		});

		var scrollWrapperSurfaceModifier = new Modifier({
			transform: Transform.translate(0, 0, 0)
		});

		this.scrollWrapperSurface.add(scrollWrapperSurfaceModifier).add(scrollerBackgroundSurface);

		this.containerSurfaceModifier.transformFrom(function() {
			return Transform.translate(0, 0, App.zIndex.readView + 22);
		}.bind(this));

		this.renderController.show(this.scrollWrapperSurface);
	};

	EntryListView.prototype.refreshEntries = function(entries, glowEntry, recentlyUsedTags, callback) {
		this.renderController.hide({duration: 0});

		this.glowEntry = glowEntry;
		this.minYRange = 0;

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

		entries = new EntryCollection(this.entries.models);

		if (recentlyUsedTags instanceof Array) {
			this.recentlyUsedTags = recentlyUsedTags;
		}

		this.initializeEntryViewList();

		// Sorting Alphabetically in ascending order.
		this.recentlyUsedTags.sort(function(a, b) {
			if (a.description < b.description) {
				return -1;
			} else if (a.description > b.description) {
				return 1;
			} else {
				return 0;
			}
		});

		// Adding InputWidget entries.
		this.recentlyUsedTags.forEach(function(tagDetails) {
			var tagId = tagDetails.tagId;
			this.inputWidgetEntries[tagId] = this.inputWidgetEntries[tagId] || [];
			entries.forEach(function(entry) {
				if (entry.get('tagId') === tagId && !entry.isContinuous()) {
					this.inputWidgetEntries[tagId].push(entry);
				}
			}.bind(this));
			entries.remove(this.inputWidgetEntries[tagId]);

			this.addEntry({entries: this.inputWidgetEntries[tagId], tagDetails: tagDetails},
					{areInputWidgetEntries: true});
		}.bind(this));

		// Adding legacy entries.
		entries.forEach(function(entry) {
			if (!entry.get('sourceName') && !entry.isContinuous()) {
				this.legacyEntries.push(entry);
				this.addEntry(entry, {isLegacyEntry: true});
			}
		}.bind(this));
		entries.remove(this.legacyEntries);

		// Filter out the device data
		entries.forEach(function(entry) {
			if (entry.get('sourceName') && !entry.isContinuous()) {
				var source = entry.get('sourceName');
				this.deviceEntries[source] = this.deviceEntries[source] || [];
				this.deviceEntries[source].push(entry);
			}
		}.bind(this));

		for (var device in this.deviceEntries) {
			this.addEntry(this.deviceEntries[device], {areDeviceEntries: true});
		}

		this.scrollView.setPosition(0);
		this.scrollView.goToPage(0);
		this.scrollView.sequenceFrom(this.trackEntryViews);
		this.renderController.show(this.scrollWrapperSurface, {duration: 1000}, function() {
			this.handleGlowEntry(callback);
		}.bind(this));
	};

	EntryListView.prototype.addNewInputWidget = function(tagDescription) {
		var tagDetails = this.getTagDetailsFromRecentlyUsedTags(tagDescription);

		if (!tagDetails) {
			tagDetails = this.getTagDetailsFromAllTagsWithInputTypeList(tagDescription);
			if (!tagDetails) {
				return;
			} else {
				this.recentlyUsedTags.push(tagDetails);
			}
		}

		this.tagIdOfInputWidgetGroupViewToGlow = tagDetails.tagId;

		this.refreshEntries();
	};

	EntryListView.prototype.getTagDetailsFromAllTagsWithInputTypeList = function(tagDescription) {
		return window.tagWithInputTypeAutoComplete.taginputTypeMap.get(tagDescription);
	};

	EntryListView.prototype.handleGlowEntry = function(callback) {
		if (this.glowEntry instanceof Entry) {
			this.idOfEntryToGlow = this.glowEntry.get('id');
			this.glowEntry = null;
		}

		if (this.tagIdOfInputWidgetGroupViewToGlow) {
			var inputWidgetGroupView = this.getInputWidgetGroupViewForTagId(this.tagIdOfInputWidgetGroupViewToGlow);
			if (inputWidgetGroupView) {
				this.scrollToTrackEntryView(inputWidgetGroupView);
				inputWidgetGroupView.drawerSurface.glow();
			}

			this.tagIdOfInputWidgetGroupViewToGlow = null;
		}

		if (this.idOfEntryToGlow) {
			// First look for entry in InputWidgetGroupView (new entry view).
			var trackEntryView = this.getInputWidgetGroupViewForEntryId(this.idOfEntryToGlow);
			if (trackEntryView) {
				trackEntryView.handleGlowEntry(this.idOfEntryToGlow);
			} else {
				// Then look for entry in TrackEntryView (legacy entry view).
				trackEntryView = this.getLegacyEntryViewForEntryId(this.idOfEntryToGlow);
				if (trackEntryView) {
					this.scrollToTrackEntryView(trackEntryView);
					trackEntryView.glow();
				}
			}

			this.idOfEntryToGlow = null;
		}

		if (callback) {
			callback();
		}
	};

	EntryListView.prototype.scrollToTrackEntryView = function(trackEntryView) {
		var indexOfTrackEntryView = this.trackEntryViews.indexOf(trackEntryView);

		if (indexOfTrackEntryView >= 0) {
			if (indexOfTrackEntryView === 0) {
				this.scrollView.setPosition(indexOfTrackEntryView);
			}

			this.scrollView.goToPage(indexOfTrackEntryView);
		}
	};

	EntryListView.prototype.getTagDetailsFromRecentlyUsedTags = function(tagDescription) {
		return _.find(this.recentlyUsedTags, function(tagDetails) {
			return tagDetails.description === tagDescription;
		});
	};

	EntryListView.prototype.getLegacyEntryViewForEntryId = function(entryId) {
		return _.find(this.legacyEntryViewList, function(trackEntryView) {
			return trackEntryView.entry.get('id') === entryId;
		});
	};

	EntryListView.prototype.getInputWidgetGroupViewForEntryId = function(entryId) {
		return _.find(this.inputWidgetGroupViewList, function(inputWidgetGroupView) {
			var entry = _.find(inputWidgetGroupView.inputWidgetViewList, function(inputWidgetView) {
				return inputWidgetView.entry.get('id') === entryId;
			});

			return (entry ? true : false);
		});
	};

	EntryListView.prototype.getInputWidgetGroupViewForTagId = function(tagId) {
		return _.find(this.inputWidgetGroupViewList, function(inputWidgetGroupView) {
			return inputWidgetGroupView.tagInputType.tagId === tagId;
		});
	};

	EntryListView.prototype.getLegacyEntryViewForEntry = function(entry) {
		return _.find(this.legacyEntryViewList, function(trackEntryView) {
			return trackEntryView.entry.get('id') === entry.get('id');
		});
	};

	EntryListView.prototype.deleteLegacyEntryViewForEntry = function(entry) {
		this.deleteLegacyEntryView(this.getLegacyEntryViewForEntry(entry));
	};

	EntryListView.prototype.deleteLegacyEntryView = function(legacyEntryView) {
		var indexOfLegacyEntryView = this.trackEntryViews.indexOf(legacyEntryView);

		if ((indexOfLegacyEntryView > -1)) {
			this.trackEntryViews.splice(indexOfLegacyEntryView, 1);
		}

		this.scrollView.sequenceFrom(this.trackEntryViews);
	};

	module.exports = EntryListView;
});
