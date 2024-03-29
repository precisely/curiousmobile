define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var RenderNode = require("famous/core/RenderNode");
	var StateView = require('views/StateView');
	var ContainerSurface = require('famous/surfaces/ContainerSurface');
	var InterestTagTemplate = require('text!templates/add-interest-tag.html');
	var User = require('models/User');
	var u = require('util/Utils');

	function AddInterestTagView(parentView) {
		StateView.apply(this, arguments);
		this.parentView = parentView;
		this.userHash = parentView.hash;
		_createNewTags.call(this);
	}

	AddInterestTagView.prototype = Object.create(StateView.prototype);
	AddInterestTagView.prototype.constructor = AddInterestTagView;

	AddInterestTagView.DEFAULT_OPTIONS = {
	};

	function _createNewTags() {
		var formContainerSurface = new Surface({
			size: [undefined, App.height-114],
			content: _.template(InterestTagTemplate, templateSettings),
			properties: {
				background: 'rgba(123, 120, 120, 0.48)'
			}
		});

		var mod = new StateModifier({
			transform: Transform.translate(0, 0, 99)
		});

		formContainerSurface.on('keyup', function(e) {
			if (e instanceof CustomEvent) {
				if (e.srcElement && e.which == 13) {
					this.submit();
				}
			}
		});

		formContainerSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (_.contains(e.srcElement.classList, 'create-tag-button')) {
					this.submit();
				}
			}
		}.bind(this));
		this.add(mod).add(formContainerSurface);
	}

	AddInterestTagView.prototype.clearForm = function() {
		var tagInputField = document.getElementById('tag-name');
		if (tagInputField) {
			tagInputField.value = '';
		}
	};

	AddInterestTagView.prototype.submit = function() {
		User.addInterestTags({tagName: document.getElementById('tag-name').value}, function(data) {
			this.parentView.killOverlayContent({interestTags: data.interestTags});
		}.bind(this));
	};
	module.exports = AddInterestTagView;
});
