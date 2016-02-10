define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var GraphView = require('views/graph/GraphView');
	var FastClick = require('famous/inputs/FastClick');
	var StateView = require('views/StateView');
	var u = require('util/Utils');

	function CuriositiesGraphOverlay(args) {
		StateView.apply(this, arguments);
		this.tagsByDescription = args.tagsByDescription;
		this.tagsToPlot = [];
		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#fff'
			}
		});

		this.graphView = new GraphView(null, 'plotArea');
		App.pageView.getCurrentView().graphView = this.graphView;
		this.add(new StateModifier({transform: Transform.translate(0, 0, App.zIndex.readView + 12)})).add(this.graphView);
		createGraph.call(this);
	}

	CuriositiesGraphOverlay.prototype = Object.create(StateView.prototype);
	CuriositiesGraphOverlay.prototype.constructor = CuriositiesGraphOverlay;

	CuriositiesGraphOverlay.DEFAULT_OPTIONS = {
	};

	function createGraph() {
		if (this.tagsByDescription) {
			this.tagsToPlot.splice(0, this.tagsToPlot.length);
			App.tagListWidget = initTagListWidget(function () {
				this.tagsToPlot.push(App.tagListWidget.list.searchItemByDescription(this.tagsByDescription[0]));
				this.tagsToPlot.push(App.tagListWidget.list.searchItemByDescription(this.tagsByDescription[1]));
				this.graphView.drawGraph(this.tagsToPlot, false);
			}.bind(this));
		}
	};

	module.exports = CuriositiesGraphOverlay;
});

