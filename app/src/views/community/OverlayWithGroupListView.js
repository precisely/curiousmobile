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

	function OverlayWithGroupListView(template, templateProperties, onClickHandler) {
		StateView.apply(this, arguments);
		this.template = template;
		this.onClickHandler = onClickHandler;
		this.templateProperties = templateProperties;
		this.createOverlay();
		this.createGroupsListScrollView();
		this.showOverlayModal();
	}

	OverlayWithGroupListView.prototype = Object.create(StateView.prototype);
	OverlayWithGroupListView.prototype.constructor = OverlayWithGroupListView;

	OverlayWithGroupListView.DEFAULT_OPTIONS = {
	};

	OverlayWithGroupListView.prototype.createOverlay = function() {
		this.overlayRenderController = new RenderController();
		this.overlayContainerSurface = new ContainerSurface({
			properties: {
				zIndex: 12
			}
		});
		this.overlayModal = new Surface({
			size: [undefined, App.height - 110],
			properties: {
				padding: '15px',
				backgroundColor: '#EFEFEF'
			}
		});
		this.overlayModalModifier = new StateModifier({
			transform: Transform.translate(0, 0, App.zIndex.contextMenu)
		});
		this.overlayModal.on('click', this.onClickHandler.bind(this));

		this.overlayContainerSurface.add(this.overlayModalModifier).add(this.overlayModal);
		this.add(new StateModifier({transform: Transform.translate(0, 0, 0)})).add(this.overlayRenderController);
	};

	OverlayWithGroupListView.prototype.createGroupsListScrollView = function() {
		this.groupsListScrollContainer = new ContainerSurface({
			size: [App.width - 40, App.height - 420],
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
		this.xTranslate = 20;
		if (App.width >= 560) {
			this.xTranslate = 90;
			this.groupsListScrollContainer.setSize([575, App.height - 420]);
		}
		this.groupsListScrollContainerModifier = new StateModifier({
			transform: Transform.translate(this.xTranslate, 280, 0)
		});
		this.overlayContainerSurface.add(this.groupsListScrollContainerModifier).add(this.groupsListScrollContainer);
	};

	OverlayWithGroupListView.prototype.showOverlayModal = function() {
		var templateProperties = this.templateProperties || {};
		User.getGroupsToShare(function(data) {
			this.overlayModal.setContent('');
			this.groupsSurfaceList.splice(0, this.groupsSurfaceList.length);
			this.groupName = templateProperties.groupName || '';
			this.groupFullName = '';
			templateProperties.height = (App.pageView.getCurrentPage() === 'DiscussionDetailView') ? App.height - 420 : App.height - 400;

			this.overlayModal.setContent(_.template(this.template, templateProperties, templateSettings));

			_.each(data.groups, function(groupName, index) {
				var groupSurface = new Surface({
					size: [undefined, true],
					content: _.template(groupsListTemplate, {index: index, groupName: groupName, currentGroup: templateProperties.groupName}, templateSettings)
				});
				if (groupName.name === this.groupName) {
					this.groupFullName = groupName.fullName;
				}
				groupSurface.on('click', function(e) {
					if (e instanceof CustomEvent) {
						this.groupName = groupName.name;
						this.groupFullName = groupName.fullName;
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
					document.activeElement.blur();
					var yOffset = document.getElementById('group-list-container').getBoundingClientRect().top;
					this.groupsListScrollContainerModifier.setTransform(Transform.translate(this.xTranslate, yOffset - 65, App.zIndex.contextMenu));
					var chartTitleInputElement = document.getElementById('chart-title');
					if (chartTitleInputElement) {
						chartTitleInputElement.onfocus = function() {
							this.focus();
							setTimeout(function() {
								this.setSelectionRange(0, this.value.length);
							}.bind(this), 50)
						};
					}
			}.bind(this));
		}.bind(this));
	};

	module.exports = OverlayWithGroupListView;
});
