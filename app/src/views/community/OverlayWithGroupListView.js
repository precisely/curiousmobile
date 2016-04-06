define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var FastClick = require('famous/inputs/FastClick');
	var StateView = require('views/StateView');
	var Utility = require('famous/utilities/Utility');
	var RenderController = require('famous/views/RenderController');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var Scrollview = require('famous/views/Scrollview');
	var groupsListTemplate = require('text!templates/groups-list.html');
	var User = require('models/User');
	var u = require('util/Utils');

	function OverlayWithGroupListView(template, args) {
		StateView.apply(this, arguments);
		this.template = template;
		this.createOverlay();
		this.createGroupsListScrollView();
	}

	OverlayWithGroupListView.prototype = Object.create(StateView.prototype);
	OverlayWithGroupListView.prototype.constructor = OverlayWithGroupListView;

	OverlayWithGroupListView.DEFAULT_OPTIONS = {
	};

	OverlayWithGroupListView.prototype.createOverlay = function() {
		this.overlayRenderController = new RenderController();
		this.overlayContainerSurface = new ContainerSurface({});
		var backdropSurface = new Surface({
			size: [undefined, undefined],
			align: [0, 1],
			origin: [0, 1],
			properties: {
				opacity: '0.2',
				backgroundColor: '#000000'
			}
		});
		var backdropModifer = new Modifier({
			opacity: 0.5
		});

		this.overlayModal = new Surface({
			size: [undefined, undefined]
		});
		this.overlayModalModifier = new StateModifier({
			transform: Transform.translate(0, 0, 0)
		});
		this.overlayModal.on('click', function(e) {
			if (e instanceof CustomEvent) {
				var classList = e.srcElement.classList;
				if (_.contains(classList, 'close') || _.contains(e.srcElement.parentElement.classList, 'close')) {
					this.overlayRenderController.hide();
				} else if (e.srcElement.id === 'share-chart') {
					App.pageView.getCurrentView().shareChart(this.groupName);
				} else if (_.contains(classList, 'submit-post')) {
					var discussionTitle = document.getElementById('name').value;
					var discussionDescription = document.getElementById('description').value;
					var groupName = this.groupName;
					if (!discussionTitle) {
						u.showAlert('Discussion topic can not be blank');
						return;
					}
					App.pageView.getCurrentView().updateDiscussion({name: discussionTitle, message: discussionDescription, group: groupName});
				}
			}
		}.bind(this));

		this.overlayContainerSurface.add(backdropModifer).add(backdropSurface);
		this.overlayContainerSurface.add(this.overlayModalModifier).add(this.overlayModal);
		this.add(new StateModifier({transform: Transform.translate(0, 0, 0)})).add(this.overlayRenderController);
	};

	OverlayWithGroupListView.prototype.createGroupsListScrollView = function() {
		this.groupsListScrollContainer = new ContainerSurface({
			size: [App.width - 50, App.height - 420],
			properties: {
				overflow: 'hidden',
				boxShadow: 'rgb(223, 223, 223) -6px -48px 34px -23px inset',
				padding: '0px 5px'
			}
		});

		this.groupsListScrollView = new Scrollview({
			direction: Utility.Direction.Y
		});

		this.groupsSurfaceList = [];

		this.groupsListScrollView.sequenceFrom(this.groupsSurfaceList);

		this.groupsListScrollContainer.add(this.groupsListScrollView);

		// TODO Fix the x and y transform to be dynamic with respect to the Device's Screen Resolution.
		this.xTranslate = 25;
		if (App.width >= 560) {
			this.xTranslate = 95;
			this.groupsListScrollContainer.setSize([575, App.height - 420]);
		}
		this.groupsListScrollContainerModifier = new StateModifier({
			transform: Transform.translate(this.xTranslate, 300, 0)
		});

		this.overlayContainerSurface.add(this.groupsListScrollContainerModifier).add(this.groupsListScrollContainer);
	};

	OverlayWithGroupListView.prototype.showOverlayModal = function(templateProperties) {
		User.getGroupsToShare(function(data) {
			this.overlayModal.setContent('');
			this.groupsSurfaceList.splice(0, this.groupsSurfaceList.length);
			this.groupName = '';
			templateProperties = templateProperties || {};
			templateProperties.height = App.height - 420;

			this.overlayModal.setContent(_.template(this.template, templateProperties, templateSettings));

			_.each(data.groups, function(groupName, index) {
				var groupSurface = new Surface({
					size: [undefined, true],
					content: _.template(groupsListTemplate, {index: index, groupName: groupName, currentGroup: templateProperties.groupName}, templateSettings)
				});
				groupSurface.on('click', function(e) {
					if (e instanceof CustomEvent) {
						this.groupName = groupName.name;
					}
				}.bind(this));
				this.groupsSurfaceList.push(groupSurface);
				groupSurface.pipe(this.groupsListScrollView);
			}.bind(this));

			var spareSurfaceForGroupsListScrollView = new Surface({
				size: [undefined, 10]
			});

			this.groupsSurfaceList.push(spareSurfaceForGroupsListScrollView);
			spareSurfaceForGroupsListScrollView.pipe(this.groupsListScrollView);

			this.overlayRenderController.show(this.overlayContainerSurface, null, function() {
					var yOffset = document.getElementById('group-list-container').getBoundingClientRect().top;
					this.groupsListScrollContainerModifier.setTransform(Transform.translate(this.xTranslate, yOffset, 0));
			}.bind(this));
		}.bind(this));
	};

	module.exports = OverlayWithGroupListView;
});
