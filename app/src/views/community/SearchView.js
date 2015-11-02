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
	var FeedView = require('views/community/FeedView');
	var Search = require('models/Search');
	var u = require('util/Utils');

	function SearchView() {
		FeedView.apply(this, arguments);
		this.createSearchHeader();
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
			/*document.getElementById('search-input').value = this.originalSearchTerm;*/
			document.getElementById('search-input').focus();
			document.getElementById('search-input').onkeyup = function(e) {
				if (e.which == 13) {
					var searchTerm = document.getElementById('search-input').value;
					if (searchTerm && searchTerm != this.originalSearchTerm) {
						this.deck.splice(0, this.deck.length);
						this.fetchSearchResults({searchTerm: searchTerm});
						this.originalSearchTerm = searchTerm;
					} else if (!searchTerm) {
						if (cordova) {
							cordova.plugins.Keyboard.close();
						}
					}
				}
			}.bind(this);

			document.getElementsByClassName('close-background')[0].onclick = function() {
				this.goBack();
			}.bind(this);
		}.bind(this));

		var lowerHelpLabel = new Surface({
			size: [undefined, true],
			content: 'You can search for users. discussions, sprints, and groups',
			properties: {
				textAlign: 'center',
				color: '#bcbcbc',
				fontSize: '15px',
				fontWeight: '400',
				padding: '15px 5px 15px 5px',
				backgroundColor: '#efefef'
			}
		});
		this.add(new StateModifier({transform: Transform.translate(0, 65, App.zIndex.header)})).add(lowerHelpLabel);
		this.add(new StateModifier({transform: Transform.translate(0, 0, App.zIndex.header)})).add(this.searchBar);
	}

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

