define(function(require, exports, module) {
	var View          = require('famous/core/View');
	var Surface       = require('famous/core/Surface');
	var Transform     = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');

	function SelectDateView(date) {
		View.apply(this, arguments);
		_createNavigation.call(this, date);
		_setListener.call(this);
	}

	SelectDateView.prototype = Object.create(View.prototype);
	SelectDateView.prototype.constructor = SelectDateView;

	SelectDateView.DEFAULT_OPTIONS = {};

	function _createNavigation(date) {
		var leftSurface = new Surface({
			content: '<img src="content/images/left.png" />',	
			size: [79, 74],
			properties: {
				textAlign: 'center',
				paddingTop: '24px',
				paddingRight: '20px'
			}
		});

		var leftModifier = new StateModifier({
			transform: Transform.translate(-5, 0, window.App.zIndex.datePicker),
		});
		this.add(leftModifier).add(leftSurface);	

		leftSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this._eventOutput.emit('date-minus');	
			}
		}.bind(this));

		var dateSurface = new Surface({
			size: [115, 74],
			properties: {
				color: '#e83838',	
				textAlign: 'center',
				paddingTop: '9px'
			}
		});

		this.dateSurface = dateSurface;
		this.setDate(date);

		this.dateSurface.on('click', function(e) {
			console.log("dateSurface event");
			if (e instanceof CustomEvent) {
				this._eventOutput.emit('toggle-date-grid');
			}
		}.bind(this));


		var dateModifier = new StateModifier({
			transform: Transform.translate((window.innerWidth/2) - 100, 0, window.App.zIndex.datePicker)	
		});

		this.add(dateModifier).add(dateSurface);

		var rightModifier = new StateModifier({
			transform: Transform.translate(window.innerWidth - 110, 0, window.App.zIndex.datePicker),
		});

		var rightSurface = new Surface({
			content: '<img src="content/images/right.png" />',	
			size: [90, 74],
			properties: {
				padding: '24px 29px'
			}
		});
		this.add(rightModifier).add(rightSurface);
		rightSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				this._eventOutput.emit('date-add');	
			}
		}.bind(this));

	}

	function _setListener() {
		this.on('date-changed', function (date) {
			this.setDate(date);
		}.bind(this));
	}

	SelectDateView.prototype.setDate = function (date) {
		this.date = date;
		var weekday = new Array(7);
		weekday[0]=  'Sunday';
		weekday[1] = 'Monday';
		weekday[2] = 'Tuesday';
		weekday[3] = 'Wednesday';
		weekday[4] = 'Thursday';
		weekday[5] = 'Friday';
		weekday[6] = 'Saturday';
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		var dayOfTheWeekday = weekday[date.getDay()];
		var monthName = months[date.getMonth()];
		var dateHTML = '<div class="select-date"><div class="day">' + dayOfTheWeekday + '</div>' +
			'<div class="month-date">' + monthName + ' '  + this.getOrdinalSuffix(date.getDate()) + '</div>' +
			'<i class="fa fa-chevron-down"></i></div>';

		this.dateSurface.setContent(dateHTML);
	}

	SelectDateView.prototype.getOrdinalSuffix = function(i) {
		var j = i % 10,
		k = i % 100;
		if (j == 1 && k != 11) {
			return i + "st";
		}
		if (j == 2 && k != 12) {
			return i + "nd";
		}
		if (j == 3 && k != 13) {
			return i + "rd";
		}
		return i + "th";
	};

	module.exports = SelectDateView;
});
