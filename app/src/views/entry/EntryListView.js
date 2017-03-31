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
	var Draggable = require('famous/modifiers/Draggable');
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

		this.trackEntryViews = [];
		this.deviceEntries = [];
		this.tagGroupEntries = [];

		this.deviceDataGroupViewList = [];
		this.inputWidgetGroupViewList = [];

		this.renderController = new RenderController();
		this.createList(this.entries, glowEntry, callback);
	}

	EntryListView.prototype = Object.create(View.prototype);
	EntryListView.prototype.constructor = EntryListView;

	EntryListView.DEFAULT_OPTIONS = {
		entryHeight: 110, //Entry height needs to changed in FixedRenderNode as well
		selectionPadding: 24,
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

		this.initDraggableViews();
		this.createScrollView();

		this.refreshEntries(entries, glowEntry, this.recentlyUsedTags, callback);
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

			this.deviceDataGroupViewList.push(trackEntryView);

			trackEntryView.on('delete-device-entry', function() {
				var indexOfTrackEntryView = this.trackEntryViews.indexOf(trackEntryView);

				if ((indexOfTrackEntryView > -1) && trackEntryView.children.length === 0) {
					this.trackEntryViews.splice(indexOfTrackEntryView, 1);
					this.draggableList.splice(indexOfTrackEntryView, 1);
				}

				this.scrollView.sequenceFrom(this.draggableList);
			}.bind(this));
		} else {
			draggableNode = new RenderNode(draggable);
			trackEntryView = new InputWidgetGroupView({
				entryDetails: entries, // An object containing grouped entries with tagDetails.
				scrollView: this.scrollView,
				draggable: draggable
			});

			this.inputWidgetGroupViewList.push(trackEntryView);
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

	EntryListView.prototype.createScrollView = function() {
		this.scrollNode.add(this.scrollView);
		this.scrollWrapperSurface.add(this.scrollNode);
		this.scrollView.sequenceFrom(this.draggableList);

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

		entries = this.entries;

		if (recentlyUsedTags instanceof Array) {
			this.recentlyUsedTags = recentlyUsedTags;
		}

		this.draggableList = [];
		this.trackEntryViews = [];
		this.deviceEntries = [];
		this.tagGroupEntries = [];
		this.deviceDataGroupViewList = [];
		this.inputWidgetGroupViewList = [];

		//Filter out the device data
		entries.forEach(function(entry) {
			if (entry.get('sourceName')) {
				var source = entry.get('sourceName');
				this.deviceEntries[source] = this.deviceEntries[source] || [];
				this.deviceEntries[source].push(entry);
			}
		}.bind(this));

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

		this.recentlyUsedTags.forEach(function(tagDetails) {
			var tagId = tagDetails.tagId;
			this.tagGroupEntries[tagId] = this.tagGroupEntries[tagId] || [];

			entries.forEach(function(entry) {
				if (entry.get('baseTagId') === tagId && !entry.get('sourceName')) {
					this.tagGroupEntries[tagId].push(entry);
				}
			}.bind(this));

			this.addEntry({entries: this.tagGroupEntries[tagId], tagDetails: tagDetails}, {areDeviceEntries: false});
		}.bind(this));

		for (var device in this.deviceEntries) {
			this.addEntry(this.deviceEntries[device], {areDeviceEntries: true});
		}

		this.scrollView.sequenceFrom(this.draggableList);
		this.scrollView.setPosition(0);
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
		if (this.tagIdOfInputWidgetGroupViewToGlow) {
			var inputWidgetGroupView = this.getInputWidgetGroupViewForTagId(this.tagIdOfInputWidgetGroupViewToGlow);
			if (inputWidgetGroupView) {
				var indexOfView = this.trackEntryViews.indexOf(inputWidgetGroupView);

				if (indexOfView === 0) {
					this.scrollView.setPosition(indexOfView);
				} else {
					this.scrollView.goToPage(indexOfView);
				}

				inputWidgetGroupView.drawerSurface.glow();
			}

			this.tagIdOfInputWidgetGroupViewToGlow = null;
		}

		if (this.entryIdOfInputWidgetViewToGlow) {
			var inputWidgetGroupView = this.getInputWidgetGroupViewForEntryId(this.entryIdOfInputWidgetViewToGlow);
			if (inputWidgetGroupView) {
				var indexOfView = this.trackEntryViews.indexOf(inputWidgetGroupView);

				if (indexOfView === 0) {
					this.scrollView.setPosition(indexOfView);
				} else {
					this.scrollView.goToPage(indexOfView);
				}

				inputWidgetGroupView.handleGlowEntry(this.entryIdOfInputWidgetViewToGlow);
			}

			this.entryIdOfInputWidgetViewToGlow = null;
		}

		if (callback) {
			callback();
		}
	};

	EntryListView.prototype.getTagDetailsFromRecentlyUsedTags = function(tagDescription) {
		return _.find(this.recentlyUsedTags, function(tagDetails) {
			return tagDetails.description === tagDescription;
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

	EntryListView.prototype.deleteEntry = function(entry) {
		var entryView = entry;
		if (entry instanceof Entry) {
			if (entry.isContinuous()) {
				return;
			} else {
				entryView = this.getTrackEntryView(entry.get('id'));
			}
		}

		if (entryView instanceof TrackEntryView) {
			var deletedSurfaceIndex = this.trackEntryViews.indexOf(entryView);
			this.trackEntryViews.splice(deletedSurfaceIndex, 1);
			this.draggableList.splice(deletedSurfaceIndex, 1);
			this.scrollView.sequenceFrom(this.draggableList);
		}
	};

	module.exports = EntryListView;
});
