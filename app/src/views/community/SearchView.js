define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
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
		header: false,
		footer: true
	};

	SearchView.prototype.createSearchHeader = function() {
		this.searchBar = new Surface({
			size: [undefined, 65],
			content: '<div class="search-bar"><i class="fa fa-search fa-2x"></i><input type="text" id="search-input" ' +
				'placeholder="Type your search here"><span class="close-background  pull-right"><i class="fa fa-times"></i></span></div>',
			properties: {

			}
		});

		this.searchBar.on('deploy', function() {
			document.getElementById('search-input').focus();
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

			document.getElementsByClassName('close-background')[0].onclick = function() {
				this.goBack();
				return true;
			}.bind(this);
		}.bind(this));

		this.add(new StateModifier({
			transform: Transform.translate(0, 0, App.zIndex.header)
		})).add(this.searchBar);
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
		navPills.push(this.createPillsSurface('SPRINTS'));
		navPills.push(this.createPillsSurface('OWNED'));

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
			} else if (lable === 'SPRINTS') {
				Search.fetchSprints(args, this.addListItemsToScrollView.bind(this));
			} else if (lable === 'OWNED') {
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

	SearchView.prototype.preShow = function() {
		return true;
	}

	App.pages['SearchView'] = SearchView;
	module.exports = SearchView;
});
