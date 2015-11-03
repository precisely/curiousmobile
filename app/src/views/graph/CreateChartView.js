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
	var treeView = require('util/treeview');
	var tagList = require('util/taglist');

	function CreateChartView() {
		BaseView.apply(this, arguments);
		this.parentPage = 'ChartView';
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
			transform: Transform.translate(0, 184, 13)
		});

		this.add(mod).add(this.renderController);
		_createSearchBar.call(this);
		_createPillsMenu.call(this);
		_createSubmitBar.call(this);
		this.selectedTags = [];
		this.tagsScrollView = new Scrollview({
			direction: 1
		});
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
			size: [undefined, 68],
			content: '<div class="tag-search-div input-group input-group-lg"><i class="input-group-addon fa fa-search fa-2x"></i>' +
				'<input type="text" class="form-control tag-search-input" placeholder="Search Tags"></div>',
			properties: {
				color: '#d8d8d8',
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
			transform: Transform.translate(0, 64, App.zIndex.readView + 1)
		});
		this.add(searchBoxMod).add(this.searchBox);

		var selectionLabelSurface = new Surface({
			size: [undefined, 35],
			content: 'Select up to 3 tags to graph',
			properties: {
				padding: '8px 15px',
				color: '#cc7299',
				fontStyle: 'italic',
				fontSize: '12px',
				fontWeight: '500',
				borderBottom: '1px solid #eaeaea',
				backgroundColor: '#fff'
			}
		});
		this.add(new Modifier({transform: Transform.translate(0, 140, App.zIndex.readView + 1)})).add(selectionLabelSurface);
	}

	function _createPillsMenu() {
		var pillsMod = new StateModifier({
			origin: [0.5, 0.5],
			transform: Transform.translate(App.width / 2 + 20, 30, App.zIndex.header + 1)
		});
		this.add(pillsMod).add(_createPills.call(this));
	}

	function _createPills() {
		var pillSurface = new Surface({
			content: '<div class="btn-group tag-filters" role="group">' +
				'<button type="button" class="btn btn-secondary" id="most-used-pill">Most Used</button>' +
				'<button type="button" class="btn btn-secondary" id="a-z-pill">A-Z</button>' +
				'<button type="button" class="btn btn-secondary" id="uncheck-all-pill">Uncheck All</button></div>',
			size: [true, true],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center'
			}
		});
		pillSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				if (e.srcElement.id === 'a-z-pill') {
					var tagList = Tags.sortTags(App.tagListWidget.list.listItems.list, this.listAscending);
					_renderTagsList.call(this, tagList);
					this.listAscending = !this.listAscending;
				} else if (e.srcElement.id === 'uncheck-all-pill') {
					_.each(this.selectedTags, function(tag) {
						var checkIcon = document.getElementById('selection' + tag.id);
						checkIcon.classList.add('fa-circle-o');
						checkIcon.classList.remove('fa-circle');
					});
					this.selectedTags = [];
				}
			}
		}.bind(this));
		return pillSurface;
	}

	function _createSubmitBar() {
		this.submitFormContainer = new ContainerSurface({
			size: [undefined, 57],
			properties: {
				backgroundColor: '#ff935f',
				padding: '8px',
				color: '#fff'
			}
		});

		var labelSurface = new Surface({
			size: [150, 40],
			content: "CHOOSE GRAPH TYPE: ",
			properties: {
				fontSize: '10px',
				margin: '13px 5px 0px 0px'
			}
		});

		var plotButtonProperties = {
			backgroundColor: 'transparent',
			color: '#fff',
			padding: '10px 5px',
			border: '1px solid #fff',
			textAlign: 'center'
		};

		var createLineChartSurface = new Surface({
			size: [90, 40],
			content: "Line Chart",
			properties: plotButtonProperties
		});

		var createAreaChartSurface = new Surface({
			size: [100, 40],
			content: "Area Chart",
			properties: plotButtonProperties
		});

		createLineChartSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				if (!this.selectedTags || this.selectedTags.length < 1) {
					u.showAlert('No Tags Selected to plot');
				} else {
					App.pageView.changePage('ChartView', {tagsToPlot: this.selectedTags});
				}
			}
		}.bind(this));

		createAreaChartSurface.on('click', function(e) {
			if (u.isAndroid() || (e instanceof CustomEvent)) {
				if (!this.selectedTags || this.selectedTags.length < 1) {
					u.showAlert('No Tags Selected to plot');
				} else {
					App.pageView.changePage('ChartView', {tagsToPlot: this.selectedTags, areaChart: true});
				}
			}
		}.bind(this));

		this.submitFormContainer.add(labelSurface);
		this.submitFormContainer.add(new Modifier({
			transform: Transform.translate(110, 0, 0)
		})).add(createLineChartSurface);
		this.submitFormContainer.add(new Modifier({
			transform: Transform.translate(210, 0, 0)
		})).add(createAreaChartSurface);
		var formContainerMod = new StateModifier({
			transform: Transform.translate(0, App.height - 105, App.zIndex.readView + 1)
		});
		this.add(formContainerMod).add(this.submitFormContainer);
	}

	CreateChartView.prototype.init = function() {
		if (!App.tagListWidget) {
			App.tagListWidget = initTagListWidget(_renderTagsList.bind(this));
		} else {
			_renderTagsList.call(this, App.tagListWidget.list.listItems.list);
		}

		this.renderController.show((this.tagsScrollView));
	};

	function _renderTagsList(tagsList) {
		this.tagsSurfaceList = [];
		_.each(tagsList, function(tag) {
			var circleIcon = 'fa-circle-o';
			_.each(this.selectedTags, function(tagItem) {
				if (tagItem.id === tag.id) {
					circleIcon = 'fa-circle';
					return;
				}
			});
			var tagSurface = new Surface({
				size: [undefined, 50],
				content: '<div data-value="' + tag.id + '" class="tagList"><i class="fa fa-tag"></i><p>' + tag.description +
					'</p><i class="pull-right fa ' + circleIcon + ' fa-2x" id="selection' + tag.id + '"></i></div>'
			});

			tagSurface.on('click', function(event) {
				var checkIconClassList = document.getElementById('selection' + tag.id).classList;
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
						checkIconClassList.remove('fa-circle');
						checkIconClassList.add('fa-circle-o');
					} else {
						this.selectedTags.push(tag);
						checkIconClassList.remove('fa-circle-o');
						checkIconClassList.add('fa-circle');
					}
				}
			}.bind(this));

			tagSurface.pipe(this.tagsScrollView);
			this.tagsSurfaceList.push(tagSurface);
		}.bind(this));
		this.tagsScrollView.sequenceFrom(this.tagsSurfaceList);
	}

	CreateChartView.prototype.preShow = function(state) {
		if (state.selectedTags) {
			this.selectedTags = state.selectedTags.slice(0);
		}
		this.hideSearchIcon();
		this.init();
		return true;
	};

	App.pages['CreateChartView'] = CreateChartView;
	module.exports = CreateChartView;
});
