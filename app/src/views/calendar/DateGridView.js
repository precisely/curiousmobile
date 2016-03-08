define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var RenderController = require("famous/views/RenderController");
	var Transitionable = require('famous/transitions/Transitionable');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var dateGridHeader = require("text!templates/date/date-header.html");
	var u = require('util/Utils');
	var DateUtil = require('util/DateUtil');
	function DateGridView(date, withClearButton) {
		View.apply(this, arguments);
		this.weekRows = [];
		this.selectedDate = date;
		this.withClearButton = withClearButton;
		this.currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
		this.currentYear = new Date(date.getFullYear(), date.getMonth(), 1);
		_createMonthHeader.call(this, this.currentMonth);
		_createMonthGrid.call(this);
	}

	DateGridView.prototype = Object.create(View.prototype);
	DateGridView.prototype.constructor = DateGridView;

	DateGridView.DEFAULT_OPTIONS = {
		controlButtonProperties:  {
			fontSize: '20px',
			backgroundColor: '#333',
			color: 'white',
			textAlign: 'center',
			borderRadius: '5px',
			marginLeft: '10px',
			padding : '3px',
			cursor: 'pointer'
		}
	};

	function _zIndex(argument) {
		return window.App.zIndex.datePicker;
	}

	function _createTodayButtom() {
	}
	/**
	* Creates the header to change month
	*/
	function _createMonthHeader(date) {
		if (typeof date == 'undefined') {
			date = new Date();
		}
		var backgroundSurface = new Surface({
			//size: [285, 275],
			size: [undefined, undefined],
			properties: {
				backgroundColor: 'white',
				border: '1px solid #c0c0c0',
				borderRadius: '10px'
			}
		});
		this.backgroundSurface = backgroundSurface;
		this.backgroundSurface.transitionable = new Transitionable(275);
		this.backgroundSurface.state = new Modifier({
			transform: Transform.translate(0, 0, _zIndex())
		});

		this.backgroundSurface.state.sizeFrom(function() {
			return [285, this.backgroundSurface.transitionable.get()];
		}.bind(this));
		this.add(this.backgroundSurface.state).add(backgroundSurface);
		var leftSurface = new Surface({
			content: '&#9664;',
			size: [24, 44],
			properties: {
				fontSize: '30px'
			}
		});

		var leftModifier = new StateModifier({
			transform: Transform.translate(10, 0, _zIndex() + 5),
		});
		this.add(leftModifier).add(leftSurface);

		leftSurface.on('click', function(e) {
			if ((e instanceof CustomEvent)) {
				console.log("leftSurface event");
				this.navigateMonth(-1);
			}
		}.bind(this));

		var monthSurface = new Surface({
			size: [true, true],
			content: this.getMonthHeaderTemplate(),
			properties: {
				fontSize: '20px',
			}
		});

		var monthModifier = new StateModifier({
			transform: Transform.translate(70, 10, _zIndex() + 5)
		});

		this.add(monthModifier).add(monthSurface);
		this.monthSurface = monthSurface;

		this.monthSurface.on('deploy', function() {
			var monthSelect = document.getElementById('select-month');
			var yearSelect = document.getElementById('select-year');
			monthSelect.onchange = function() {
				this.changeMonth(monthSelect.options[monthSelect.selectedIndex].value);
			}.bind(this)

			yearSelect.onchange = function() {
				this.changeYear(yearSelect.options[yearSelect.selectedIndex].value);
			}.bind(this)
		}.bind(this));

		var rightModifier = new StateModifier({
			transform: Transform.translate(245, 5, _zIndex() + 5),
		});

		var rightSurface = new Surface({
			content: '&#9654;',
			size: [24, 44],
			properties: {
				fontSize: '30px'
			}
		});
		this.add(rightModifier).add(rightSurface);
		rightSurface.on('click', function(e) {
			if ((e instanceof CustomEvent)) {
				console.log("rightSurface event");
				this.navigateMonth(1);
			}
		}.bind(this));
	}

	/**
	* Internal method to layout a 7 week grid which would be re-used to render each
	* month view
	*/

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
			transform: Transform.translate(0, 40, _zIndex() + 1)
		});
		dayLabelLayout.sequenceFrom(dayLabelSurfaces);

		this.add(dayLabelModifier).add(dayLabelLayout);
		this.weekRenderControllers = [];
		this.daySurfaces = []; // Flattened bucket to maniputlate all surfaces. See renderDates
		var daysInAWeek = []; // temporary bucket to render each row in the month grid
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
			daySurface.date = this.selectedDate;
			daySurface.parent = this;

			daySurface.on('click', function($event) {
				if ($event instanceof CustomEvent) {
					console.log("daySurface event");
					this.parent._eventOutput.emit('select-date', this.boundDate);
				}
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
					var transform = Transform.translate(offset, 0, _zIndex() + 1);
					return {
						transform: transform,
						target: input.render()
					};
				});

				weekColumnLayout.sequenceFrom(daysInAWeek);
				this.weekRenderControllers.push(new RenderController());
				this.weekRows.push(weekColumnLayout);
				daysInAWeek = [];
			}
		}

		var weekRowLayout = new SequentialLayout({
			direction: 1,
			itemSpacing: 9,
		});

		weekRowLayout.setOutputFunction(function(input, offset, index) {
			//Bumping the offset to add additional padding on the left
			offset = 38 * index;
			offset += 70;
			var transform = Transform.translate(0, offset, _zIndex() + 1);
			return {
				transform: transform,
				target: input.render()
			};
		}.bind(this));

		// Last render controller for the today button	
		this.todayButton = new Surface({
			content: 'Today',
			size: [65, 35],
			properties: this.options.controlButtonProperties
		});

		this.todayButton.on('click', function(e) {
			if (e instanceof CustomEvent) {
				console.log("today botton clicked!");
				var today = new Date();
				this.navigateMonth(today)
				this._eventOutput.emit('select-date', today);
			}
		}.bind(this));
		this.todayController = new RenderController();

		this.todayController.inTransformFrom(function() {
			return Transform.translate(0, 75 + (this.rowsToShow * 37), 999);
		}.bind(this));
		this.add(this.todayController);
		this.todayController.show(this.todayButton);

		if (this.withClearButton) {
			this.setClearButton();
		}

		weekRowLayout.sequenceFrom(this.weekRenderControllers);

		this.add(weekRowLayout);

		this.renderDates(new Date());
	}

	DateGridView.prototype.getMonthHeaderTemplate = function(date) {
	date = date || this.selectedDate;
		var years = [];
		for (var i = 2010, len = 2020; i < len; i++) {
			years.push(i);
		}
		return  _.template(dateGridHeader, {months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
					years: years, currentMonth: date.getMonth() + 1, currentYear: date.getFullYear()}, templateSettings);
	};

	DateGridView.prototype.setClearButton = function() {
		this.clearButton = new Surface({
			content: 'Clear',
			size: [65, 35],
			properties: this.options.controlButtonProperties
		});

		this.clearButton.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this._eventOutput.emit('select-date', undefined);
			}
		}.bind(this));

		this.clearController = new RenderController();

		this.clearController.inTransformFrom(function() {
			return Transform.translate(200, 75 + (this.rowsToShow * 37), 999);
		}.bind(this));
		this.add(this.clearController);
		this.clearController.show(this.clearButton);
	};

	DateGridView.prototype.renderDates = function(date) {
		var leadDays = this.getLeadDays(date);
		var rowsToShow = this.numberOfRowsToShow(date);
		this.rowsToShow = rowsToShow;
		var printDate = DateUtil.daylightSavingAdjust(new Date(date.getFullYear(), date.getMonth(), 1 - leadDays));
		var numOfDays = leadDays + DateUtil.daysInMonth(date);

		console.log('Date Grid: Num of rows to print ' + rowsToShow);
		for (var i = 0, len = this.daySurfaces.length; i < len; i++) {
			var daySurface = this.daySurfaces[i];
			daySurface.setContent(printDate.getDate());
			daySurface.boundDate = printDate;

			if (DateUtil.areEqual(printDate, this.selectedDate)) {
				daySurface.addClass('selected');
				console.log('Date Grid: Found selected date');
			} else {
				daySurface.removeClass('selected');
			}
			printDate = new Date(printDate.getFullYear(), printDate.getMonth(), printDate.getDate() + 1);
		}
		console.log('DateGridView: changing background height ' + rowsToShow);
		// Adding 1 to the number of rows to show to accomodate the today button
		this.backgroundSurface.transitionable.set(80 + (37 * (rowsToShow + 1)));
		for (var i = 0, len = this.weekRows.length; i < len; i++) {
			if (i < rowsToShow) {
				this.weekRenderControllers[i].show(this.weekRows[i]);
			} else {
				this.weekRenderControllers[i].hide();	
			}
		}
	}

	DateGridView.prototype.numberOfRowsToShow = function(date) {
		var leadDays = this.getLeadDays(date);
		var totalDaysInTheGrid = leadDays + DateUtil.daysInMonth(date);
		if (totalDaysInTheGrid > 28 && totalDaysInTheGrid < 36) {
			return 5;	
		} else if (totalDaysInTheGrid > 35) {
			return 6;	
		} else {
			return 4;	
		}
		//var curRows = Math.round(() / 7); // calculate the number of rows to generate		
		//return curRows;
	}

	DateGridView.prototype.getLeadDays = function(date) {
		var firstDate = DateUtil.getFirstDayOfMonth(date);
		return firstDate.getDay();
	};

	DateGridView.prototype.changeMonth = function(month) {
		var monthDate = this.currentMonth;
		if (!isNaN(month) && month >= 1 && month <= 12) {
			monthDate = this.currentMonth = new Date(monthDate.getFullYear(), month - 1, monthDate.getDate());
		} else {
			return;
		}
		this.monthSurface.setContent(this.getMonthHeaderTemplate(monthDate));
		this.renderDates(monthDate);
	};

	DateGridView.prototype.changeYear = function(year) {
		var yearDate = this.currentMonth;
		if (!isNaN(year) && year > 1969 && year < 10000) {
			yearDate = this.currentMonth = new Date(year, yearDate.getMonth() + 1, yearDate.getDate());
		} else {
			return;
		}
		this.monthSurface.setContent(this.getMonthHeaderTemplate(yearDate));
		this.renderDates(yearDate);
	};

	DateGridView.prototype.navigateMonth = function(num) {
		if (num instanceof Date) {
			this.changeMonth(num.getMonth() + 1);
		} else {
			var monthNum = this.currentMonth.getMonth() + 1 + num;
			this.changeMonth(monthNum);
		}
	};

	DateGridView.prototype.getFirstDayOfCurrentDate  = function () {
		return new Date(this.selectedDate.getFullYear(),this.selectedDate.getMonth(), 1);
	};

	DateGridView.prototype.changeYear = function(num) {
		var yearDate = this.getFirstDayOfCurrentDate();
		if (num instanceof Date) {
			yearDate = num;
		} else {
			yearDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + num, monthDate.getDate());
		}
		this.monthSurface.setContent(DateUtil.getMonth(yearDate) + ' ' + yearDate.getFullYear());
		this.renderDates(yearDate);
	}

	DateGridView.prototype.setSelectedDate = function (date) {
		this.selectedDate = date;
		this.renderDates(date);
	}

	module.exports = DateGridView;
});
