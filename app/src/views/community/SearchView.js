define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var BaseView = require('views/BaseView');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var InputSurface = require('famous/surfaces/InputSurface');
	var FastClick = require('famous/inputs/FastClick');
	var StateView = require('views/StateView');
	var ContainerSurface = require("famous/surfaces/ContainerSurface");
	var FeedView = require('views/community/FeedView');
	var Search = require('models/Search');
	var u = require('util/Utils');

	function SearchView() {
		FeedView.apply(this, arguments);
		console.log('SearchView controller');
		this.createSearchHeader();
		this.createSearchPills();
	}

	SearchView.prototype = Object.create(FeedView.prototype);
	SearchView.prototype.constructor = SearchView;

	SearchView.DEFAULT_OPTIONS = {
		header: true,
		footer: true,
	};

	SearchView.prototype.createSearchHeader = function() {
		this.searchBar = new Surface({
			size: [App.width - 50, 64],
			content: '<div class="search-bar"><i class="fa fa-search fa-2x"></i><input type="text" id="search-input" ' +
				'placeholder="Type your search here"><span class="close-background  pull-right"><i class="fa fa-times"></i></span></div>',
			properties: {

			}
		});

		this.searchBar.on('deploy', function() {
			setTimeout(function() {
				document.getElementById('search-input').focus();
			}, 500);
			document.getElementById('search-input').onkeyup = function(e) {
				if (e.which == 13) {
					var searchTerm = document.getElementById('search-input').value;
					if (searchTerm && searchTerm != this.originalSearchTerm) {
						this.deck.splice(0, this.deck.length);
						this.fetchFeedItems(this.currentPill);
						this.originalSearchTerm = searchTerm;
					}
					if (cordova) {
						cordova.plugins.Keyboard.close();
					}
				}
			}.bind(this);
		}.bind(this));


		this.searchBar.on('commit', function() {
			var searchInputElement = document.getElementById('search-input');
			console.log('focus');
			searchInputElement.focus();
		}.bind(this));

		this.searchBar.on('click', function(e) {
			var classList;
			classList = e.srcElement.classList;
			if (e instanceof CustomEvent && (_.contains(classList, 'fa-times') || _.contains(classList, 'close-background'))) {
				console.log('clearing search bar');
				var searchInputElement = document.getElementById('search-input');
				searchInputElement.value = '';
				setTimeout(function() {
					var searchInputElement = document.getElementById('search-input');
					searchInputElement.focus();
				}, 500)
				e.stopPropagation();
			} else {
				return false;
			}
		}.bind(this));

		this.add(new StateModifier({
			transform: Transform.translate(50, 0, App.zIndex.header + 10)
		})).add(this.searchBar);

		this.headerBackgroundSurface.setProperties({
			backgroundColor: '#f14a42'
		});
	}

	SearchView.prototype.createSearchPills = function() {
		this.pillsScrollViewContainerModifier = new StateModifier({
			origin: [0, 0],
			align: [0, 0],
			transform: Transform.translate(0, 64, App.zIndex.header)
		});

		var pillsScrollViewContainer = new ContainerSurface({
			size: [undefined, 50],
			properties: {
				backgroundColor: '#efefef',
				textAlign: 'center'
			}
		});
		this.add(this.pillsScrollViewContainerModifier).add(pillsScrollViewContainer);

		this.pillsScrollViewModifier = new StateModifier({
			origin: [0.5, 0],
			align: [0.5, 0]
		});
		var navPills = [];
		this.pillsScrollView.sequenceFrom(navPills);

		// Adding navigation pills below header
		navPills.push(this.createPillsSurface('ALL', true));
		navPills.push(this.createPillsSurface('PEOPLE'));
		navPills.push(this.createPillsSurface('DISCUSSIONS'));
		navPills.push(this.createPillsSurface('TRACKATHONS'));
		navPills.push(this.createPillsSurface('AUTHORED'));

		pillsScrollViewContainer.add(this.pillsScrollViewModifier).add(this.pillsScrollView);
	};

	SearchView.prototype.fetchFeedItems = function(lable, args) {
		this.currentPill = lable;
		var searchTerm = document.getElementById('search-input').value;
		var args = args || {
			offset: 0,
			max: this.max
		};
		args.searchTerm = searchTerm || this.originalSearchTerm;
		if (args.searchTerm) {
			if (lable === 'ALL') {
				Search.fetch(args, this.addListItemsToScrollView.bind(this));
			} else if (lable === 'PEOPLE') {
				Search.fetchPeople(args, this.addListItemsToScrollView.bind(this));
			} else if (lable === 'DISCUSSIONS') {
				Search.fetchDiscussions(args, this.addListItemsToScrollView.bind(this));
			} else if (lable === 'TRACKATHONS') {
				Search.fetchSprints(args, this.addListItemsToScrollView.bind(this));
			} else if (lable === 'AUTHORED') {
				Search.fetchOwned(args, this.addListItemsToScrollView.bind(this));
			}
		}
	};

	SearchView.prototype.refresh = function() {

	};

	SearchView.prototype.fetchSearchResults = function(args) {
		args.searchTerm = args.searchTerm || this.originalSearchTerm;
		Search.fetch(args, this.addListItemsToScrollView.bind(this));
	}

	SearchView.prototype.preShow = function(state) {
		BaseView.prototype.preShow.call(this);
		this.leftSurface.setContent('<img src="content/images/left-white.png" width="20px" height="18px"/>');
		if (state && state.lastPage) {
			this.showBackButton();
		}
		return true;
	};

	SearchView.prototype.onShow = function(state) {
		BaseView.prototype.onShow.call(this);
		if (state) {
			this.loadState(state);
		}
		if (state && state.lable) {
			this.setCurrentPill(state.lable);
			setTimeout(function() {
				this.fetchFeedItems(state.lable);
			}.bind(this), 350)
		}
		var lastVisitedPage = App.pageView.history.slice(-1)[0];
		if (lastVisitedPage && (lastVisitedPage === 'PeopleDetailView' ||
				App.pageView.getPage(lastVisitedPage).parentPage)) {
			App.pageView.history.pop();
		}
	};;

	SearchView.prototype.getCurrentState = function() {
		var inputElement = document.getElementById('search-input');
		var searchText = inputElement.value;
		return {
			lastPage: App.pageView.history.pop() || 'FeedView',
			form: [{
				id: 'search-input',
				value: searchText,
				selectionRange: [inputElement.selectionStart, inputElement.selectionEnd]
			}],
			lable: this.currentPill
		}
	}

	App.pages['SearchView'] = SearchView;
	module.exports = SearchView;
});
