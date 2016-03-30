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
		console.log('LoadGrapOverlay controller');
		var backgroundSurface = new Surface({
			size: [undefined, undefined],
			properties: {
				backgroundColor: '#fff'
			}
		});
		this.add(new StateModifier({transform: Transform.translate(0, 0, 0)})).add(backgroundSurface);
		this.renderController = new RenderController();
		this.add(new StateModifier({transform: Transform.translate(0, 0, App.zIndex.contextMenu + 1)})).add(this.renderController);
		this.initScrollView();
		this.listContents();
	}

	LoadGraphOverlay.prototype = Object.create(StateView.prototype);
	LoadGraphOverlay.prototype.constructor = LoadGraphOverlay;

	LoadGraphOverlay.DEFAULT_OPTIONS = {
	};

	LoadGraphOverlay.prototype.initScrollView = function() {
		this.scrollView = new Scrollview({
			direction: 1,
		});
		this.contentsSurfaceList = [];
		this.scrollView.sequenceFrom(this.contentsSurfaceList);
		this.renderController.show(this.scrollView);
	};

	LoadGraphOverlay.prototype.listContents = function() {
		Graph.load({offset: 0}, function(graphList) {
			_.each(graphList, function(graphItem) {
				var graphItemSurface = new Surface({
					size: [undefined, 50],
					content: '<div class="graph-item-bar"><p>' + graphItem.name + '</p><div class="delete-graph"><i class="fa-2x fa fa-trash-o"></i></div></div>',
					properties: {
						backgroundColor: '#fff',
					}
				});
				graphItemSurface.on('click', function(e) {
					if (e instanceof CustomEvent) {
						var classList = e.srcElement.classList;
						var currentView = App.pageView.getPage('ChartView');
						if (_.contains(classList, 'delete-graph') || _.contains(e.srcElement.parentElement.classList, 'delete-graph')) {
							u.showAlert({
								message: 'Are you sure you want to delete the saved gaph?',
								a: 'Yes',
								b: 'No',
								onA: function() {
									Graph.delete(graphItem.id, function() {
										this.contentsSurfaceList.splice(this.contentsSurfaceList.indexOf(graphItemSurface), 1);
									}.bind(this));
								}.bind(this),
								onB: function() {
									u.closeAlerts;
								}.bind(this),
							});

						} else {
							currentView.killOverlayContent();
							currentView.graphView.clearPillsSurfaceList();
							currentView.graphView.plottedTags.splice(0, currentView.graphView.plottedTags.length);
							currentView.graphView.plot.clearGraphs();
							currentView.graphView.plot.loadId(graphItem.id);
							currentView.graphView.drawDateFooter();
						}
					}
				}.bind(this));
				this.contentsSurfaceList.push(graphItemSurface);
				graphItemSurface.pipe(this.scrollView);
			}.bind(this));
		}.bind(this));
	}

	module.exports = LoadGraphOverlay;
});
