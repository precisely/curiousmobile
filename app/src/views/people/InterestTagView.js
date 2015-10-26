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
	var InterestTagTemplate = require('text!templates/interest-tag.html');
	var EntryReadView = require('views/entry/EntryReadView');
	var User = require('models/User');
	var u = require('util/Utils');

	function InterestTagView(tag) {
		EntryReadView.apply(this, arguments);
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
			padding: '15px 45px 0px 15px',
			fontSize: this.options.lineHeight + 'px',
			fontWeight: 'lighter',
			lineHeight: this.options.lineHeight + 'px',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			color: '#fff',
			borderBottom: '1px solid #f6a583'
		};

		var size = [window.innerWidth, this.options.entryHeight];

		var readSurfaceOptions = {
			size: size,
			content: this.entry,
			properties: properties
		};

		this.entrySurface.setOptions(readSurfaceOptions);

		var deleteModifier = new StateModifier({
			transform: Transform.translate(window.innerWidth, 0, window.App.zIndex.readView + 2)
		});
		this.add(deleteModifier).add(this.deleteSurface);
		var entryModifier = new Modifier({
			transform: Transform.translate(0, 0, 0)
		});
		this.add(entryModifier).add(this.entrySurface);
	}

	InterestTagView.prototype.delete = function() {
		User.deleteInterestTags(this.entry, function() {
			App.pageView.getCurrentView().refresh();
		}.bind(this));
	};

	module.exports = InterestTagView;
});
