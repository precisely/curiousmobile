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
	EntryReadView = require('views/entry/EntryReadView'),
	PinnedView = require('views/entry/PinnedView');
	var Scrollview = require("famous/views/Scrollview");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var RenderNode = require('famous/core/RenderNode');
	var Draggable = require('famous/modifiers/Draggable');
	var FixedRenderNode = require('util/FixedRenderNode');
	var Utility = require('famous/utilities/Utility');
	var Timer = require('famous/utilities/Timer');
	//var Scrollview = require('famous/views/Scrollview');
	var Transitionable  = require('famous/transitions/Transitionable');
	var SnapTransition  = require('famous/transitions/SnapTransition');

	Transitionable.registerMethod('snap',SnapTransition);

	var snap = { method:'snap', period:200, dampingRatio:0.4 };


	function EntryListView(collection) {
		View.apply(this, arguments);
		this.entryReadViews = [];
		this.entries = collection;
		this.renderController = new RenderController();
		this.pinnedEntriesController = new RenderController();

		this.spinnerSurface = new Surface({
			content: '<i class="fa fa-spinner fa-spin"> </i>',	
			size: [320, 40],
			properties: {
				textAlign: 'center',
				color: 'black'
			}
		});

		_createList.call(this, this.entries);
	}

	EntryListView.prototype = Object.create(View.prototype);
	EntryListView.prototype.constructor = EntryListView;

	EntryListView.DEFAULT_OPTIONS = {
		entryHeight: 55, //Entry heigh needs to changed in FixedRenderNode as well
		selectionPadding: 24,
	};

	function _createList(entries) {
		var backgroundSurface = new Surface({
			size: [320, 543],
			properties: {
				backgroundColor: 'white',
			}
		});
		this.add(backgroundSurface);
		backgroundSurface.pipe(this._eventOutput);
		this.add(this.pinnedEntriesController);
		this.add(this.renderController);
		this.refreshEntries(entries);

	}

	EntryListView.prototype.addEntry = function(entry) {
		var draggable = new Draggable( {
			xRange: [-100, 0],
			yRange: [0, 0],
		});

		var draggableNode = new FixedRenderNode(draggable);
		var entryReadView = new EntryReadView(entry);
		entryReadView.pipe(draggable);
		draggableNode.add(entryReadView);
		entryReadView.pipe(this.scrollView);
		this.entryReadViews.push(entryReadView);
		this.draggableList.push(draggableNode);
		//entryReadView.pipe(this.scrollView);

		var snapTransition = {
			method: 'snap',
			period: 300,
			dampingRatio: 0.3,
			velocity: 0
		};
		entryReadView.on('touchend', function(e) {
			console.log('EventHandler: entryReadView event: mouseup');
			var distance = Math.abs(draggable.getPosition()[0]);
			if (distance < 85) {
				draggable.setPosition([0,0,0], snapTransition);
			}
		}.bind(entryReadView));

		this.entryEventListeners(entryReadView);

		return entryReadView;
	}

	EntryListView.prototype.addPinnedEntry = function (entry) {
		var pinnedEntryView = new PinnedView(entry);
		this.pinnedViews.push(pinnedEntryView);
		this.entryEventListeners(pinnedEntryView);
	}

	EntryListView.prototype.entryEventListeners = function (entryView) {
		entryView.on('delete-entry', function(entries) {
			console.log('EntryListView: Deleting an entry');
			if (entries.fail) {
				console.log('EntryListView:85 failed to delete entry. Reloading cache');
				this._eventOutput.emit('delete-failed');
			} else {
				this.refreshEntries(entries);
			}
		}.bind(this));

		entryView.on('select-entry', function(entry) {
			console.log('EntryListView: Selecting an entry');
			this._eventOutput.emit('select-entry', entry);
		}.bind(this));
	}

	EntryListView.prototype.refreshEntries = function(entries, glowEntry) {
		this.entryReadViews = [];
		this.pinnedViews = [];
		this.draggableList = [];

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

		if (this.scrollView) {
			this.renderController.hide({duration:0});
		}

		if (this.pinnedSequentialLayout) {
			this.pinnedEntriesController.hide({duration:0});
		}

		// TODO fix the item sizes to be true sizes
		this.pinnedSequentialLayout = new SequentialLayout({
			direction: 0,
		});

		this.pinnedSequentialLayout.nextYOffset = 36;

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
				this.pinnedSequentialLayout.nextYOffset += 34;
				//console.log('EntryListView: Adding a pinned row: ' + this.pinnedSequentialLayout.nextYOffset);
			} else {
				xOffset += this.pinnedSequentialLayout.lastXOffset;	
			}
			var transform = Transform.translate(xOffset, this.pinnedSequentialLayout.nextYOffset, App.zIndex.readView);
			this.pinnedSequentialLayout.lastXOffset = xOffset;
			return {
				transform: transform,
				target: input.render()
			};
		}.bind(this));
		var scrollModifier = new Modifier();
		scrollModifier.sizeFrom(function(){
			if (this.pinnedViews) {
				return [320,window.App.height - 185 - this.heightOfPins()]
			} else {

				return [320,window.App.height - 185]
			}
		}.bind(this));
		var scrollWrapperSurface = new ContainerSurface({
			properties: {
				overflow: 'hidden',	
			}	
		});

		var scrollNode = new RenderNode(scrollModifier);
		this.scrollView = new Scrollview({
			direction: 1,
			defaultitemsize: [320, 55],
			itemspacing: 0,
		});

		this.scrollView.trans = new Transitionable(0);

		// Vertical offset this.scrollView will start load at
		this.scrollView.refreshOffset = 40;

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
				this.renderController.hide({duration:0});
				this.renderController.show(this.spinnerSurface, {duration: 0});
				Timer.setTimeout(function() {
					this._eventOutput.emit('refresh-entries');
				}.bind(this), 1000);
				console.log('EntryListView: Need to refresh on pull');
			} else {
				this.scrollView.trans.halt();
				this.scrollView.trans.set(0);
			}
		}.bind(this));

		scrollNode.add(this.scrollView);
		scrollWrapperSurface.add(scrollNode);
		entries.forEach(function(entry) {
			if (entry.isContinuous()) {
				this.addPinnedEntry(entry);
			} else {
				this.addEntry(entry);
			}
		}.bind(this));

		this.scrollView.sequenceFrom(this.draggableList);
		this.pinnedSequentialLayout.sequenceFrom(this.pinnedViews);

		var pinnedContainerSurface = new ContainerSurface({
			classes: ['pin-container'],
			properties: {
				backgroundColor: '#ebebeb',
			}	
		});


		var pinnedHelp = new Surface({
			content: 'PINNED TAGS: (tap to add tag to your list below)',	
			size: [undefined, 11],
			properties: {
				color: '#aeaeae',
				fontSize: '11px'
			}
		});
		var pinnedHelpModifier = new Modifier({
			transform: Transform.translate(14, 0, 0)
		});
		pinnedContainerSurface.add(pinnedHelpModifier).add(pinnedHelp);

		pinnedContainerSurface.on('deploy', function() {
			Timer.every(function() {
				pinnedContainerSurface.setSize([undefined, this.heightOfPins()]);
			}.bind(this), 2);
		}.bind(this));

		scrollModifier.transformFrom(function() {
			return Transform.translate(0, this.heightOfPins(), App.zIndex.readView); 	
		}.bind(this));
		var pinnedEntriesModifier = new Modifier({
			transform: Transform.translate(0, 11, App.zIndex.pinned)
		});
		pinnedContainerSurface.add(pinnedEntriesModifier).add(this.pinnedSequentialLayout);

		this.pinnedEntriesController.inTransformFrom(function() {
			return Transform.translate(0, 0, App.zIndex.pinned);	
		});

		this.renderController.inTransformFrom(function() {
			return Transform.translate(0, 0, App.zIndex.readView);	
		});

		this.pinnedEntriesController.show(pinnedContainerSurface, {duration: 0});

		this.renderController.show(scrollWrapperSurface, {duration:0});
	}

	EntryListView.prototype.heightOfPins = function () {
		var numberOfRows = this.numberOfPinRows();
		return (numberOfRows * 34) + 19;
	}

	EntryListView.prototype.numberOfPinRows = function () {
		var numberOfRows = 1;	
		var rowWidthSoFar = 16;
		this.pinnedEdgeIndex = [];
		_.each(this.pinnedViews, function (pinnedView, index) {
			rowWidthSoFar = rowWidthSoFar + pinnedView.getSize()[0] + 8; //adding padding after the tags
			//console.log('rowWidthSoFar: ' + rowWidthSoFar);
			if (rowWidthSoFar > 312) {
				numberOfRows ++;
				rowWidthSoFar = 16;
				//console.log('Edge Index: ' + index);
				this.pinnedEdgeIndex.push(index);
			}
		}.bind(this));
		//console.log('EntryListView: number of pin rows' + numberOfRows);
		return numberOfRows;
	}

	EntryListView.prototype.blur = function() {
	}


	EntryListView.prototype.unBlur = function() {
	}

	module.exports = EntryListView;
});
