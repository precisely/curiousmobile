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
			content: '&#9664;',
			size: [24,44],
			properties: {
				color: 'white',
				fontSize: '30px'
			}
		});

		var leftModifier = new StateModifier({
			transform: Transform.translate(0, 0, 1),
		});
		this.add(leftModifier).add(leftSurface);	

		leftSurface.on('click', function() {
			this._eventOutput.emit('date-minus');	
		}.bind(this));

		var dateSurface = new Surface({
			content: date.toDateString(),
			properties: {
				fontSize: '20px',
				color: 'white'
			}
		});

		this.dateSurface = dateSurface;

		this.dateSurface.on('click', function() {
			console.log("dateSurface event");
			this._eventOutput.emit('toggle-date-grid');
		}.bind(this));

		var dateModifier = new StateModifier({
			transform: Transform.translate(60, 10,1)	
		});

		this.add(dateModifier).add(dateSurface);

		var rightModifier = new StateModifier({
			transform: Transform.translate(240, 5, 1),
		});

		var rightSurface = new Surface({
			content: '&#9654;',	
			size: [24,44],
			properties: {
				color: 'white',
				fontSize: '30px'
			}
		});
		this.add(rightModifier).add(rightSurface);
		rightSurface.on('click', function() {
			this._eventOutput.emit('date-add');	
		}.bind(this));
				
	}
	
	function _setListener() {
		this.on('date-changed', function (date) {
			this.setDate(date);
		}.bind(this));
	}
	
	SelectDateView.prototype.setDate = function (date) {
		this.date = date;
		this.dateSurface.setContent(date.toDateString());
	}

    module.exports = SelectDateView;
});
