define(function(require, exports, module) {
    var View          = require('famous/core/View');
    var Surface       = require('famous/core/Surface');
    var Transform     = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');

    function SelectDateView() {
        View.apply(this, arguments);
		_createNavigation.call(this);
		_setListener.call(this);
    }

    SelectDateView.prototype = Object.create(View.prototype);
    SelectDateView.prototype.constructor = SelectDateView;

    SelectDateView.DEFAULT_OPTIONS = {};

	function _createNavigation() {
		var leftSurface = new Surface({
			content: '&#9664;',
			size: [24,44],
			properties: {
				color: 'white',
				fontSize: '30px'
			}
		});

		var leftModifier = new StateModifier({
			transform: Transform.translate(0, 0, 0),
		});
		this.add(leftModifier).add(leftSurface);	

		var dateSurface = new Surface({
			content: new Date().toDateString(),
			properties: {
				fontSize: '20px',
				color: 'white'
			}
		});

		this.dateSurface = dateSurface;
		dateSurface.pipe(this._eventOutput);

		var dateModifier = new StateModifier({
			transform: Transform.translate(60, 10,0)	
		});

		this.add(dateModifier).add(dateSurface);

		var rightModifier = new StateModifier({
			transform: Transform.translate(240, 5, 0),
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
		
	}
	
	function _setListener() {
		this.on('date-changed', function (date) {
			this.date = date;
			this.dateSurface.setContent(date.toDateString());
		}.bind(this));
	}

    module.exports = SelectDateView;
});
