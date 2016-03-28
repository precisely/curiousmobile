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
	var Timer = require('famous/utilities/Timer');
	var Tags = require('models/Tags');
	var u = require('util/Utils');
	var treeView = require('util/treeview');
	var tagList = require('util/taglist');

	function CreateChartView() {
		BaseView.apply(this, arguments);
		console.log('CreateChartView controller');
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

		this.backRenderController = new RenderController();
		this.add(new StateModifier({transform: Transform.translate(35, 0, App.zIndex.header + 5)})).add(this.backRenderController);
		this.backRenderController.show(this.leftSurface);
		this.init();
	}
	CreateChartView.prototype = Object.create(BaseView.prototype);
	CreateChartView.prototype.constructor = CreateChartView;

	CreateChartView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
		activeMenu: 'chart',
		noBackButton: true
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
					searchTerm = searchTerm.toLowerCase();
					if (searchTerm === '') {
						_renderTagsList.call(this, App.tagListWidget.list.listItems.list);
					} else {
						_renderTagsList.call(this, Tags.eachMatchingTags(searchTerm.toLowerCase()));
					}
				}
			}
		}.bind(this));

		var searchBoxMod = new StateModifier({
			transform: Transform.translate(0, 64, App.zIndex.readView + 1)
		});
		this.add(searchBoxMod).add(this.searchBox);

		var selectionLabelSurface = new Surface({
			size: [undefined, 35],
			content: 'Select up to 6 tags to graph<span class="pull-right uncheck-label-chart">UNCHECK ALL</span>',
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

		selectionLabelSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (_.contains(e.srcElement.classList, 'uncheck-label-chart')) {
					this.selectedTags.splice(0, this.selectedTags.length);
					this.init();
				}
			}
		}.bind(this));
		this.add(new Modifier({transform: Transform.translate(0, 140, App.zIndex.readView + 1)})).add(selectionLabelSurface);
	}

	function _createPillsMenu() {
		var pillsMod = new StateModifier({
			origin: [0.5, 0.5],
			transform: Transform.translate(App.width / 2 + 25, 30, App.zIndex.header + 1)
		});
		this.add(pillsMod).add(_createPills.call(this));
	}

	function handleTagSort(elementId) {
		var sortFilter = 'a-z';
		var removeClassForId = 'most-used-pill';
		var listAscending = !this.listAscending;
		
		if (elementId === 'most-used-pill') {
			sortFilter = 'most-used';
			removeClassForId = 'a-z-pill';
			listAscending = true;
		}
		
		var tagList = Tags.sortTags(App.tagListWidget.list.listItems.list, this.listAscending, sortFilter);
		document.getElementById(removeClassForId).classList.remove('active');
		document.getElementById(elementId).classList.add('active');
		_renderTagsList.call(this, tagList);
		this.listAscending = listAscending;
	}
	
	function _createPills() {
		var pillSurface = new Surface({
			content: '<div class="btn-group tag-filters" role="group">' +
				'<button type="button" class="btn btn-secondary" id="most-used-pill">Most Used</button>' +
				'<button type="button" class="btn btn-secondary active" id="a-z-pill">A-Z</button>',
			size: [true, true],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center'
			}
		});
		pillSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				handleTagSort.call(this, e.srcElement.id);
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
			content: "PLOT GRAPH: ",
			properties: {
				fontSize: '10px',
				margin: '13px 5px 0px 0px'
			}
		});

		var plotButtonProperties = {
			backgroundColor: 'transparent',
			color: '#fff',
			padding: App.width > 320  ? '5px' : '5px 3px',
			border: '1px solid #fff',
			textAlign: 'center'
		};

		var createChartSurface = new Surface({
			size: [55, 30],
			content: "Go",
			properties: plotButtonProperties
		});

		createChartSurface.on('click', function(e) {
			if (e instanceof CustomEvent) {
				if (!this.selectedTags || this.selectedTags.length < 1) {
					u.showAlert('No Tags Selected to plot');
				} else {
					var shareDiscussion = false;
					if (this.shareDiscussion) {
						shareDiscussion = true;
					}
					App.pageView.changePage('ChartView', {tagsToPlot: this.selectedTags, shareDiscussion: shareDiscussion});
					this.shareDiscussion = false;
				}
			}
		}.bind(this));

		this.submitFormContainer.add(labelSurface);
		this.submitFormContainer.add(new Modifier({
			transform: Transform.translate(115, 5, 0)
		})).add(createChartSurface);
		this.formContainerMod = new StateModifier({
			transform: Transform.translate(0, App.height - 105, App.zIndex.readView + 1)
		});
		this.add(this.formContainerMod).add(this.submitFormContainer);
		Timer.every(function() {
			this.formContainerMod.setTransform(Transform.translate(0, App.height - 105, App.zIndex.readView + 1))
		}.bind(this), 2);
	}

	CreateChartView.prototype.init = function() {
		App.tagListWidget = initTagListWidget(_renderTagsList.bind(this));
		_renderTagsList.call(this, App.tagListWidget.list.listItems.list);
		this.renderController.show((this.tagsScrollView));
	};

	function _renderTagsList(tagsList) {
		this.tagsSurfaceList = [];
		_.each(tagsList, function(tag) {
			var squareIcon = 'fa-square-o';
			_.each(this.selectedTags, function(tagItem) {
				if (tagItem.id === tag.id) {
					squareIcon = 'fa-check-square';
					return;
				}
			});
			var tagSurface = new Surface({
				size: [undefined, 50],
				content: '<div data-value="' + tag.id + '" class="tagList"><i class="fa fa-tag"></i><p>' + tag.description +
					'</p><i class="pull-right fa ' + squareIcon + ' fa-2x" id="selection' + tag.id + '"></i></div>'
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
					if (this.selectedTags.length === 6 && indexes.length === 0) {
						u.showAlert('Can not select more than 6 tags');
					} else if (indexes.length > 0) {
						this.selectedTags.splice(indexes[0], 1);
						checkIconClassList.remove('fa-check-square');
						checkIconClassList.add('fa-square-o');
					} else {
						this.selectedTags.push(tag);
						checkIconClassList.remove('fa-square-o');
						checkIconClassList.add('fa-check-square');
					}
				}
			}.bind(this));

			tagSurface.pipe(this.tagsScrollView);
			this.tagsSurfaceList.push(tagSurface);
		}.bind(this));
		this.tagsScrollView.sequenceFrom(this.tagsSurfaceList);
	}

	CreateChartView.prototype.preShow = function(state) {
		this.searchBox.setContent('<div class="tag-search-div input-group input-group-lg"><i class="input-group-addon fa fa-search fa-2x"></i>' +
			'<input type="text" class="form-control tag-search-input" placeholder="Search Tags"></div>');
		if (state && state.selectedTags) {
			this.selectedTags = state.selectedTags.slice(0);
		}
		this.hideSearchIcon();
		this.init();
		return true;
	};

	App.pages['CreateChartView'] = CreateChartView;
	module.exports = CreateChartView;
});
