define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Scrollview = require('famous/views/Scrollview');
	var Modifier = require('famous/core/Modifier');
	var DraggableView = require("views/widgets/DraggableView");
	var u = require('util/Utils');
	var TermsTemplate = require('text!templates/terms-of-service.html');
	var BaseView = require('views/BaseView');

	function TermsView() {
		BaseView.apply(this, arguments);
	}
	TermsView.prototype = Object.create(BaseView.prototype);

	TermsView.prototype.constructor = TermsView;
	TermsView.DEFAULT_OPTIONS = {
		header: true,
		footer: false,
		noBackButton: true
	};


	TermsView.prototype.createBody = function() {
		if (this.parentPage) {
			this.showBackButton();
		} else{
			this.showMenuButton();
			this.options.footer = true;
			this._createFooter();
		}
		var backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#f9f9f9'
			}
		});
		this.add(new StateModifier({transform: Transform.translate(0, 0, 5)})).add(backgroundSurface);
		var bodySurface = new Surface({
			size: [undefined, true],
			content: _.template(TermsTemplate, templateSettings)
		});
		var spareSurface = new Surface({
			size: [undefined, 150]
		});
		this.scrollView = new Scrollview();
		this.scrollView.sequenceFrom([bodySurface, spareSurface]);
		bodySurface.pipe(this.scrollView);
		spareSurface.pipe(this.scrollView);
		this.setBody(this.scrollView);
	};

	TermsView.prototype.preShow = function(state) {
		if (state && state.comingFrom) {
			this.parentPage = state.comingFrom.constructor.name;
		} else {
			this.parentPage = null;
		}
		this.createBody();
		return true;
	}

	App.pages['TermsView'] = TermsView;
	module.exports = TermsView;
});
