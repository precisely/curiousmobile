define(function(require, exports, module) {
	'use strict';
	var Utility = require('famous/utilities/Utility');
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Timer = require('famous/utilities/Timer');
	var Transform = require('famous/core/Transform');
	var Transitionable = require('famous/transitions/Transitionable');
	var StateModifier = require('famous/modifiers/StateModifier');
	var RenderController = require('famous/views/RenderController');
	var Scrollview = require('famous/views/Scrollview');
	var DiscussionCollection = require('models/DiscussionCollection');
	var DiscussionTemplate = require('text!templates/discussion.html');
    var SearchTemplate = require('text!templates/search-field.html');
	var TrueSurface = require('surfaces/TrueSurface');
	var u = require('util/Utils');
    var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
    var InputSurface = require("famous/surfaces/InputSurface");
    var SequentialLayout = require("famous/views/SequentialLayout");

	function DiscussionListView(group) {
		View.apply(this, arguments);
		this.group = group;
		this.init();
	}

	DiscussionListView.prototype = Object.create(View.prototype);
	DiscussionListView.prototype.constructor = DiscussionListView;

	DiscussionListView.DEFAULT_OPTIONS = {};

	DiscussionListView.prototype.init = function() {
		//var postSurface = new Surface({
		//content: postTemplate
		//});
		var transition = new Transitionable(Transform.translate(0, 140, 0));
		this.renderController = new RenderController();
		this.renderController.inTransformFrom(transition);
		this.add(this.renderController);
        _createView.call(this);
		this.changeGroup(this.group);
	};


    function _createView(argument) {
/*        var formSurface = new FormContainerSurface({
            size: [200, 200],
        });

        var searchSurface = new InputSurface({
            placeholder: 'discussion title',
            size: [window.innerWidth * 0.972, 25]
        });

        searchSurface.on('keydown', function (e) {
            //on enter
            if (e.keyCode == 13) {
                this.submit();
            }
        }.bind(this));

        var submitSurface = new Surface({
            size: [52, 25],
            content: '<input type="button" value="search" />'
        });

        this.searchSurface = searchSurface;
        submitSurface.on('click', function(e) {
          if (e instanceof CustomEvent) {
                this.submit();  
          }
        }.bind(this));

        var formLayout = new SequentialLayout({
            direction: 1,
            itemSpacing: 7,
        });

        var otherLinksSurface = new Surface({
            size: [200,20],
            content: '<a href="#" class="post-discussion">Post</a>',
            properties: {
                color: 'black',
                fontSize: '11px'
            }
        });

        otherLinksSurface.on('click', function(e) {
            if (e instanceof CustomEvent && _.contains(e.srcElement.classList, 'post-discussion')) {
                    this._eventOutput.emit('create-account');
            }
        }.bind(this));

        var modifier = new StateModifier({
          align: [0.05, 0.2],
          origin: [0.05, 0.2]
        });

//        var modifier  = new StateModifier({
//            transform:Transform.translate(4,60,0)
//        });
        
        formLayout.sequenceFrom([searchSurface, submitSurface, otherLinksSurface]);
        formSurface.add(formLayout);

        this.add(modifier).add(formSurface);*/

        var searchAndPostSurface = new Surface({
            size: [undefined, true],
            content: _.template(SearchTemplate, templateSettings),
        });
        var modifier = new StateModifier({
            align: [0.05, 0.1],
            origin: [0.05, 0.1]
          });
        this.add(modifier).add(searchAndPostSurface);

    }
	
	DiscussionListView.prototype.changeGroup = function(group) {
		DiscussionCollection.fetch(group, function(discussions) {
			var surfaceList = [];
            var $this = this;

			var scrollView = new Scrollview({
				direction: Utility.Direction.Y,
			});

			discussions.forEach(function(discussion) {
				var prettyDate = u.prettyDate(new Date(discussion.updated));
                discussion.prettyDate =  prettyDate;
				var discussionSurface = new Surface({
					size: [undefined, true],
					content: _.template(DiscussionTemplate, discussion, templateSettings),
				});

				discussionSurface.on('deploy', function() {
					Timer.every(function() {
						var size = this.getSize();
						var width = (size[0] == true) ? this._currTarget.offsetWidth : size[0];
						var height = (size[1] == true) ? this._currTarget.offsetHeight : size[1];
						this.setSize([width, height]);
					}.bind(this), 2);
				});
				
				discussionSurface.on('click', function(e) {
//				    if (e instanceof CustomEvent) {
                        console.log(discussion.name);
                        var detailedDiscussionSurface = new Surface({
                            size: [undefined, true],
                            content: _.template(DiscussionTemplate, discussion, templateSettings),
                        });

                        var detailedModifier = new StateModifier({
                          align: [0.5, 0.5],
                          origin: [0.5, 0.5]
                        });

//                        var detailedModifier  = new StateModifier({
//                            transform:Transform.translate(4,260,0)
//                        });
                        $this.add(detailedModifier).add(detailedDiscussionSurface);
                        $this.renderController.hide(scrollView);
//				    }
                }.bind(this));
//                $this.renderController.show(scrollView);

				surfaceList.push(discussionSurface);
				discussionSurface.pipe(scrollView);
			});


			scrollView.sequenceFrom(surfaceList);
			this.renderController.show(scrollView);
		}.bind(this));

	}

	module.exports = DiscussionListView;
});
