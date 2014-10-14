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
	var TransitionableTransform = require("famous/transitions/TransitionableTransform");
	var Scrollview = require("famous/views/Scrollview");
	var RenderNode = require('famous/core/RenderNode');
	var TweenTransition = require('famous/transitions/TweenTransition');
	var Draggable = require('famous/modifiers/Draggable');
	var FixedRenderNode = require('util/FixedRenderNode');
	var Utility = require('famous/utilities/Utility');
	//var Scrollview = require('famous/views/Scrollview');
	TweenTransition.registerCurve('inSine', Easing.inSine);

	function EntryListView(collection) {
		View.apply(this, arguments);
		this.entryReadViews = [];
		this.entries = collection;
		this.renderController = new RenderController();
		_createList.call(this);
	}

	EntryListView.prototype = Object.create(View.prototype);
	EntryListView.prototype.constructor = EntryListView;

	EntryListView.DEFAULT_OPTIONS = {
		entryHeight: 90,
		selectionPadding: 24,
	};

	function _createList(argument) {

		var backgroundSurface = new Surface({
			size: [320, 543],
			properties: {
				backgroundColor: 'white',
			}
		});
		this.add(backgroundSurface);
		backgroundSurface.pipe(this._eventOutput);
		this.add(this.renderController);
		this.refreshEntries();

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

		this.entries.set(entries);
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
