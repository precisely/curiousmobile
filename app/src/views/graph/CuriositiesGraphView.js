define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var FastClick = require('famous/inputs/FastClick');
	var ChartView = require('views/graph/ChartView');
	var BaseView = require('views/BaseView');
	var u = require('util/Utils');

	function CuriositiesGraphView() {
		ChartView.apply(this, arguments);
		this.setHeaderLabel('CURIOSITIES');
		this.on('load-snapshot', function() {
			App.pageView.changePage('ChartView', {tagsByDescription: this.tagsByDescription, triggerLoadGraph: true});
		}.bind(this));
	}

	CuriositiesGraphView.prototype = Object.create(ChartView.prototype);
	CuriositiesGraphView.prototype.constructor = CuriositiesGraphView;

	CuriositiesGraphView.DEFAULT_OPTIONS = {
		activeMenu: 'curiosities',
		plotAreaId: 'curiosityPlotArea',
		header: true,
		footer: true,
		noBackButton: true,
		contextMenuOptions: [{class: 'load-snapshot', label: 'Load'},
		{class: 'save-snapshot', label: 'Save'},
		{class: 'share-snapshot', label: 'Share'},
		{class: 'create-chart', label: 'Create New Chart'}]
	};

	CuriositiesGraphView.prototype.preShow = function(state) {
		if (state && !state.onLoad && state.tagsByDescription) {
			this.tagsToPlot.splice(0, this.tagsToPlot.length);
			this.tagsByDescription = state.tagsByDescription;
			if (this.graphView.plot) {
				this.graphView.plot.clearGraphs();
			}
			App.tagListWidget = initTagListWidget(function () {
				this.tagsToPlot.push(App.tagListWidget.list.searchItemByDescription(state.tagsByDescription[0]));
				this.tagsToPlot.push(App.tagListWidget.list.searchItemByDescription(state.tagsByDescription[1]));
			}.bind(this));
		}
		return true;
	};

	CuriositiesGraphView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		if (!state || !state.tagsByDescription) {
			App.pageView.changePage('CuriositiesListView');
		} else if (this.tagsToPlot && this.tagsToPlot.length) {
			this.graphView.drawGraph(this.tagsToPlot);
		}
	};

	CuriositiesGraphView.prototype.getCurrentState = function() {
		return {
			tagsByDescription: this.tagsByDescription
		};
	};

	CuriositiesGraphView.prototype.goBack = function() {
		if (this.currentOverlay) {
			BaseView.prototype.goBack.call(this);
		} else {
			App.pageView.changePage('CuriositiesListView');
		}
	};

	App.pages['CuriositiesGraphView'] = CuriositiesGraphView;
	module.exports = CuriositiesGraphView;
});

