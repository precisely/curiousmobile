define(function(require, exports, module) {
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var SequentialLayout = require("famous/views/SequentialLayout");
	var DateUtil = require('DateUtil');

	function DateGridView(date) {
		View.apply(this, arguments);
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
			size: [285, 310],
			properties: {
				backgroundColor: 'white',
				border: '1px solid #c0c0c0',
				borderRadius: '10px'
			}
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
			transform: Transform.translate(10, 0, 0),
		});
		this.add(leftModifier).add(leftSurface);

		var dateSurface = new Surface({
			content: DateUtil.getMonth(date) + ' ' + date.getFullYear(),
			properties: {
				fontSize: '20px',
			}
		});

		var dateModifier = new StateModifier({
			transform: Transform.translate(100, 10, 0)
		});

		this.add(dateModifier).add(dateSurface);

		var rightModifier = new StateModifier({
			transform: Transform.translate(245, 5, 0),
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
		var daysOfTheWeek = ['Su','Mo','Tu','We','Th','Fr','Sa'];
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
			transform: Transform.translate(0,40,0)	
		});	
		dayLabelLayout.sequenceFrom(dayLabelSurfaces);

		this.add(dayLabelModifier).add(dayLabelLayout);
		this.daySurfaces = [];
		var dayRow = [];
		var weekLayouts = [];
		for (var i = 0, len = 43; i < len; i++) {
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
			dayRow.push(daySurface);
			if (i % 7 == 0 && i != 0) {
				var dayRowLayout = new SequentialLayout({
					direction: 0,
					itemSpacing: 12,
				});
				dayRowLayout.sequenceFrom(dayRow);
				weekLayouts.push(dayRowLayout);
				dayRow = [];
			}
		}

		var monthWeekLayout = new SequentialLayout({
			direction: 1,
			itemSpacing: 12,
		});

		monthWeekLayout.sequenceFrom(weekLayouts);

		var monthWeekModifier = new Modifier({
			transform: Transform.translate(0,70,0)	
		});	
		this.add(monthWeekModifier).add(monthWeekLayout);
	}

	module.exports = DateGridView;
});
