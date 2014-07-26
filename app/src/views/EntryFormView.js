define(function(require, exports, module) {
    var View          = require('famous/core/View');
    var Surface       = require('famous/core/Surface');
	var ImageSurface = require('famous/surfaces/ImageSurface');
    var InputSurface       = require('famous/surfaces/InputSurface');
    var Transform     = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Modifier = require('famous/core/Modifier');
	var Easing           = require("famous/transitions/Easing");
	var RenderController = require("famous/views/RenderController");
	var Entry = require('models/Entry');

    function EntryFormView(entry) {
        View.apply(this, arguments);
		this.entry = entry;
		this.renderController = new RenderController();
		
		_createForm.call(this);
    }

    EntryFormView.prototype = Object.create(View.prototype);
    EntryFormView.prototype.constructor = EntryFormView;

    EntryFormView.DEFAULT_OPTIONS = {};

	function _createForm() {
		//this.backgroundModifier = new StateModifier({
			//transform: this.transitionableTransform	
		//});
		//this.backgroundSurface = new Surface({
			//properties: {
				//backgroundColor: '#dde2e9'	
			//}
		//});
		//this.add(this.backgroundModifier).add(this.backgroundSurface);
		this.iconModifier = new Modifier({
			size: [24,24],
		});

		this.inputModifier = new Modifier({
			align: [0,0.1]
		});

		this.inputModifier.sizeFrom(function(){
			var mainContext = window.mainContext;
			var size = mainContext.getSize();
			return [0.85 * size[0], 30];
		});

		this.inputSurface = new InputSurface({
			properties: {
			}
		});
		this.add(this.inputModifier).add(this.inputSurface);

		this.repeatSurface = new ImageSurface({
            content: 'content/images/repeat.png',
			properties: {
			}
		});
		this.add(this.iconModifier).add(this.repeatSurface);	

		this.remindSurface = new ImageSurface({
            content: 'content/images/remind.png',
			properties: {
			}
		});
		this.add(this.iconModifier).add(this.remindSurface);

		this.pinSurface = new ImageSurface({
            content: 'content/images/pin.png',
			properties: {
			}
		});
		this.add(this.iconModifier).add(this.pinSurface);
		this.renderController.show(this._node);
	}	
	

    module.exports = EntryFormView;
});
