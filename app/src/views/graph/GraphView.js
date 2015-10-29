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
	var jqFlot = require('util/jquery.flot');
	var jueryJson = require('util/jquery.json');
	var PlotMobile = require('util/plot.mobile');
	var plotProperties = require('util/plot.properties');

	function GraphView(tagsToPlot) {
		StateView.apply(this, arguments);
		this.tags = tagsToPlot;
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
			size: [undefined, App.height - 220],
			content: _.template(GraphTemplate, templateSettings)
		});

		this.renderController.show(this.graphSurface, function() {
			this.plot = new PlotMobile(App.tagListWidget.list, User.getCurrentUserId(), User.getCurrentUser().get("username"), "#plotArea", true, false, new PlotProperties({
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
		}.bind(this));

		this.pillsSurfaceList = [];
		this.pillsView = new PillsView(this.pillsSurfaceList);
		var pillsViewMod = new StateModifier({
			transform: Transform.translate(0, 0, 0)
		});
		this.add(pillsViewMod).add(this.pillsView)
		this.drawDateFooter();
	};

	GraphView.prototype.clearPillsSurfaceList = function() {
		// Splicing instead of initializing with [] to retrieve the original reference
		this.pillsSurfaceList.splice(0, this.pillsSurfaceList.length);
	};

	GraphView.prototype.drawGraph = function(tags, isAreaChart) {
		this.tags = tags;
		this.clearPillsSurfaceList();
		if (this.tags) {
			this.plot.initiateAddLine(this.tags, isAreaChart);
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
			padding: '4px',
			border: '1px solid #c3c3c3'
		};

		this.startDatePickerSurface = new Surface({
			classes: ['start-date-picker'],
			size: [27, 27],
			content: '<i class="fa fa-chevron-left"></i>',
			properties: datePickerButtonProperties
		});
		this.endDatePickerSurface = new Surface({
			classes: ['end-date-picker'],
			size: [27, 27],
			content: '<i class="fa fa-chevron-right"></i>',
			properties: datePickerButtonProperties
		});

		this.startDatePickerSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				showDatePicker.call(this, 'startDate');
			}
		}.bind(this));

		this.endDatePickerSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				showDatePicker.call(this, 'endDate');
			}
		}.bind(this));

		this.endDateString = this.startDateString = '-';
		this.dateLabelSurface = new Surface({
			size: [158, 28],
			content: ' - ',
			properties: {
				border: '1px solid #C3C3C3',
				borderRadius: '2px',
				padding: '3px',
				color: '#6f6f6f',
				textAlign: 'center',
				whiteSpace: 'no-wrap',
				backgroundColor: '#fff'
			}
		});
		dateContainerSurface.add(new StateModifier({transform: Transform.translate(0, 0, 2)})).add(this.startDatePickerSurface);
		dateContainerSurface.add(new StateModifier({align:[1, 0], origin: [1, 0], transform: Transform.translate(-30, 0, 2)})).add(this.endDatePickerSurface);
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
		this.dateLabelSurface.setContent(this.startDateString + ' - ' + this.endDateString);
		this.plot.loadAllData();

	}

	GraphView.prototype.createTagsPill = function(tag, color) {
		var pillSurface = new Surface({
			content: '<button class="tag-pill btn' + '" id="' + tag.id + '" style="border-left: 2px solid' + color + '; color: ' + color + ';">' + tag.description + '</button>',
			size: [true, 50],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center',
			}
		});
		this.pillsSurfaceList.push(pillSurface);
		this.pillsView.setPillsSurfaceList(this.pillsSurfaceList);
		this.pillsView.setScrollView(pillSurface);
	};

	GraphView.prototype.setScrollView = function (scrollView) {
		this.scrollView = scrollView;
		this.cardSurface.pipe(this.scrollView);
	}

	module.exports = GraphView;
});

