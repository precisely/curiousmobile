define(function(require, exports, module) {
    var View          = require('famous/core/View');
    var Surface       = require('famous/core/Surface');
    var Transform     = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');

    function DateGridView() {
        View.apply(this, arguments);
		_init.call(this);
    }

    DateGridView.prototype = Object.create(View.prototype);
    DateGridView.prototype.constructor = DateGridView;

    DateGridView.DEFAULT_OPTIONS = {};

	function _init() {
		var backgroundSurface = new Surface({
			size: [285, 210],	
			properties: {
				backgroundColor: '#dde2e9'
			}
		});
		this.add(backgroundSurface);
		this.changeMonth(new Date());
	}

	DateGridView.prototype.changeMonth = function(month) {
		var rowOffset = 0;
		var rowNumber = 1;
		var colOffset = 7;
		var rowItemHeight = 35;
		var rowItemWidth = 35;
		var paddingBetween = 5;
		for (var i = 0, len = 35; i < len; i++) {
			var daySurface = new Surface({
				size: [rowItemWidth - 5, rowItemHeight - 5],	
				content: i,
				properties: {
					border: '1px solid white',
					borderRadius: '5px',
					padding: '5px',
				}
			});

			var dayModifier = new Modifier({
				transform: Transform.translate(colOffset, rowOffset,0)	
			});
			this.add(dayModifier).add(daySurface);
			colOffset = colOffset + rowItemWidth + paddingBetween;
			if (i%7 == 0 && i!=0) {
				rowOffset = paddingBetween + rowNumber * (rowItemHeight + paddingBetween);	
				rowNumber++;
				colOffset = 7;
			}
		}
	}
    module.exports = DateGridView;
});
