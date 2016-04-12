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
	var shareChartTemplate = require('text!templates/share-chart.html');
	var groupsListTemplate = require('text!templates/groups-list.html');
	var Scrollview = require('famous/views/Scrollview');
	var User = require('models/User');

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
				'data-content="Click here to share" id="share-button"></div>',
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
				this.showShareChartModal();
			}
		}.bind(this));

		this.shareChartRenderController = new RenderController();
		this.shareChartContainerSurface = new ContainerSurface({});
		var backdropSurface = new Surface({
			size: [undefined, undefined],
			align: [0, 1],
			origin: [0, 1],
			properties: {
				opacity: '0.2',
				backgroundColor: '#000000'
			}
		});
		var backdropModifer = new Modifier({
			opacity: 0.5
		});

		this.shareGraphModal = new Surface({
			size: [undefined, undefined]
		});
		this.shareGraphModalModifier = new StateModifier({
			transform: Transform.translate(0, 0, 0)
		});
		this.shareGraphModal.on('click', function(e) {
			if (e instanceof CustomEvent) {
				var classList = e.srcElement.classList;
				if (_.contains(classList, 'close') || _.contains(e.srcElement.parentElement.classList, 'close')) {
					this.shareChartRenderController.hide();
				}

				if (e.srcElement.id === 'share-chart') {
					this.shareChart();
				}
			}
		}.bind(this));

		this.shareChartContainerSurface.add(backdropModifer).add(backdropSurface);
		this.shareChartContainerSurface.add(this.shareGraphModalModifier).add(this.shareGraphModal);
		this.add(new StateModifier({transform: Transform.translate(0, 0, App.zIndex.contextMenu)})).add(this.shareChartRenderController);

		this.setHeaderLabel('CHART');
		this.setRightIcon(this.optionsSurface);
		this.backRenderController = new RenderController();
		this.add(new StateModifier({transform: Transform.translate(35, 0, App.zIndex.header + 5)})).add(this.backRenderController);
		this.backRenderController.show(this.leftSurface);

		this.graphView = new GraphView(null, this.options.plotAreaId);
		this.add(new StateModifier({transform: Transform.translate(0, 65, App.zIndex.readView)})).add(this.graphView);

		this.createGroupsListScrollView();
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

	ChartView.prototype.createGroupsListScrollView = function() {
		this.groupsListScrollContainer = new ContainerSurface({
			size: [App.width - 50, App.height - 420],
			properties: {
				overflow: 'hidden',
				boxShadow: 'rgb(223, 223, 223) -6px -48px 34px -23px inset',
				padding: '0px 5px'
			}
		});

		this.groupsListScrollView = new Scrollview({
			direction: Utility.Direction.Y
		});

		this.groupsSurfaceList = [];

		this.groupsListScrollView.sequenceFrom(this.groupsSurfaceList);

		this.groupsListScrollContainer.add(this.groupsListScrollView);

		// TODO Fix the x and y transform to be dynamic with respect to the Device's Screen Resolution.
		this.xTranslate = 25;
		if (App.width >= 560) {
			this.xTranslate = 95;
			this.groupsListScrollContainer.setSize([575, App.height - 420]);
		}
		this.groupsListScrollContainerModifier = new StateModifier({
			transform: Transform.translate(this.xTranslate, 300, 0)
		});

		this.shareChartContainerSurface.add(this.groupsListScrollContainerModifier).add(this.groupsListScrollContainer);
	};

	ChartView.prototype.showShareChartModal = function() {
		User.getGroupsToShare(function(data) {
			this.shareGraphModal.setContent('');
			this.groupsSurfaceList.splice(0, this.groupsSurfaceList.length);
			this.groupName = '';

			this.shareGraphModal.setContent(_.template(shareChartTemplate, {height: App.height - 420}, templateSettings));

			_.each(data.groups, function(groupName, index) {
				var groupSurface = new Surface({
					size: [undefined, true],
					content: _.template(groupsListTemplate, {index: index, groupName: groupName}, templateSettings)
				});
				groupSurface.on('click', function(e) {
					if (e instanceof CustomEvent) {
						this.groupName = groupName.name;
					}
				}.bind(this));
				this.groupsSurfaceList.push(groupSurface);
				groupSurface.pipe(this.groupsListScrollView);
			}.bind(this));

			var spareSurfaceForGroupsListScrollView = new Surface({
				size: [undefined, 10]
			});

			this.groupsSurfaceList.push(spareSurfaceForGroupsListScrollView);
			spareSurfaceForGroupsListScrollView.pipe(this.groupsListScrollView);

			this.shareChartRenderController.show(this.shareChartContainerSurface, null, function() {
					var yOffset = document.getElementById('group-list-container').getBoundingClientRect().top;
					this.groupsListScrollContainerModifier.setTransform(Transform.translate(this.xTranslate, yOffset, 0));
			}.bind(this));
		}.bind(this));
	};

	ChartView.prototype.shareChart = function() {
		var chartTitle = document.getElementById('chart-title').value;
		if (!chartTitle) {
			u.showAlert('Please enter a title for the chart to share.');
			return;
		}

		var groupName = this.groupName;
		if (!groupName) {
			u.showAlert('Please select a group to share this chart with.');
			return;
		}

		this.shareChartRenderController.hide();

		this.graphView.plot.setName(chartTitle);
		this.graphView.plot.saveSnapshot(groupName);
	};

	function _setHandlers() {
		this.on('close-date-grid', function() {
			this.graphView._eventOutput.emit('close-date-grid');
		}.bind(this));

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
			this.showShareChartModal();
		}.bind(this));
		this.on('load-snapshot', function() {
			this.showLoadGraphOverlay();
		}.bind(this));
	}

	App.pages['ChartView'] = ChartView;
	module.exports = ChartView;
});
