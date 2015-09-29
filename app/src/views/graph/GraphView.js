define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var FastClick = require('famous/inputs/FastClick');
	var StateView = require('views/StateView');
	var GraphTemplate = require('text!templates/chart-canvas.html');
	var User = require('models/User');
	var Tags = require('models/Tags');
	var u = require('util/Utils');

	function GraphView(tagsToPlot) {
		StateView.apply(this, arguments);
		this.tags = tagsToPlot;
		this.init();
	}

	GraphView.prototype = Object.create(StateView.prototype);
	GraphView.prototype.constructor = GraphView;

	GraphView.DEFAULT_OPTIONS = {
	};

	GraphView.prototype.init = function() {
		this.graphSurface = new Surface({
			size: [undefined, undefined],
			content: _.template(GraphTemplate, templateSettings)
		});

		this.add(new StateModifier({transform: Transform.translate(0, 0, 0)})).add(this.graphSurface);
		if (this.tags) {
			this.plot = new Plot(Tags.tagsList, User.getCurrentUserId(), User.getCurrentUser().username, "#plotArea", true, false, new PlotProperties({
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
			this.plot.initiateAddLine(this.tags[0]);
		}
	};

	//assumes propertyClosure has the following methods:
	//get/set: name, startDate. endDate, centered
	function PlotProperties(divIdArray) {
		// assumes divArray has the following properties:
		// startDate, endDate
		// this.startDatePicker = $(divIdArray['startDate']);
		// this.endDatePicker = $(divIdArray['endDate']);
		if (divIdArray['username'] != null)
			this.usernameField = $(divIdArray['username']);
		else
			this.usernameField = null;
		this.nameField = $(divIdArray['name']);
		this.renameField = $(divIdArray['rename']);
		/* if (divIdArray['zoomControl'])
			this.zoomControl = $(divIdArray['zoomControl']);
		this.cycleTagDiv = $(divIdArray['cycleTag']);

		this.startDateInit = divIdArray['startDateInit'];
		this.initStartDate = function() {
			this.startDatePicker.datepicker("setDate", null);
			initTextField(this.startDatePicker, this.startDateInit);
		}
		this.endDateInit = divIdArray['endDateInit'];
		this.initEndDate = function() {
			this.endDatePicker.datepicker("setDate", null);
			initTextField(this.endDatePicker, this.endDateInit);
		}
		this.initStartDate();
		this.initEndDate();*/

		this.getName = function() {
			if (this.nameField) {
				return this.nameField.text();
			}
			return '';
		}
		this.setName = function(name) {
			if (this.nameField)
				this.nameField.text(name);
		}
		this.setUsername = function(name) {
			if (this.usernameField)
				this.usernameField.text(name);
		}
		this.getStartDate = function() {
			/*if (this.startDatePicker.data('textFieldAlreadyReset')) {
				return this.startDatePicker.datepicker('getDate');
			}*/
			return null;
		}
		this.getStartTime = function() {
			/*var startDate = this.getStartDate();
			if (!startDate) return 0;

			return startDate.getTime();
			*/
			return null;
		}
		this.setStartDate = function(date) {
			setDateField(this.startDatePicker, date, this.startDateInit);
		}
		this.getEndDate = function() {
			/*if (this.endDatePicker.data('textFieldAlreadyReset')) {
				return this.endDatePicker.datepicker('getDate');
			}*/
			return null;
		}
		this.getEndTime = function() {
			//var endDate = this.getEndDate();
			//if (!endDate) return 0;

			return null;
		}
		this.setEndDate = function(date) {
			setDateField(this.endDatePicker, date, this.endDateInit);
		}
		this.getZoomControl = function() {
			return this.zoomControl;
		}
		this.getStartDatePicker = function() {
			return this.startDatePicker;
		}
		this.getEndDatePicker = function() {
			return this.endDatePicker;
		}
		this.getUsernameField = function() {
			return this.usernameField;
		}
		this.getNameField = function() {
			return this.nameField;
		}
		this.getRenameField = function() {
			return this.renameField;
		}
		this.getCycleTagDiv = function() {
			return this.cycleTagDiv;
		}
		// show data for a given userId at a given timestamp
		this.showDataUrl = function(userId, userName, timestamp) {
			if (currentUserId != userId) return;
			if (currentUserName != userName) return;
			if (currentUserId < 0) return; // disallow showData for anonymous users
			return "/home/index?showTime=" + timestamp;
		}
		// show data for a given userId at a given timestamp
		this.showData = function(userId, userName, timestamp) {
			window.location = this.showDataUrl(userId, userName, timestamp);
		}
	}

	GraphView.prototype.setScrollView = function (scrollView) {
		this.scrollView = scrollView;
		this.cardSurface.pipe(this.scrollView);
	}

	module.exports = GraphView;
});

