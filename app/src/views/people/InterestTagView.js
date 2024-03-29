define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var FastClick = require('famous/inputs/FastClick');
	var RenderNode = require("famous/core/RenderNode");
	var StateView = require('views/StateView');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var Surface = require('famous/core/Surface');
	var EntryReadView = require('views/entry/EntryReadView');
	var User = require('models/User');
	var u = require('util/Utils');

	function InterestTagView(tag) {
		EntryReadView.apply(this, arguments);
		this.menu = 'interestTag';
		_createTagSurface.call(this);
	}

	InterestTagView.prototype = Object.create(EntryReadView.prototype);
	InterestTagView.prototype.constructor = InterestTagView;

	InterestTagView.DEFAULT_OPTIONS = {
		entryHeight: 45,
		lineHeight: 16,
	};

	function _createTagSurface() {
		var properties = {
			padding: '11px 45px 0px 15px',
			fontSize: this.options.lineHeight + 'px',
			fontWeight: 'lighter',
			lineHeight: this.options.lineHeight + 'px',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			color: '#fff',
			borderBottom: '1px solid #f6a583'
		};

		var size = [window.innerWidth, 36];

		var readSurfaceOptions = {
			size: size,
			content: this.entry,
			properties: properties
		};

		this.entrySurface.setOptions(readSurfaceOptions);

		var deleteModifier = new StateModifier({
			transform: Transform.translate(window.innerWidth, -2, window.App.zIndex.readView + 2)
		});
		this.deleteSurface.setProperties({
			padding: '8px 0px',
			borderBottom: '1px solid #f6a583',
			lineHeight: '23px',
		});
		this.deleteSurface.setSize([80, true]);
		this.add(deleteModifier).add(this.deleteSurface);
		var entryModifier = new Modifier({
			transform: Transform.translate(0, 2, 0)
		});
		this.add(entryModifier).add(this.entrySurface);
	}

	//Overriding select method from EntryView
	InterestTagView.prototype.select = function() {
	};

	InterestTagView.prototype.delete = function() {
		User.deleteInterestTags(this.entry, function(interestTags) {
			var currentView = App.pageView.getCurrentView();
			if (typeof currentView !== 'undefined') {
				currentView.killOverlayContent({interestTags: interestTags});
			}
		}.bind(this));
	};

	module.exports = InterestTagView;
});
