define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var View = require('famous/core/View');
	var Transform = require('famous/core/Transform');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Surface = require('famous/core/Surface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var StateView = require('views/StateView');
	var LoadGraphOverlay = require('views/graph/LoadGraphOverlay')
	var GraphView = require('views/graph/GraphView');
	var RenderNode = require("famous/core/RenderNode");
	var RenderController = require('famous/views/RenderController');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var Draggable = require("famous/modifiers/Draggable");
	var Utility = require('famous/utilities/Utility');
	var User = require('models/User');
	var jqFlot = require('util/jquery.flot.min');
	var u = require('util/Utils');
	var CreateChartView = require('views/graph/CreateChartView');
	var treeView = require('util/treeview');
	var tagList = require('util/taglist');


	function ChartView() {
		BaseView.apply(this, arguments);
		App.tagListWidget = initTagListWidget();
		this.optionsSurface = new Surface({
			size: [44, 64],
			content: '<i class="fa fa-ellipsis-h fa-2x"></i>',
			properties: {
				color: '#F14A42',
				padding: '20px 0px',
				cursor: 'pointer'
			}
		});

		this.optionsSurface.on('click', function() {
			App.pageView._eventOutput.emit('show-context-menu', {
				menu: 'chart',
				target: this,
				eventArg: null
			});
		}.bind(this));

		this.setRightIcon(this.optionsSurface);

		this.graphView = new GraphView(null, 'plotArea');
		this.add(new StateModifier({transform: Transform.translate(0, 65, App.zIndex.readView)})).add(this.graphView);
		_setHandlers.call(this);
	}


	ChartView.prototype = Object.create(BaseView.prototype);
	ChartView.prototype.constructor = ChartView;

	ChartView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		activeMenu: 'chart',
		noBackButton: true
	};

	ChartView.prototype.init = function(isAreaChart) {
		this.graphView.drawGraph(this.tagsToPlot, isAreaChart);
	};

	ChartView.prototype.preShow = function(state) {
		if (state) {
			this.tagsToPlot = state.tagsToPlot;
			if (state.tagsToPlot) {
				this.init(state.areaChart);
			}
		}
		return true;
	};

	ChartView.prototype.showLoadGraphOverlay = function() {
		this.loadGraphOverlay = new LoadGraphOverlay();
		this.showBackButton();
		this.removeRightIcon();
		this.showOverlayContent(this.loadGraphOverlay);
	};

	ChartView.prototype.killOverlayContent = function() {
		BaseView.prototype.killOverlayContent.call(this);
		this.showMenuButton();
		this.setRightIcon(this.optionsSurface);
	};

	function _setHandlers() {
		this.on('create-chart', function() {
			App.pageView.changePage('CreateChartView');
		});
		this.on('save-snapshot', function() {
			this.graphView.plot.save();
		}.bind(this));
		this.on('share-snapshot', function() {
			this.graphView.plot.saveSnapshot();
		}.bind(this));
		this.on('load-snapshot', function() {
			this.showLoadGraphOverlay();
		}.bind(this));
	}

	App.pages['ChartView'] = ChartView;
	module.exports = ChartView;
});
