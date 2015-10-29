define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Utility = require('famous/utilities/Utility');
	var Transform = require('famous/core/Transform');
	var Modifier = require('famous/core/Modifier');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var StateModifier = require('famous/modifiers/StateModifier');
	var Scrollview = require('famous/views/Scrollview');
	var u = require('util/Utils');

	function PillsView(pillsSurfaceList) {
		View.apply(this, arguments);
		this.pillsSurfaceList = pillsSurfaceList;
		_createPillsContainer.call(this);
	}

	PillsView.prototype = Object.create(View.prototype);
	PillsView.prototype.constructor = PillsView;

	PillsView.DEFAULT_OPTIONS = {
	};

	PillsView.prototype.updatePillsSurfaceList = function(pillsSurfaceList) {
		this.pillsSurfaceList = pillsSurfaceList;
	};

	function _createPillsContainer() {
		this.pillsScrollView = new Scrollview({
			direction: Utility.Direction.X,
		});

		var pillsScrollViewContainer = new ContainerSurface({
			size: [undefined, 50],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center'
			}
		});

		this.pillsScrollViewModifier = new StateModifier({
			origin: [0.5, 0],
			align: [0.5, 0]
		});
		this.pillsScrollView.sequenceFrom(this.pillsSurfaceList);
		_.each(this.pillsSurfaceList, function(pillsSurface) {
			this.setScrollView(pillsSurface);
		}.bind(this));

		pillsScrollViewContainer.add(this.pillsScrollViewModifier).add(this.pillsScrollView);
		this.add(pillsScrollViewContainer);
	}

 	PillsView.prototype.setScrollView = function (pillSurface) {
		pillSurface.pipe(this.pillsScrollView);
 	}

	module.exports = PillsView;
});

