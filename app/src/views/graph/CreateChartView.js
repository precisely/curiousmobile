define(function(require, exports, module) {
	'use strict';
	var BaseView = require('views/BaseView');
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Transform = require('famous/core/Transform');
	var ImageSurface = require('famous/surfaces/ImageSurface');
	var Surface = require('famous/core/Surface');
	var InputSurface = require('famous/surfaces/InputSurface');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var StateView = require('views/StateView');
	var PillsView = require('views/PillsView');
	var RenderNode = require("famous/core/RenderNode");
	var RenderController = require('famous/views/RenderController');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var Scrollview = require('famous/views/Scrollview');
	var Utility = require('famous/utilities/Utility');
	var Engine = require('famous/core/Engine');
	var PeopleDetailsTemplate = require('text!templates/people-details.html');
	var Tags = require('models/Tags');
	var u = require('util/Utils');

	function CreateChartView() {
		BaseView.apply(this, arguments);
		this.backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#fff',
				zIndex: 5
			}
		});
		this.listAscending = false;
		this.setBody(this.backgroundSurface);

		this.renderController = new RenderController();
		var mod = new StateModifier({
			size: [App.width, App.height - 250],
			transform: Transform.translate(0, 164, 16)
		});

		this.add(mod).add(this.renderController);
		_createSearchBar.call(this);
		_createPillsMenu.call(this);
		_createSubmitBar.call(this);
		this.selectedTags = [];
		this.init();
	}
	CreateChartView.prototype = Object.create(BaseView.prototype);
	CreateChartView.prototype.constructor = CreateChartView;

	CreateChartView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		activeMenu: 'chart'
	};

	function _createSearchBar() {
		this.searchBox = new Surface({
			size: [undefined, 40],
			content: '<input type="text" class="tag-search-input" placeholder="Search Tags">',
			properties: {
				color: '#d8d8d8',
				border: '1px solid #d8d8d8',
				borderRadius: '2px',
				backgroundColor: '#fff'
			}
		});

		Engine.on('keyup', function (event) {
			console.log(event);
			if (_.contains(event.srcElement.classList, 'tag-search-input')) {
				if (event.which != 13) {
					var searchTerm = document.getElementsByClassName('tag-search-input')[0].value;
					_renderTagsList.call(this, Tags.eachMatchingTags(searchTerm));
				}
			}
		}.bind(this));

		var searchBoxMod = new StateModifier({
			transform: Transform.translate(0, 66, App.zIndex.readView + 1)
		});
		this.add(searchBoxMod).add(this.searchBox);
	}

	function _createPillsMenu() {
		this.pillsView = new PillsView([_createPills.call(this, 'MOST_USED'), _createPills.call(this, 'A_Z', true), _createPills.call(this, 'UNCHECK_ALL')]);
		var pillsViewMod = new StateModifier({
			transform: Transform.translate(0, 106, App.zIndex.readView + 1)
		});
		this.add(pillsViewMod).add(this.pillsView);
	}

	function _createPills(pillFor, active) {
		var activePill = active ? ' active-pill' : '';
		var pillSurface = new Surface({
			content: '<button class="feed-pill btn' + activePill + '" id="' + pillFor + '-pill">' + pillFor + '</button>',
			size: [true, 50],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center'
			}
		});
		pillSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				if (pillFor === 'A_Z') {
					var tagList = Tags.sortTags(this.listAscending);
					_renderTagsList.call(this, tagList);
					this.listAscending = !this.listAscending;
				}
			}
		}.bind(this));
		return pillSurface;
	}

	function _createSubmitBar() {
		this.submitFormContainer = new ContainerSurface({
			size: [undefined, 40],
			properties: {
				backgroundColor: '#efefef'
			}
		});

		var createLineChartSurface = new Surface({
			size: [90, 40],
			content: "LINE CHART",
			properties: {
				backgroundColor: '#c04f7f',
				color: '#fff',
				padding: '10px 5px'
			}
		});

		var createAreaChartSurface = new Surface({
			size: [100, 40],
			content: "AREA CHART",
			properties: {
				backgroundColor: '#c04f7f',
				color: '#fff',
				padding: '10px 5px'
			}
		});

		createLineChartSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				App.pageView.changePage('ChartView', {tagsToPlot: this.selectedTags});
			}
		}.bind(this));

		this.submitFormContainer.add(createLineChartSurface);
		this.submitFormContainer.add(new Modifier({
			origin: [1, 1],
			align: [1, 1]
		})).add(createAreaChartSurface);
		var formContainerMod = new StateModifier({
			transform: Transform.translate(0, App.height - 90, App.zIndex.readView + 1)
		});
		this.add(formContainerMod).add(this.submitFormContainer);
	}

	CreateChartView.prototype.init = function() {
		this.tagsScrollView = new Scrollview({
			direction: 1
		});
		Tags.fetch(function (data) {
			_renderTagsList.call(this, data);
		}.bind(this));

		this.renderController.show((this.tagsScrollView));

	};

	function _renderTagsList(tagsList) {
		this.tagsSurfaceList = [];
		_.each(tagsList, function(tag) {
			tag = new Tag(tag);
			var tagSurface = new Surface({
				size: [undefined, 40],
				content: '<div data-value="' + tag.id + '" class="tagList"><i class="fa fa-check invisible"></i>' + tag.description + '</div>'
			});

			tagSurface.on('click', function(event) {
				var checkIconClassList = event.srcElement.lastElementChild.classList;
				// finding index of current tag object
				// Stackoverflow link: http://stackoverflow.com/questions/15997879/get-the-index-of-the-object-inside-an-array-matching-a-condition
				var indexes = this.selectedTags.map(function(obj, index) {
					if(obj.id === tag.id) {
						return index;
					}
				}).filter(isFinite)

				if (u.isAndroid() || (event instanceof CustomEvent)) {
					if (this.selectedTags.length === 3 && indexes.length === 0) {
						u.showAlert('Can not select more than 3 tags');
					} else if (indexes.length > 0) {
						this.selectedTags.splice(indexes[0], 1);
						checkIconClassList.add('invisible');
					} else {
						this.selectedTags.push(tag);
						checkIconClassList.remove('invisible');
					}
				}
			}.bind(this));

			tagSurface.pipe(this.tagsScrollView);
			this.tagsSurfaceList.push(tagSurface);
		}.bind(this));
		this.tagsScrollView.sequenceFrom(this.tagsSurfaceList);
	}

	App.pages['CreateChartView'] = CreateChartView;
	module.exports = CreateChartView;
});
