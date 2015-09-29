define(function(require, exports, module) {
    'use strict';
    var BaseView = require('views/BaseView');
    var View = require('famous/core/View');
    var Transitionable = require('famous/transitions/Transitionable');
    var Transform = require('famous/core/Transform');
    var ImageSurface = require('famous/surfaces/ImageSurface');
    var Surface = require('famous/core/Surface');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Modifier = require('famous/core/Modifier');
    var Draggable = require("famous/modifiers/Draggable");
    var StateView = require('views/StateView');
    var GraphView = require('views/graph/GraphView');
    var RenderNode = require("famous/core/RenderNode");
    var RenderController = require('famous/views/RenderController');
    var ContainerSurface = require("famous/surfaces/ContainerSurface");
    var Draggable = require("famous/modifiers/Draggable");
    var Scrollview = require('famous/views/Scrollview');
    var Utility = require('famous/utilities/Utility');
    var User = require('models/User');
    var u = require('util/Utils');
    var CreateChartView = require('views/graph/CreateChartView');


    function ChartView() {
        BaseView.apply(this, arguments);
        this.backgroundSurface = new Surface({
            size: [undefined, undefined],
            properties: {
                backgroundColor: '#fff',
                zIndex: 5
            }
        });
        this.setBody(this.backgroundSurface);
        this.optionsSurface = new Surface({
            size: [44, 64],
            content: '<i class="fa fa-ellipsis-h fa-2x"></i>',
            properties: {
                color: '#F14A42',
                padding: '20px 0px',
                cursor: 'pointer'
            }
        });

        this.optionsSurface.on('click', function() {
            App.pageView._eventOutput.emit('show-context-menu', {
                menu: 'chart',
                target: this,
                eventArg: null
            });
        }.bind(this));

        this.setRightIcon(this.optionsSurface);
        this.renderController = new RenderController();
        var mod = new StateModifier({
            size: [App.width, App.height - 120],
            transform: Transform.translate(0, 64, 16)
        });

        this.add(mod).add(this.renderController);
        this.init();
        _setHandlers.call(this);
    }


    ChartView.prototype = Object.create(BaseView.prototype);
    ChartView.prototype.constructor = ChartView;

    ChartView.DEFAULT_OPTIONS = {
        header: true,
        footer: true,
        activeMenu: 'chart'
    };

    ChartView.prototype.init = function() {
		this.graphView = new GraphView(this.tagsToPlot);
        this.add(new StateModifier({transform: Transform.translate(0, 125, 16)})).add(this.graphView);
    };

	ChartView.prototype.preShow = function(state) {
		if (state) {
			this.tagsToPlot = state.tagsToPlot;
		}
		this.init();
		return true;
	};

    function _setHandlers() {
        this.on('create-chart', function() {
            App.pageView.changePage('CreateChartView');
        });
    }

    App.pages['ChartView'] = ChartView;
    module.exports = ChartView;
});

