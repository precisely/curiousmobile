define(function(require, exports, module) {
    'use strict';
    var View = require('famous/core/View');
    var Surface = require('famous/surfaces/ContainerSurface');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
    var u = require('util/Utils');
    var DetailedDiscussion = require('models/DetailedDiscussion');
    var DiscussionTemplate = require('text!templates/detailedDiscussion.html');

    function DiscussionSummaryView(discussion) {
        View.apply(this, arguments);
        this.init(discussion)
    }

    DiscussionSummaryView.prototype = Object.create(View.prototype);
    DiscussionSummaryView.prototype.constructor = DiscussionSummaryView;

    DiscussionSummaryView.DEFAULT_OPTIONS = {};

    DiscussionSummaryView.prototype.init = function(discussion) {

//        DetailedDiscussion.fetch(group, function(deatiledDiscussion) {
        DetailedDiscussion.fetch(function(deatiledDiscussion) {
            var surfaceList = [];
            var $this = this;

            var scrollView = new Scrollview({
                direction: Utility.Direction.Y,
            });

                var prettyDate = u.prettyDate(new Date(deatiledDiscussion.updated));
                deatiledDiscussion.prettyDate =  prettyDate;
                var discussionSurface = new Surface({
                    size: [undefined, true],
                    content: _.template(DiscussionTemplate, deatiledDiscussion, templateSettings),
                });
                this.add(discussionSurface);
        });
    }

    module.exports = DiscussionSummaryView;
});
