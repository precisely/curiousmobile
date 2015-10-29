define(function(require, exports, module) {
	'use strict';
	var View = require('famous/core/View');
	var Surface = require('famous/core/Surface');
	var Transform = require('famous/core/Transform');
	var StateModifier = require('famous/modifiers/StateModifier');
	var Modifier = require('famous/core/Modifier');
	var StateView = require('views/StateView');
	var Scrollview = require('famous/views/Scrollview');
	var RenderController = require('famous/views/RenderController');
	var Graph = require('models/Graph');

	var u = require('util/Utils');

	function LoadGraphOverlay() {
		StateView.apply(this, arguments);
		var backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#fff'
			}
		});
		this.add(new StateModifier({transform: Transform.translate(0, 0, 0)})).add(backgroundSurface);
		this.renderController = new RenderController();
		this.add(new StateModifier({transform: Transform.translate(0, 10, App.zIndex.contextMenu + 1)})).add(this.renderController);
		this.initScrollView();
		this.listGraph();
	}

	LoadGraphOverlay.prototype = Object.create(StateView.prototype);
	LoadGraphOverlay.prototype.constructor = LoadGraphOverlay;

	LoadGraphOverlay.DEFAULT_OPTIONS = {
	};

	LoadGraphOverlay.prototype.initScrollView = function() {
		this.scrollView = new Scrollview({
			direction: 1,
		});
		this.graphItemSurfaceList = [];
		this.scrollView.sequenceFrom(this.graphItemSurfaceList);
		this.renderController.show(this.scrollView);
	};

	LoadGraphOverlay.prototype.listGraph = function() {
		Graph.load({offset: 0}, function(graphList) {
			_.each(graphList, function(graphItem) {
				var graphItemSurface = new Surface({
					size: [undefined, 50],
					content: '<div class="graph-item-bar"><p>' + graphItem.name + '</p><span class="delete-graph">X</span></div>',
					properties: {
						backgroundColor: 'rgb(192, 79, 127)',
						borderBottom: '1px solid #fff'
					}
				});
				graphItemSurface.on('click', function(e) {
					if (u.isAndroid() || (e instanceof CustomEvent)) {
						var classList = e.srcElement.classList;
						var currentView = App.pageView.getCurrentView();
						if (_.contains(classList, 'delete-graph')) {
							u.showAlert({
								message: 'Are you sure to delete the saved gaph?',
								a: 'Yes',
								b: 'No',
								onA: function() {
									Graph.delete(graphItem.id, function() {
										this.graphItemSurfaceList.splice(this.graphItemSurfaceList.indexOf(graphItemSurface), 1);
									}.bind(this));
								}.bind(this),
								onB: function() {
									u.closeAlerts;
								}.bind(this),
							});

						} else {
							currentView.killOverlayContent();
							currentView.graphView.pillsView.updatePillsSurfaceList([]);
							currentView.graphView.plot.loadId(graphItem.id);
							currentView.graphView.drawDateFooter();
						}
					}
				}.bind(this));
				this.graphItemSurfaceList.push(graphItemSurface);
				graphItemSurface.pipe(this.scrollView);
			}.bind(this));
		}.bind(this));
	}

	module.exports = LoadGraphOverlay;
});

