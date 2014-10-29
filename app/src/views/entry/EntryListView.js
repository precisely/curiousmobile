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
	EntryReadView = require('views/entry/EntryReadView');
	var Scrollview = require("famous/views/Scrollview");
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
		entryHeight: 90,
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
		entryReadView.on('delete-entry', function(entry) {
			console.log('EntryListView: Deleting an entry');
			this.entries.remove(entry);
			Entry.cacheEntries(this.entries.key, this.entries);
			this.refreshEntries();
		}.bind(this));

		entryReadView.on('select-entry', function(entry) {
			console.log('EntryListView: Selecting an entry');
			this._eventOutput.emit('select-entry', entry);
		}.bind(this));

		return entryReadView;
	}

	EntryListView.prototype.refreshEntries = function(entries, glowEntry) {
		this.entryReadViews = [];
		this.draggableList = [];

		if (!entries && this.entries) {
			entries = EntryCollection.getFromCache(this.entries.key);
		}

		if (entries instanceof EntryCollection) {
			this.entries = entries;	
		} else {
			this.entries.set(entries);
		}

		if (this.scrollView) {
			this.renderController.hide({duration:0});
		}

		var scrollModifier = new Modifier();
		scrollModifier.sizeFrom(function(){
			return [320,window.innerHeight - 210]
		});
		var scrollNode = new RenderNode(scrollModifier);
		this.scrollView = new Scrollview({
			direction: 1,
			defaultItemSize: [320, 90],
			itemSpacing: 0,
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
		this.entries.forEach(function(entry) {
			this.addEntry(entry);
		}.bind(this));

		this.scrollView.sequenceFrom(this.draggableList);
		this.renderController.show(scrollNode, {duration:0});
	}

	EntryListView.prototype.blur = function() {
		_.each(this.entryReadViews, function(readView, index) {
			readView.entrySurface.addClass('blur');
		});
	}


	EntryListView.prototype.unBlur = function() {
		_.each(this.entryReadViews, function(readView, index) {
			readView.entrySurface.removeClass('blur');
		});
	}

	module.exports = EntryListView;
});
