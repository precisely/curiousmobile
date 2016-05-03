define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var DraggableView = require("views/widgets/DraggableView");
	var u = require('util/Utils');
	var BaseView = require('views/BaseView');
	var Scrollview = require('famous/views/Scrollview');
	var Utility = require('famous/utilities/Utility');

	function HelpView() {
		BaseView.apply(this, arguments);
		this.parentPage = 'HelpContentsView';
	}
	HelpView.prototype = Object.create(BaseView.prototype);

	HelpView.prototype.constructor = HelpView;
	HelpView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		noBackButton: false
	};


	HelpView.prototype.createBody = function() {
		this.setHeaderLabel('Curious Help');
		var backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#f9f9f9'
			}
		});
		this.add(new StateModifier({transform: Transform.translate(0, 0, 0)})).add(backgroundSurface);
		var bodySurface = new Surface({
			size: [undefined, true],
			content: _.template(this.options.helpTemplate, templateSettings)
		});

		this.scrollableHelpView = new Scrollview({
			direction: Utility.Direction.Y
		});
	
		var spareSurface = new Surface({
			size: [undefined, 20]
		});
	
		this.scrollableHelpView.sequenceFrom([bodySurface, spareSurface]);
	
		bodySurface.pipe(this.scrollableHelpView);
		spareSurface.pipe(this.scrollableHelpView);

		this.setBody(this.scrollableHelpView);
	};

	HelpView.prototype.preShow = function() {
		this.createBody();
		return true;
	}

	App.pages['HelpView'] = HelpView;
	module.exports = HelpView;
});
