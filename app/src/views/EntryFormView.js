define(function(require, exports, module) {
    var View          = require('famous/core/View');
    var Surface       = require('famous/core/Surface');
    var InputSurface       = require('famous/surfaces/InputSurface');
    var Transform     = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
	var Entry = require('models/Entry');

    function EntryFormView(entry) {
        View.apply(this, arguments);
		this.entry = entry;
		_createIcons.call(this);
    }

    EntryFormView.prototype = Object.create(View.prototype);
    EntryFormView.prototype.constructor = EntryFormView;

    EntryFormView.DEFAULT_OPTIONS = {};

	function _createIcons() {
		this.iconModifier = new StateModifier({
			size: [24,24]	
		});

		this.inputModifier = new StateModifier({
			align: [0.5,0.5]
		});

		inputModifier.sizeFrom(function(){
			var size = mainContext.getSize();
			return [0.7 * size[0], 20];
		});

		var inputSurface = new InputSurface({
			properties: {
			}
		});
		this.add(inputModifier).add(inputSurface);

		var repeatSurface = new ImageSurface({
            content: 'content/images/repeat.png',
			properties: {
			}
		});
		this.add(this.iconModifier).add(repeatSurface);	

		var remindSurface = new ImageSurface({
            content: 'content/images/remind.png',
			properties: {
			}
		});
		this.add(this.iconModifier).add(remindSurface);

		var pinSurface = new ImageSurface({
            content: 'content/images/pin.png',
			properties: {
			}
		});
		this.add(this.iconModifier).add(pinSurface);
	}	
	

    module.exports = EntryFormView;
});
