define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require("famous/views/RenderController");
	var SequentialLayout = require("famous/views/SequentialLayout");
	var DateUtil = require('DateUtil');

	function DateGridView(date) {
		View.apply(this, arguments);
		this.weekRows = [];
		_createMonthHeader.call(this, date);
		_createMonthGrid.call(this);
	}

	DateGridView.prototype = Object.create(View.prototype);
	DateGridView.prototype.constructor = DateGridView;

	DateGridView.DEFAULT_OPTIONS = {};

	function _createMonthHeader(date) {
		if (typeof date == 'undefined') {
			date = new Date();
		}
		var backgroundSurface = new Surface({
			size: [285, 275],
			properties: {
				backgroundColor: 'white',
				border: '1px solid #c0c0c0',
				borderRadius: '10px'
			}
		});
		this.backgroundSurface = backgroundSurface;
		this.backgroudModifier = new Modifier({
			transform: Transform.identity
		});
		this.add(backgroundSurface);
		var leftSurface = new Surface({
			content: '&#9664;',
			size: [24, 44],
			properties: {
				fontSize: '30px'
			}
		});

		var leftModifier = new StateModifier({
			transform: Transform.translate(10, 0, 1),
		});
		this.add(leftModifier).add(leftSurface);

		var dateSurface = new Surface({
			content: DateUtil.getMonth(date) + ' ' + date.getFullYear(),
			properties: {
				fontSize: '20px',
			}
		});

		var dateModifier = new StateModifier({
			transform: Transform.translate(100, 10, 1)
		});

		this.add(dateModifier).add(dateSurface);

		var rightModifier = new StateModifier({
			transform: Transform.translate(245, 5, 1),
		});

		var rightSurface = new Surface({
			content: '&#9654;',
			size: [24, 44],
			properties: {
				fontSize: '30px'
			}
		});
		this.add(rightModifier).add(rightSurface);
	}

	function _createMonthGrid(month) {
		var rowItemHeight = 35;
		var rowItemWidth = 35;
		var daysOfTheWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
		var dayLabelSurfaces = [];
		for (var i = 0, len = daysOfTheWeek.length; i < len; i++) {
			var weekdaySurface = new Surface({
				size: [rowItemWidth - 5, rowItemHeight - 5],
				content: daysOfTheWeek[i],
				properties: {
					color: '#555555',
					padding: '5px',
				}
			});
			dayLabelSurfaces.push(weekdaySurface);
		}

		var dayLabelLayout = new SequentialLayout({
			direction: 0,
			itemSpacing: 12,
		});

		var dayLabelModifier = new Modifier({
			transform: Transform.translate(0, 40, 1)
		});
		dayLabelLayout.sequenceFrom(dayLabelSurfaces);

		this.add(dayLabelModifier).add(dayLabelLayout);
		this.daySurfaces = [];
		var daysInAWeek = [];
		var tempWeekRows = [];
		for (var i = 1, len = 43; i < len; i++) {
			var daySurface = new Surface({
				size: [rowItemWidth - 5, rowItemHeight - 5],
				content: i,
				properties: {
					color: '#555555',
					backgroundColor: '#c0c0c0',
					border: '1px solid #555555',
					borderRadius: '5px',
					padding: '5px',
				}
			});
			daySurface.date = new Date();
			daySurface.parent = this;

			daySurface.on('click', function($event) {
				console.log("daySurface event");
				this.parent._eventOutput.emit('select-date', this.date);
			});

			this.daySurfaces.push(daySurface);
			daysInAWeek.push(daySurface);
			if (i % 7 == 0) {
				var weekColumnLayout = new SequentialLayout({
					direction: 0,
					itemSpacing: 9,
				});
				weekColumnLayout.setOutputFunction(function(input, offset, index) {
					//Bumping the offset to add additional padding on the left
					offset += 10;
					var transform = Transform.translate(offset, 0, 1);
					return {
						transform: transform,
						target: input.render()
					};
				});

				weekColumnLayout.sequenceFrom(daysInAWeek);
				this.weekRows.push(weekColumnLayout);
				daysInAWeek = [];
			}
		}
		this.renderDates(new Date());
	}

	DateGridView.prototype.renderDates = function(date) {
		var leadDays = this.getLeadDays(date);
		var rowsToShow = this.numberOfRowsToShow(date);
		var printDate = DateUtil.daylightSavingAdjust(new Date(date.getYear(), date.getMonth(), 1 - leadDays));
		var numOfDays = leadDays + DateUtil.daysInMonth(date);

		for (var i = 0, len = this.daySurfaces.length; i < len; i++) {
			this.daySurfaces[i].setContent(printDate.getDate());
			printDate = new Date(printDate.getFullYear(), printDate.getMonth(), printDate.getDate() + 1);
		}

		var tempWeekRows = [];
		for (var i = 0, len = this.weekRows.length; i < len; i++) {
			if (i < rowsToShow) {
				tempWeekRows.push(this.weekRows[i]);
			}
		}

		this.backgroundSurface.setSize([285, 55 * rowsToShow]);
		var weekRowLayout = new SequentialLayout({
			direction: 1,
			itemSpacing: 12,
		});

		weekRowLayout.setOutputFunction(function(input, offset, index) {
			//Bumping the offset to add additional padding on the left
			offset += 70;
			var transform = Transform.translate(0, offset, 1);
			return {
				transform: transform,
				target: input.render()
			};
		});

		weekRowLayout.sequenceFrom(tempWeekRows);

		this.add(weekRowLayout);
		this.datesRendered = weekRowLayout;
	}
	
	DateGridView.prototype.numberOfRowsToShow = function(date) {
		var leadDays = this.getLeadDays(date);
		var curRows = Math.ceil((leadDays + DateUtil.daysInMonth(date)) / 7); // calculate the number of rows to generate		
		return curRows;
	}

	DateGridView.prototype.getLeadDays = function(date) {
		var firstDate = DateUtil.getFirstDayOfMonth(date);
		return 6 - firstDate.getDay();
	}

	module.exports = DateGridView;
});
