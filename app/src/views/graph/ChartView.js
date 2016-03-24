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
	var jqSmooth = require('util/interpolate/smooth');
	require("util/interpolate/science.min");
	require("util/interpolate/science_loess");
	require('util/jquery.flot.min');
	var u = require('util/Utils');
	var CreateChartView = require('views/graph/CreateChartView');
	var treeView = require('util/treeview');
	var tagList = require('util/taglist');
	require('jquery');
	require('bootstrap');


	function ChartView() {
		BaseView.apply(this, arguments);
		console.log('ChartView constructor');
		App.tagListWidget = initTagListWidget();
		this.tagsToPlot = [];
		this.optionsSurface = new Surface({
			size: [44, 64],
			content: '<i class="fa fa-ellipsis-h fa-2x"></i>',
			properties: {
				color: '#F14A42',
				padding: '20px 0px',
				cursor: 'pointer',
				zIndex: 20
			}
		});

		this.optionsSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (this.tagsToPlot && this.tagsToPlot.length) {
					if (this.options.contextMenuOptions.length < 5) {
						this.options.contextMenuOptions.push({class: 'edit-chart', label: 'Edit Chart'});
					}
				} else if (this.options.contextMenuOptions.length >= 5) {
					this.options.contextMenuOptions.pop();
				}
				App.pageView._eventOutput.emit('show-context-menu', {
					menu: 'chart',
					target: this,
					eventArg: null
				});
			}
		}.bind(this));

		this.shareButton = new Surface({
			size: [true, true],
			content: '<div id="share-button-popover"><img height="30" src="content/images/share-red.png" data-placement="top" data-html="true"' +
				'data-content="Click here to share" id="share-button"></div>'
		});

		this.shareButton.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.hideShareButtonPopover();
				this.graphView.plot.saveSnapshot();
			}
		}.bind(this));
		this.shareModifier = new Modifier();

		this.shareModifier.transformFrom(function() {
			return Transform.translate(App.width - 40, App.height - 95, App.zIndex.header);
		});

		this.add(this.shareModifier).add(this.shareButton);

		this.setHeaderLabel('CHART');
		this.setRightIcon(this.optionsSurface);
		this.backRenderController = new RenderController();
		this.add(new StateModifier({transform: Transform.translate(35, 0, App.zIndex.header + 5)})).add(this.backRenderController);
		this.backRenderController.show(this.leftSurface);

		this.graphView = new GraphView(null, this.options.plotAreaId);
		this.add(new StateModifier({transform: Transform.translate(0, 65, App.zIndex.readView)})).add(this.graphView);
		_setHandlers.call(this);
	}


	ChartView.prototype = Object.create(BaseView.prototype);
	ChartView.prototype.constructor = ChartView;

	ChartView.DEFAULT_OPTIONS = {
		plotAreaId: 'plotAreaChartView',
		header: true,
		footer: true,
		activeMenu: 'chart',
		noBackButton: true,
		contextMenuOptions: [{class: 'load-snapshot', label: 'Load'},
		{class: 'save-snapshot', label: 'Save'},
		{class: 'share-snapshot', label: 'Share'},
		{class: 'create-chart', label: 'Create New Chart'}]
	};

	ChartView.prototype.showShareButtonPopover = function() {
		setTimeout(function() {
			$('#share-button').popover('show');
		}, 400);
	};

	ChartView.prototype.hideShareButtonPopover = function() {
		$('#share-button').popover('destroy');
	};

	ChartView.prototype.init = function(isAreaChart) {
		this.add(new StateModifier({transform: Transform.translate(0, 65, App.zIndex.readView)})).add(this.graphView);
		this.graphView.drawGraph(this.tagsToPlot, isAreaChart);
	};

	ChartView.prototype.preChangePage = function() {
		BaseView.prototype.preChangePage.call(this);
		this.hideShareButtonPopover();
		if (this.graphView.dateGridRenderController) {
			this.graphView.dateGridRenderController.hide();
		}
	};

	ChartView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		if ((!this.tagsToPlot || !this.tagsToPlot.length) && (!state || !state.tagsByDescription)) {
			var viewProperties = [];
			if (state && state.shareDiscussion) {
				viewProperties.push({name: 'shareDiscussion', value: true});
			}
			App.pageView.changePage('CreateChartView', {viewProperties: viewProperties});
		} else if (state && state.triggerLoadGraph) {
			this.showLoadGraphOverlay();
		}
	};

	ChartView.prototype.preShow = function(state) {
		if (state && !state.onLoad) {
			if (state.tagsToPlot) {
				this.tagsToPlot = state.tagsToPlot;
				if (state.tagsToPlot) {
					this.init(state.areaChart);
				}
			} else if (state.tagsByDescription) {
				this.tagsToPlot.splice(0, this.tagsToPlot.length);
				App.tagListWidget = initTagListWidget(function () {
					this.tagsToPlot.push(App.tagListWidget.list.searchItemByDescription(state.tagsByDescription[0]));
					this.tagsToPlot.push(App.tagListWidget.list.searchItemByDescription(state.tagsByDescription[1]));
					this.init(false);
				}.bind(this));
			}

			if (state.shareDiscussion) {
				this.showShareButtonPopover();
			}
		}
		return true;
	};

	ChartView.prototype.goBack = function() {
		if (this.currentOverlay) {
			BaseView.prototype.goBack.call(this);
		} else {
			App.pageView.changePage('CreateChartView', {selectedTags: this.graphView.plottedTags});
		}
	};

	ChartView.prototype.showLoadGraphOverlay = function() {
		this.loadGraphOverlay = new LoadGraphOverlay();
		this.backRenderController.hide();
		this.showBackButton();
		this.removeRightIcon();
		this.showOverlayContent(this.loadGraphOverlay);
	};

	ChartView.prototype.killOverlayContent = function() {
		BaseView.prototype.killOverlayContent.call(this);
		this.showMenuButton();
		this.backRenderController.show(this.leftSurface);
		this.setRightIcon(this.optionsSurface);
	};

	function _setHandlers() {
		this.on('create-chart', function() {
			u.showAlert({
				message: 'Are you sure to clear graph?',
				a: 'Yes',
				b: 'No',
				onA: function() {
					this.graphView.clearGraph();
					App.pageView.changePage('CreateChartView');
				}.bind(this),
				onB: function() {}.bind(this)
			});
		});
		this.on('edit-chart', function() {
			App.pageView.changePage('CreateChartView', {selectedTags: this.graphView.plottedTags});
		}.bind(this));
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
