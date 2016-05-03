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
	var LoadGraphOverlay = require('views/graph/LoadGraphOverlay');
	var GraphView = require('views/graph/GraphView');
	var RenderNode = require("famous/core/RenderNode");
	var RenderController = require('famous/views/RenderController');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var Draggable = require("famous/modifiers/Draggable");
	var jqSmooth = require('util/interpolate/smooth');
	require("util/interpolate/science.min");
	require("util/interpolate/science_loess");
	require('util/jquery.flot.min');
	var u = require('util/Utils');
	var CreateChartView = require('views/graph/CreateChartView');
	var OverlayWithGroupListView = require('views/community/OverlayWithGroupListView');
	var treeView = require('util/treeview');
	var tagList = require('util/taglist');
	require('jquery');
	require('bootstrap');
	var shareChartTemplate = require('text!templates/share-chart.html');
	var Scrollview = require('famous/views/Scrollview');

	function ChartView() {
		BaseView.apply(this, arguments);
		console.log('ChartView constructor');
		App.tagListWidget = initTagListWidget();
		this.tagsToPlot = [];
		this.groupToShareWith = '';
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
			content: '<div id="share-button-popover"><img height="30" src="content/images/share-red.png" id="share-button"></div>',
			properties: {
				padding: '10px'
			}
		});

		this.shareModifier = new Modifier();
		this.shareModifier.transformFrom(function() {
			return Transform.translate(App.width - 50, App.height - 105, App.zIndex.readView + 3);
		});
		this.add(this.shareModifier).add(this.shareButton);

		this.shareButton.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this.hideShareButtonPopover();
				var className = e.srcElement.className;
				if (!_.contains(['popover', 'arrow', 'popover-content', 'vline'], className)) {
					this._eventOutput.emit('share-snapshot');
				}
			}
		}.bind(this));

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
		App.showPopover('#share-button', {key: 'shareChart', container: '#share-button-popover'});
	};

	ChartView.prototype.hideShareButtonPopover = function() {
		$('#share-button').popover('destroy');
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
			var viewProperties = {};
			if (state && state.shareDiscussion) {
				viewProperties = {name: 'shareDiscussion', value: true, groupName: this.groupToShareWith};
			}
			App.pageView.changePage('CreateChartView', viewProperties);
		} else if (state && state.triggerLoadGraph) {
			this.showLoadGraphOverlay();
		} else if (this.tagsToPlot && this.tagsToPlot.length) {
			this.graphView.drawGraph(this.tagsToPlot);
		}
	};

	ChartView.prototype.preShow = function(state) {
		if (state && !state.onLoad) {
			if (state.tagsToPlot) {
				this.tagsToPlot = state.tagsToPlot;
			} else if (state.tagsByDescription) {
				this.tagsToPlot.splice(0, this.tagsToPlot.length);
				App.tagListWidget = initTagListWidget(function () {
					this.tagsToPlot.push(App.tagListWidget.list.searchItemByDescription(state.tagsByDescription[0]));
					this.tagsToPlot.push(App.tagListWidget.list.searchItemByDescription(state.tagsByDescription[1]));
				}.bind(this));
			}

			if (state.shareDiscussion) {
				this.groupToShareWith = state.groupName ? state.groupName : 'Public';
				this.showShareButtonPopover();
			}
		}
		return true;
	};

	ChartView.prototype.goBack = function() {
		if (this.currentOverlay) {
			BaseView.prototype.goBack.call(this);
		} else {
			App.pageView.changePage('CreateChartView', {selectedTags: this.graphView.plottedTags, groupName: this.groupToShareWith});
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

	ChartView.prototype.shareChart = function(groupToShareWith) {
		var chartTitle = document.getElementById('chart-title').value;
		if (!chartTitle) {
			u.showAlert('Please enter a title for the chart to share.');
			return;
		}

		if (!groupToShareWith || !groupToShareWith.name) {
			u.showAlert('Please select a group to share this chart with.');
			return;
		}

		this.killOverlayContent();

		this.graphView.plot.setName(chartTitle);
		this.graphView.plot.saveSnapshot(groupToShareWith);
	};

	function _setHandlers() {
		this.on('close-date-grid', function() {
			this.graphView._eventOutput.emit('close-date-grid');
		}.bind(this));

		this.on('create-chart', function() {
			u.showAlert({
				type: 'alert',
				message: 'Are you sure to clear graph?',
				a: 'Yes',
				b: 'No',
				onA: function() {
					this.graphView.clearGraph();
					App.pageView.changePage('CreateChartView', {groupName: this.groupToShareWith});
				}.bind(this),
				onB: function() {}.bind(this)
			});
		});
		this.on('edit-chart', function() {
			App.pageView.changePage('CreateChartView', {selectedTags: this.graphView.plottedTags, groupName: this.groupToShareWith});
		}.bind(this));

		this.on('save-snapshot', function() {
			this.graphView.plot.save();
		}.bind(this));

		this.on('share-snapshot', function() {
			var overlayTemplateProperties = {};
			var graphTitle;
			var totalPlottedTags = this.tagsToPlot.length;
			if (totalPlottedTags == 1) {
				graphTitle = 'What is the relationship between ' + this.tagsToPlot[0].description + ' and my health?';
			} else if (totalPlottedTags > 1) {
				graphTitle = 'Is there a relationship between';
				_.each(this.tagsToPlot, function(tag, index) {
					if (index == totalPlottedTags - 1) {
						graphTitle += ' and ' + tag.description + '?';
					} else {
						graphTitle += ' ' + tag.description + ((index == totalPlottedTags - 2) ? '' : ',');
					}
				});
			} else {
				u.showAlert('Please plot a chart to share');
				return;
			}
			overlayTemplateProperties.graphTitle = graphTitle;
			overlayTemplateProperties.groupName = this.groupToShareWith;
			this.overlayWithGroupListView = new OverlayWithGroupListView(shareChartTemplate, overlayTemplateProperties, function(e) {
				if (e instanceof CustomEvent) {
					var classList = e.srcElement.classList;
					if (e.srcElement.id === 'share-chart') {
						App.pageView.getCurrentView().shareChart({name: this.groupName, fullName: this.groupFullName});
					}
				}
			});
			this.showOverlayContent(this.overlayWithGroupListView);
		}.bind(this));

		this.on('load-snapshot', function() {
			this.showLoadGraphOverlay();
		}.bind(this));
	}

	ChartView.prototype.showOverlayContent = function(renderable) {
		this.showBackButton();
		this.removeRightIcon();
		this.hideSearchIcon();
		this.backRenderController.hide();
		this.setHeaderLabel('SHARE CHART');
		BaseView.prototype.showOverlayContent.call(this, renderable);
	};

	ChartView.prototype.killOverlayContent = function() {
		BaseView.prototype.killOverlayContent.call(this);
		this.showSearchIcon();
		this.showMenuButton();
		this.setRightIcon(this.optionsSurface);
		this.backRenderController.show(this.leftSurface);
		this.setHeaderLabel('CHART');
	}

	App.pages['ChartView'] = ChartView;
	module.exports = ChartView;
});
