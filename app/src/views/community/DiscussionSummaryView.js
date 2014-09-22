define(function(require, exports, module) {
    'use strict';
    var View = require('famous/core/View');
    var Surface = require('famous/surfaces/ContainerSurface');
    var Transform = require('famous/core/Transform');
    var Transitionable = require('famous/transitions/Transitionable');
    var StateModifier = require('famous/modifiers/StateModifier');
    var u = require('util/Utils');
    var Utility = require('famous/utilities/Utility');
    var Scrollview = require('famous/views/Scrollview');
    var RenderController = require('famous/views/RenderController');
    var DetailedDiscussion = require('models/DetailedDiscussion');
    var commentTemplate = require('text!templates/comment.html');

    function DiscussionSummaryView(discussionId) {
        View.apply(this, arguments);
        var transition = new Transitionable(Transform.translate(0, 400, 0));
        this.renderController = new RenderController();
        this.renderController.inTransformFrom(transition);
        this.add(this.renderController);
        this.init(discussionId)
    }

    DiscussionSummaryView.prototype = Object.create(View.prototype);
    DiscussionSummaryView.prototype.constructor = DiscussionSummaryView;

    DiscussionSummaryView.DEFAULT_OPTIONS = {};

    DiscussionSummaryView.prototype.init = function(discussionId) {
        var $this = this;
        var surfaceList = [];
        DetailedDiscussion.fetch(discussionId, function(detailedDiscussion) {
            var scrollView = new Scrollview({
                direction: Utility.Direction.Y,
            });
            var prettyDate = u.prettyDate(new Date(detailedDiscussion.updated));
            detailedDiscussion.prettyDate =  prettyDate;
            
            detailedDiscussion.posts.forEach(function(post) {
                var commentSurface = new Surface({
                    size: [undefined, true],
                    content: _.template(commentTemplate, post, templateSettings),
                });
                surfaceList.push(commentSurface);
                commentSurface.pipe(scrollView);
            });
            scrollView.sequenceFrom(surfaceList);
            this.renderController.show(scrollView);
        }.bind(this));
    }

    module.exports = DiscussionSummaryView;
});
