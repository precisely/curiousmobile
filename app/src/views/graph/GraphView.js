var endDate, startDate;
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
	var jqFlotTime = require('util/jquery.flot.time.min');
	var jueryJson = require('util/jquery.json-2.2.min');
	var PlotMobile = require('util/plot.mobile');
	var plotProperties = require('util/plot.properties');

	function GraphView(tagsToPlot, plotAreaId) {
		StateView.apply(this, arguments);
		console.log('GraphView controller');
		this.tags = tagsToPlot;
		this.plotAreaId = plotAreaId || 'plotArea'
		this.plottedTags = [];
		this.renderController = new RenderController();
		this.add(new StateModifier({transform: Transform.translate(0, 50, 0)})).add(this.renderController);
		this.init();

	}

	GraphView.prototype = Object.create(StateView.prototype);
	GraphView.prototype.constructor = GraphView;

	GraphView.DEFAULT_OPTIONS = {
	};

	GraphView.prototype.init = function() {
		this.graphSurface = new Surface({
			size: [undefined, App.height - 230],
			content: _.template(GraphTemplate, {plotAreaId: this.plotAreaId}, templateSettings),
			properties: {
				backgroundColor: '#fff'
			}
		});

		this.renderController.show(this.graphSurface, function() {
			this.plot = new PlotMobile(App.tagListWidget.list, User.getCurrentUserId(), User.getCurrentUser().get("username"), '#' + this.plotAreaId, true, false, new PlotProperties({
				'startDate':'#startdatepicker1',
				'startDateInit':'start date and/or tag',
				'endDate':'#enddatepicker1',
				'endDateInit':'end date and/or tag',
				'cycleTag':'#cycleTag1',
				'zoomControl':'#zoomcontrol1',
				'username':'#queryUsername',
				'name':'#queryTitle',
				'rename':'#queryTitleEdit',
				'logout':'#logoutLink'
			}));
			this.graphIsRendered = true;
			this._eventOutput.emit('graph-visible');
		}.bind(this));

		this.pillsSurfaceList = [];
		this.pillsView = new PillsView(this.pillsSurfaceList);
		var pillsViewMod = new StateModifier({
			transform: Transform.translate(0, -1, -5)
		});
		this.add(pillsViewMod).add(this.pillsView)
		this.drawDateFooter();
	};

	GraphView.prototype.clearPillsSurfaceList = function() {
		// Splicing instead of initializing with [] to retrieve the original reference
		this.pillsSurfaceList.splice(0, this.pillsSurfaceList.length);
	};

	GraphView.prototype.drawGraph = function(tags, isAreaChart) {
		this.plottedTags.splice(0, this.plottedTags.length);
		this.tags = tags;
		if (this.tags) {
			if (this.graphIsRendered) {
				this.clearPillsSurfaceList();
				this.plot.initiateAddLine(this.tags, isAreaChart);
			} else {
				this.on('graph-visible', function() {
					this.plot.initiateAddLine(this.tags, isAreaChart);
				}.bind(this));
			}
		}
	};

	GraphView.prototype.drawDateFooter = function() {
		startDate = endDate = null;
		var dateContainerSurface = new ContainerSurface({
			size: [undefined, 58],
			properties: {
				backgroundColor: '#efefef',
				border: '1px solid #c3c3c3'
			}
		});

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

		this.endDateString = this.startDateString = 'DD/MM/YY';

		this.dateLabelSurface = new Surface({
			size: [200, 28],
			content: '<span class="blank-date-label start-date">DD/MM/YY</span> - <span class="blank-date-label end-date">DD/MM/YY</span>',
			properties: {
				border: '1px solid #C3C3C3',
				borderRadius: '2px',
				padding: '5px 10px',
				color: '#6f6f6f',
				textAlign: 'center',
				whiteSpace: 'no-wrap',
				backgroundColor: '#fff',
				fontSize: '12px'
			}
		});
		this.dateLabelSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				var classList = e.srcElement.classList;
				if (_.contains(classList, 'start-date')) {
					showDatePicker.call(this, 'startDate');
				} else if (_.contains(classList, 'end-date')) {
					showDatePicker.call(this, 'endDate');
				}
			}
		}.bind(this));

		dateContainerSurface.add(new StateModifier({align:[0.5, 0.5], origin: [0.5, 0.5], transform: Transform.translate(0, 0, 2)})).add(this.dateLabelSurface);
		this.add(new StateModifier({align: [0, 1], origin: [0, 1], transform: Transform.translate(0, -115, 0)})).add(dateContainerSurface);
	};

	function showDatePicker(dateType) {
		if(this.dateGridOpen) {
			this.dateGridRenderController.hide();
		} else {
			var dateGridView = new DateGridView(this.selectedDate || new Date());
			this.dateGrid = dateGridView;
			this.dateGridRenderController.show(this.dateGrid);
			this.dateGrid.on('select-date', function(date) {
				console.log('CalenderView: Date selected');
				this.setSelectedDate(date, dateType);
				this.dateGridRenderController.hide();
				this.dateGridOpen = false;
			}.bind(this));
		}
		this.dateGridOpen = !this.dateGridOpen;
	}

	GraphView.prototype.setSelectedDate = function(date, dateType) {
		var App = window.App;
		this.selectedDate = date;
		var year = date.getFullYear().toString();
		if (dateType == 'startDate') {
			startDate = date;
			this.startDateString = ('0' + date.getDate()).slice(-2) + '/'  + ('0' + (date.getMonth()+1)).slice(-2) + '/'
					+ year.substring(2);
		} else {
			endDate = date;
			this.endDateString = ('0' + date.getDate()).slice(-2) + '/'  + ('0' + (date.getMonth()+1)).slice(-2) + '/'
					+ year.substring(2);
		}
		this.dateLabelSurface.setContent('<span class="blank-date-label start-date">' + this.startDateString + '</span> - '
				+ '<span class="blank-date-label end-date">' + this.endDateString + '</span>');
		this.plot.loadAllData();

	}

	GraphView.prototype.createTagsPill = function(lineId, tag, color) {
		if (tag) {
			var pillSurface = new Surface({
				content: '<button class="tag-pill btn' + '" id="' + tag.id + '" style="border-left: 2px solid' + color +
						'; color: ' + color + ';">' + tag.description + '<i class="fa fa-times-circle"></i></button>',
				size: [true, 50],
				properties: {
					backgroundColor: '#efefef',
					textAlign: 'center',
				}
			});
			pillSurface.on('click', function(e) {
				if (e instanceof CustomEvent) {
					var classList = e.srcElement.classList;
					if (_.contains(classList, 'fa')) {
						removePlotLine(this.plotAreaId, lineId);
						this.pillsSurfaceList.splice(this.pillsSurfaceList.indexOf(pillSurface), 1);
						this.plottedTags.splice(this.plottedTags.indexOf(tag), 1);
						var currentView = App.pageView.getCurrentView();
						currentView.tagsToPlot.splice(currentView.tagsToPlot.indexOf(tag), 1)
					}
				}
			}.bind(this));
			this.pillsSurfaceList.push(pillSurface);
			this.pillsView.setPillsSurfaceList(this.pillsSurfaceList);
			this.pillsView.setScrollView(pillSurface);
			this.plottedTags.push(tag);
		}
	};

	GraphView.prototype.setScrollView = function (scrollView) {
		this.scrollView = scrollView;
		this.cardSurface.pipe(this.scrollView);
	}

	module.exports = GraphView;
});

