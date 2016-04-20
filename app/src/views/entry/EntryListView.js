define(function(require, exports, module) {
	var View = require('famous/core/View'),
	Surface = require('famous/core/Surface'),
	Transform = require('famous/core/Transform'),
	Easing = require("famous/transitions/Easing"),
	Modifier = require('famous/core/Modifier'),
	StateModifier = require('famous/modifiers/StateModifier'),
	RenderController = require("famous/views/RenderController"),
	EntryCollection = require('models/EntryCollection'),
	Entry = require('models/Entry'),
	TrackEntryView = require('views/entry/TrackEntryView'),
	PinnedView = require('views/entry/PinnedView');
	var DeviceDataGroupView = require('views/entry/DeviceDataGroupView');
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

	Transitionable.registerMethod('snap',SnapTransition);

	var snap = { method:'snap', period:200, dampingRatio:0.4 };


	function EntryListView(collection, glowEntry) {
		View.apply(this, arguments);
		this.trackEntryViews = [];
		this.entries = collection;
		this.renderController = new RenderController();
		this.pinnedEntriesController = new RenderController();
		this.deviceEntries = [];
		_createList.call(this, this.entries, glowEntry);
	}

	EntryListView.prototype = Object.create(View.prototype);
	EntryListView.prototype.constructor = EntryListView;

	EntryListView.DEFAULT_OPTIONS = {
		entryHeight: 55, //Entry heigh needs to changed in FixedRenderNode as well
		selectionPadding: 24,
	};

	function _createList(entries, glowEntry) {
		var backgroundSurface = new Surface({
			classes: ['entry-list-background'],
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#ebebeb',
			}
		});

		this.add(new StateModifier({transform: Transform.translate(0,0,0)})).add(backgroundSurface);
		backgroundSurface.pipe(this._eventOutput);
		this.add(this.pinnedEntriesController);
		this.add(this.renderController);
		this.refreshEntries(entries, glowEntry);

	}

	EntryListView.prototype.addEntry = function(entry) {
		var draggable = new Draggable( {
			xRange: [-90, 0],
			yRange: [0, 0],
		});

		var draggableNode;
		var trackEntryView;
		if (entry instanceof Array) {
			draggableNode = new RenderNode(draggable);
		   trackEntryView = new DeviceDataGroupView({entry: entry,
			   entryZIndex: App.zIndex.readView + 2, scrollView: this.scrollView});
		} else {
			draggableNode = new FixedRenderNode(draggable);
			trackEntryView = new TrackEntryView({entry: entry})
		}
		trackEntryView.pipe(draggable);
		draggableNode.add(trackEntryView);
		trackEntryView.pipe(this.scrollView);
		this.trackEntryViews.push(trackEntryView);
		this.draggableList.push(draggableNode);
		//trackEntryView.pipe(this.scrollView);

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

		this.entryEventListeners(trackEntryView);
		return trackEntryView;
	}

	EntryListView.prototype.addPinnedEntry = function (entry) {
		var pinnedEntryView = new PinnedView({entry: entry});
		pinnedEntryView.entrySurface.setOptions({attributes: {id: 'entry-' + entry.id}});
		this.draggablePin.subscribe(pinnedEntryView.entrySurface);
		this.pinnedViews.push(pinnedEntryView);
		this.entryEventListeners(pinnedEntryView);
		return pinnedEntryView;
	}

	EntryListView.prototype.entryEventListeners = function (entryView) {
		entryView.on('delete-entry', function(entries) {
			console.log('EntryListView: Deleting an entry');
			if (entries && entries.fail) {
				console.log('EntryListView:85 failed to delete entry. Reloading cache');
				this._eventOutput.emit('delete-failed');
			} else {
				if (entryView instanceof TrackEntryView) {
					var deletedSurfaceIndex = this.trackEntryViews.indexOf(entryView);
					this.trackEntryViews.splice(deletedSurfaceIndex, 1);
					this.draggableList.splice(deletedSurfaceIndex, 1);
				} else {
					this.pinnedViews.splice(this.pinnedViews.indexOf(entryView), 1);
				}
			}
		}.bind(this));

		entryView.on('select-entry', function(entry) {
			console.log('EntryListView: Selecting an entry');
			if (entryView.select) {
				entryView.select();
			}
		}.bind(this));
	}

	EntryListView.prototype.initPinnedViews = function() {
		this.createDraggable();
		if (this.pinnedSequentialLayout) {
			this.pinnedEntriesController.hide({duration:0});
		}

		// TODO fix the item sizes to be true sizes
		this.pinnedSequentialLayout = new SequentialLayout({
			direction: 0,
		});

		this.pinnedSequentialLayout.nextYOffset = 40;

		this.pinnedSequentialLayout.setOutputFunction(function(input, offset, index) {
			//Bumping the offset to add additional padding on the left
			var lastView = this.pinnedSequentialLayout._items._.getValue(index-1);
			var size = [0,0];
			if (lastView) {
				size = lastView.getSize();
			}

			if (!size || !size[0]) {
				size = [0, 0];
			}

			var xOffset;
			// TODO for larger phones
			if (index == 0) {
				this.pinnedSequentialLayout.lastXOffset = 0;
				this.pinnedSequentialLayout.nextYOffset = 8;
			}
			xOffset = size[0] + 8;
			//console.log(this.pinnedSequentialLayout.lastXOffset + ':' + currentSize);
			if (_.contains(this.pinnedEdgeIndex, index)) {
				this.pinnedSequentialLayout.lastXOffset = 0;
				xOffset = 8;
				//console.log('EntryListView: heightOfPins: ' + this.heightOfPins());
				//console.log('EntryListView this.pinnedSequentialLayout index: ' + index);
				this.pinnedSequentialLayout.nextYOffset += 40;
				//console.log('EntryListView: Adding a pinned row: ' + this.pinnedSequentialLayout.nextYOffset);
			} else {
				xOffset += this.pinnedSequentialLayout.lastXOffset;
			}
			var transform = Transform.translate(xOffset, this.pinnedSequentialLayout.nextYOffset, App.zIndex.readView + 2);
			this.pinnedSequentialLayout.lastXOffset = xOffset;
			return {
				transform: transform,
				target: input.render()
			};
		}.bind(this));


	};

	EntryListView.prototype.refreshPinnedEntriesView = function(callback) {
		this.pinnedSequentialLayout.sequenceFrom(this.pinnedViews);
		var heightOfPins = Math.min(this.heightOfPins(), 150);
		var pinnedContainerSurface = new ContainerSurface({
			size: [undefined, true],
			classes: ['pin-container'],
			properties: {
				backgroundColor: '#ebebeb',
				padding: '23px 10px 10px 10px',
				overflowY: 'hidden',
				borderBottom: '8px solid #ebebeb'
			}
		});

		pinnedContainerSurface.on('deploy', function() {
			Timer.every(function() {
				pinnedContainerSurface.setSize([undefined, Math.min(this.heightOfPins(), 150) + 10]);
				/*pinnedContainerSurface.setProperties({
				height: Math.min(this.heightOfPins(), 150) + 'px',
				backgroundColor: '#ebebeb',
				overflowY: 'hidden'
			});*/
				this.minYRange = (this.heightOfPins() - 90);
				this.draggablePin.setOptions({
					yRange: [-Math.max(this.minYRange, 0), 0]
				});
			}.bind(this), 2);
		}.bind(this));
		var nodePlayer = new RenderNode();
		nodePlayer.add(this.draggablePin).add(this.pinnedSequentialLayout);
		pinnedContainerSurface.add(nodePlayer);
		this.pinnedEntriesController.inTransformFrom(function() {
			return Transform.translate(0, 0, App.zIndex.readView - 1);
		}.bind(this));
		this.pinnedEntriesController.show(pinnedContainerSurface, null, function() {
			this.handleGlowEntry(callback);
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

			var pos = this.scrollView.trans.get()

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
		this.scrollWrapperSurface.add(new Modifier({transform: Transform.translate(0, 0, 0)})).add(scrollerBackgroundSurface);

		this.renderController.inTransformFrom(function() {
			var heightOfPins = 20 + Math.min(this.heightOfPins(), 140);
			return Transform.translate(0, heightOfPins, App.zIndex.readView);
		}.bind(this));

		this.scrollModifier.transformFrom(function() {
			var heightOfPins = Math.min(this.heightOfPins(), 135);
			return Transform.translate(0, 0, App.zIndex.readView + 22);
		}.bind(this));

		this.renderController.show(this.scrollWrapperSurface, null, function() {
			this.handleGlowEntry(callback);
		}.bind(this));
	};

	EntryListView.prototype.refreshEntries = function(entries, glowEntry, callback) {
		this.glowEntry = glowEntry;
		this.minYRange = 0;
		var refreshPinEntries = (!glowEntry || glowEntry.isContinuous());
		var refreshDraggableEntries = (!glowEntry || !glowEntry.isContinuous());


		if (!entries && this.entries) {
			entries = EntryCollection.getFromCache(this.entries.key);
		}

		if (entries instanceof EntryCollection) {
			this.entries = entries;
		} else if (entries instanceof Array){
			this.entries = new EntryCollection(entries);
		} else {
			this.entries.set(entries);
		}

		entries = this.entries;

		if (refreshPinEntries) {
			this.pinnedViews = [];
			var bookmarkEntriesCount = 0;
			this.initPinnedViews();
		}

		if (refreshDraggableEntries) {
			this.trackEntryViews = [];
			this.draggableList = [];
			var nonBookmarkEntriesCount = 0;
			var entriesGroupedByDeviceData = {};
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

			if (entry.isContinuous() && refreshPinEntries) {
				bookmarkEntriesCount++;
				addedView = this.addPinnedEntry(entry);
			} else if (!entry.isContinuous() && refreshDraggableEntries){
				nonBookmarkEntriesCount++;
				addedView = this.addEntry(entry);
			}

			if (this.glowEntry) {
				if ((Number.isFinite(this.glowEntry) && entry.id == this.glowEntry) || (entry.id == this.glowEntry.id)) {
					this.glowView = addedView;
					if (!entry.isContinuous()) {
						this.glowView.position = nonBookmarkEntriesCount - 1;
					} else {
						this.glowView.position = bookmarkEntriesCount - 1;
					}
				}
			}
		}.bind(this));

		for (var device in this.deviceEntries) {
			this.addEntry(this.deviceEntries[device]);
		}

		if (refreshPinEntries) {
			this.refreshPinnedEntriesView(callback);
		}

		if (refreshDraggableEntries) {
			this.refreshDraggableEntriesView(callback);
		}
	};

	EntryListView.prototype.handleGlowEntry = function(callback) {
		if (this.glowView) {
			if (this.glowView.entry.isContinuous()) {
				this.draggablePin.setPosition([0, -this.pinPosition(this.glowView.position), 0]);
			} else {
				this.scrollView.goToPage(this.glowView.position);
			}
			this.glowView.glow();
		}
		if (callback) {
			callback();
		}
	};

	EntryListView.prototype.createDraggable = function() {
		this.min
		this.draggablePin = new Draggable({
			xRange: [0, 0],
			yRange: [-this.minYRange, 0]
		});
		this.draggablePin.on('update', function(e) {
			console.log(e);
		});
	};

	EntryListView.prototype.heightOfPins = function () {
		var numberOfRows = this.numberOfPinRows();
		return numberOfRows ? ((numberOfRows * 40) + 15) : 15;
	};

	EntryListView.prototype.pinPosition = function (index) {
		var numberOfRows = this.numberOfPinRows(index);
		return numberOfRows > 3 ? ((numberOfRows - 2) * 40) : 0;
	};

	EntryListView.prototype.numberOfPinRows = function (pinIndex) {
		var numberOfRows = this.pinnedViews.length ? 1 : 0;
		var rowWidthSoFar = 20;
		this.pinnedEdgeIndex = [];
		_.each(this.pinnedViews, function (pinnedView, index) {
			if (pinIndex <= index) {
				return;
			}
			rowWidthSoFar = rowWidthSoFar + pinnedView.getSize()[0] + 8; //adding padding after the tags
			if (rowWidthSoFar > (App.width - 10)) {
				numberOfRows ++;
				rowWidthSoFar = 20 + (pinnedView.getSize()[0] + 8);
				this.pinnedEdgeIndex.push(index);
			}
		}.bind(this));
		return numberOfRows;
	};

	EntryListView.prototype.blur = function() {
	}


	EntryListView.prototype.unBlur = function() {
	}

	module.exports = EntryListView;
});
