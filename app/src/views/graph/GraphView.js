define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var StateView = require('views/StateView');
	var GraphTemplate = require('text!templates/chart-canvas.html');
	var DateUtil = require('util/DateUtil');
	var DateGridView = require('views/calendar/DateGridView');
	var RenderController = require("famous/views/RenderController");
	var PillsView = require('views/PillsView');
	var User = require('models/User');
	var Tags = require('models/Tags');
	var u = require('util/Utils');
	var jueryJson = require('util/jquery.json-2.2.min');
	var jqFlotTime = require('util/jquery.flot.time.min');
	var datejs = require('util/date');
	var PlotMobile = require('util/plot.mobile');
	var plotProperties = require('util/plot.properties');

	function GraphView(tagsToPlot, plotAreaId) {
		StateView.apply(this, arguments);
		console.log('GraphView controller');
		this.tags = tagsToPlot;
		this.plotAreaId = plotAreaId || 'plotArea';
		this.plottedTags = [];
		this.renderController = new RenderController();
		this.startDate = null;
		this.endDate = null;
		this.add(new StateModifier({transform: Transform.translate(0, 50, 0)})).add(this.renderController);
		this.init();
	}

	GraphView.prototype = Object.create(StateView.prototype);
	GraphView.prototype.constructor = GraphView;

	GraphView.DEFAULT_OPTIONS = {
	};

	GraphView.prototype.init = function() {
		this.graphSurface = new Surface({
			size: [undefined, App.height - 222],
			content: _.template(GraphTemplate, {plotAreaId: this.plotAreaId}, templateSettings),
			properties: {
				backgroundColor: '#fff',
				zIndex: 10
			}
		});

		this.graphSurface.pipe(this._eventOutput);

		this.pillsSurfaceList = [];
		this.pillsView = new PillsView(this.pillsSurfaceList);
		var pillsViewMod = new StateModifier({
			transform: Transform.translate(0, -1, 5)
		});
		this.add(pillsViewMod).add(this.pillsView);
	};

	GraphView.prototype.renderGraph = function(callback) {
		this.renderController.show(this.graphSurface, null, function() {
			this.plotProperties = new PlotProperties({
				'startDateInit':'start date and/or tag',
				'endDateInit':'end date and/or tag',
				'cycleTag':'#cycleTag1',
				'zoomControl':'#zoomcontrol1',
				'username':'#queryUsername',
				'name':'#queryTitle',
				'rename':'#queryTitleEdit',
				'logout':'#logoutLink'
			});
			this.plot = new PlotMobile(App.tagListWidget.list, User.getCurrentUserId(), User.getCurrentUser().get("username"), '#' + this.plotAreaId, true, false, this.plotProperties);
			if (callback) {
				callback();
			}
		}.bind(this));
	};
	
	GraphView.prototype.clearPillsSurfaceList = function() {
		// Splicing instead of initializing with [] to retrieve the original reference
		this.pillsSurfaceList.splice(0, this.pillsSurfaceList.length);
	};

	GraphView.prototype.drawGraph = function(tags) {
		this.plottedTags.splice(0, this.plottedTags.length);
		this.tags = tags;
		var plotChart = function() {
			this.renderGraph(function() {
				if (!document.getElementById(this.plotAreaId)) {
					setTimeout(function() {
						plotChart.call(this);
					}.bind(this), 10);
					return;
				}
				this.clearPillsSurfaceList();
				this.plot.initiateAddLine(this.tags, false);
				this.addDateFooter();
				this.plotProperties.setStartDate(this.startDate);
				this.plotProperties.setEndDate(this.endDate);
			}.bind(this));
		};
		if (this.tags) {
			plotChart.call(this);
		}
	};

	GraphView.prototype.addDateFooter = function() {
		if (App.pageView.getCurrentPage() !== 'DiscussionDetailView') {
			this.drawDateFooter();
		} else {
			this.graphSurface.setSize([undefined, App.height - 190]);
		}
	};

	// Considering height of graph and the date footer, required for scrollview in discussion
	GraphView.prototype.getSize = function() {
		return (App.height - 220);
	};

	GraphView.prototype.showDiscussionChart = function(plotDataId, discussionHash) {
		this.renderGraph(function() {
			if (!document.getElementById(this.plotAreaId)) {
				setTimeout(function() {
					this.showDiscussionChart(plotDataId, discussionHash);
				}.bind(this), 10);
				return;
			}
			this.plot.loadSnapshotId(plotDataId, discussionHash);
			this.addDateFooter();
		}.bind(this));
	};

	GraphView.prototype.drawDateFooter = function() {
		var dateContainerSurface = new ContainerSurface({
			size: [undefined, 58],
			properties: {
				backgroundColor: '#efefef',
				border: '1px solid #c3c3c3'
			}
		});

		this.dateGrid = new DateGridView(new Date(), true);
		
		this.dateGrid.on('select-date', function(date) {
			console.log('CalenderView: Date selected');
			this.setSelectedDate(date, this.dateType);
			this.closeDateGrid();
		}.bind(this));

		this.on('close-date-grid', function(date) {
			this.closeDateGrid();
		}.bind(this));

		this.dateGridRenderController = new RenderController();
		var dateGridRenderControllerMod = new StateModifier({
			transform: Transform.translate(18, 100, 0)
		});
		this.add(dateGridRenderControllerMod).add(this.dateGridRenderController);

		var datePickerButtonProperties = {
			borderRadius: '50%',
			backgroundColor: '#fff',
			textAlign: 'center',
			margin: '16px 15px',
			padding: '3px 0px 3px 3px',
			border: '1px solid #c3c3c3'
		};

		this.dateLabelSurface = new Surface({
			size: [200, 28],
			classes: ['datepicker-surface'],
			content: '<span class="blank-date-label start-date">' + this.getDateLabel(this.startDate) + '</span> <i' +
					' class="fa fa-minus"></i><span class="blank-date-label end-date">' + this.getDateLabel(this.endDate)
					+ '</span>',
			properties: {
				color: '#6f6f6f',
				textAlign: 'center',
				whiteSpace: 'no-wrap',
				fontSize: '12px'
			}
		});

		this.dateLabelSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				var classList = e.srcElement.classList;
				if (_.contains(classList, 'start-date')) {
					this.toggleDatePicker('startDate');
				} else if (_.contains(classList, 'end-date')) {
					this.toggleDatePicker('endDate');
				}
			}
		}.bind(this));

		dateContainerSurface.add(new StateModifier({align:[0.5, 0.5], origin: [0.5, 0.5], transform: Transform.translate(0, 0, 2)})).add(this.dateLabelSurface);
		this.add(new StateModifier({transform: Transform.translate(0, (App.height - 172), -5)})).add(dateContainerSurface);
	};

	GraphView.prototype.toggleDatePicker = function(dateType) {
		var datePickerDate;
		this.dateType = dateType;
		if(this.dateGridOpen) {
			this.dateGridRenderController.hide();
		} else {
			if (this.dateType == 'startDate') {
				datePickerDate = this.startDate;
			} else {
				datePickerDate = this.endDate;
			}
			if (datePickerDate) {
				this.dateGrid.setSelectedDate(datePickerDate);
			} else {
				this.dateGrid.setSelectedDate(new Date());
			}
			
			this.dateGridRenderController.show(this.dateGrid, null, function() {
				App.pageView.getCurrentView().showShimSurface();
			}.bind(this));
		}
		this.dateGridOpen = !this.dateGridOpen;
	};
	GraphView.prototype.closeDateGrid = function() {
		this.dateGridRenderController.hide();
		this.dateGridOpen = false;
		App.pageView.getCurrentView().hideShimSurface();
	};

	GraphView.prototype.setSelectedDate = function(date, dateType) {
		if (dateType == 'startDate') {
			this.startDate = date;
			this.plotProperties.setStartDate(this.startDate);
		} else {
			this.endDate = date;
			this.plotProperties.setEndDate(this.endDate);
		}

		this.dateLabelSurface.setContent('<span class="blank-date-label start-date">' + this.getDateLabel(this.startDate) + '</span> <i class="fa fa-minus"></i> '
				+ '<span class="blank-date-label end-date">' + this.getDateLabel(this.endDate) + '</span>');
		this.plot.loadAllData();
	};

	GraphView.prototype.getDateLabel = function(date) {
		if (!date) {
			return 'MM/DD/YY';
		}

		return (('0' + (date.getMonth()+1)).slice(-2) + '/' + ('0' + date.getDate()).slice(-2) + '/'  +
			+ date.getFullYear().toString().substring(2));
	};

	GraphView.prototype.createTagsPill = function(lineId, tag, color) {
		if (tag) {
			var deleteAffordance = '';
			if (App.pageView.getCurrentPage() !== 'DiscussionDetailView') {
				deleteAffordance = '<i class="fa fa-times-circle"></i>';
			}
			var pillSurface = new Surface({
				content: '<button class="tag-pill btn' + '" id="' + tag.id + '" style="border-left: 2px solid' + color +
						'; color: ' + color + ';">' + u.escapeHTML(tag.description) + deleteAffordance + '</button>',
				size: [true, 50],
				properties: {
					backgroundColor: '#efefef',
					textAlign: 'center'
				}
			});
			pillSurface.lineId = lineId;
			pillSurface.on('click', function(e) {
				if (e instanceof CustomEvent) {
					var classList = e.srcElement.classList;
					if (_.contains(classList, 'fa')) {
						removePlotLine(this.plotAreaId, lineId);
						this.pillsSurfaceList.splice(this.pillsSurfaceList.indexOf(pillSurface), 1);
						this.plottedTags.splice(this.plottedTags.indexOf(tag), 1);
						var currentView = App.pageView.getCurrentView();
						if (currentView.tagsToPlot) {
							currentView.tagsToPlot.splice(currentView.tagsToPlot.indexOf(tag), 1)
						}
						this.pillsView.pillsScrollView.sequenceFrom(this.pillsSurfaceList);
						if (this.pillsSurfaceList.length === 0) {
							App.pageView.changePage('CreateChartView');
						}
					} else {
						var plotLine = this.plot.getLine(lineId);
						var plot = this.plot;
						plot.deactivateActivatedLine(plotLine);
						if (plotLine.hasSmoothLine()) {	//means there is a smooth line of this accordion line
							if (plot.activeLineId == plotLine.smoothLine.id) {
								var activeLine = plot.getLine(plot.activeLineId);
								if (activeLine) {
									activeLine.deactivate();
								}
								plot.activeLineId = undefined;
								return;
							}
							plot.activeLineId = plotLine.smoothLine.id;
							plotLine.smoothLine.activate();
							console.log('plotclick: activating line id: ' + plotLine.id);
						} else {
							plot.activeLineId = plotLine.id;
							plotLine.activate();
							console.log('plotclick: activating line id: ' + plotLine.id);
						}
					}
				}
			}.bind(this));
			this.pillsSurfaceList.push(pillSurface);
			this.pillsView.setPillsSurfaceList(this.pillsSurfaceList);
			this.pillsView.setScrollView(pillSurface);
			this.plottedTags.push(tag);
		}
	};

	GraphView.prototype.setScrollView = function(scrollView) {
		this.scrollView = scrollView;
		this.cardSurface.pipe(this.scrollView);
	};

	GraphView.prototype.clearGraph = function() {
		this.clearPillsSurfaceList();
		this.startDate = null;
		this.endDate = null;
		if (this.tags && this.tags.length) {
			this.tags.splice(0, this.tags.length);
		}
		if (this.plot) {
			this.plot.clearGraphs();
		}
	};

	module.exports = GraphView;
});
