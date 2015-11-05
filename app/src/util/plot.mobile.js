define(function(require, exports, module) {
	'use strict';
	var plot = require('util/queryplot');
	var u = require('util/Utils');
	var Tags = require('models/Tags');

	function PlotMobile(tagList, userId, userName, plotAreaDivId, store, interactive, properties) {
		Plot.apply(this, arguments);
		var plot = this;

		this.showAlert = function (alertMessage) {
			u.showAlert(alertMessage);
		};

		this.queuePostJSON = function (description, url, args, successCallback, failCallback, delay) {
			u.queuePostJSON(description, url, args, successCallback, failCallback, delay);
		};

		this.queueJSON = function (description, url, args, successCallback, failCallback, delay, post, background) {
			u.queueJSON(description, url, args, successCallback, failCallback, delay, post, background);
		}

		this.makeGetUrl = function (url) {
			return u.makeGetUrl(url);
		}

		this.getCSRFPreventionObject = function (key, data) {
			return u.getCSRFPreventionObject(key, data);
		}

		this.makePlainUrl = function (url) {
			return u.makePlainUrl(url);
		}

		this.makePostUrl = function (url) {
			return u.makePostUrl(url);
		}

		this.checkData = function (data, status, errorMessage, successMessage) {
			return u.checkData(data, status, errorMessage, successMessage);
		}

		this.makeGetArgs = function (args) {
			return u.makeGetArgs(args);
		}

	}

	PlotMobile.prototype = Object.create(Plot);

	PlotMobile.prototype.constructor = PlotMobile;

	PlotMobile.prototype.getLinearSliderValues = function() {
		var startTime = this.properties.getStartTime();
		var endTime = this.properties.getEndTime();

		if (!startTime) startTime = this.minTime;
		if (!endTime) endTime = this.maxTime;

		var start = startTime;
		var end = endTime;

		if (this.leftLinearSlider > endTime) { this.leftLinearSlider = endTime; start = endTime; }
		else if (this.leftLinearSlider != null && this.leftLinearSlider < startTime) this.leftLinearSlider = null;
		else start = this.leftLinearSlider ? this.leftLinearSlider : startTime;

		if (this.rightLinearSlider > endTime) this.rightLinearSlider = null;
		else if (this.rightLinearSlider != null && this.rightLinearSlider < startTime) { this.rightLinearSlider = startTime; end = startTime; }
		else end = this.rightLinearSlider ? this.rightLinearSlider : endTime;

		return [start, end];
	}

	PlotMobile.prototype.save = function() {
		var first = true;
		var plotDataStr = this.store();
		if (plotDataStr == null) {
			this.showAlert("No plotted data to save");
			return;
		}

		this.queuePostJSON("saving graph", this.makePostUrl("savePlotData"), { name: this.getName(), plotData: plotDataStr },
				function(data) {
					this.checkData(data[0], '', "Error while saving live graph", "Graph saved");
					this.showAlert("Graph saved");
				}.bind(this));
	}

	PlotMobile.prototype.saveSnapshot = function() {
		var first = true;
		var plotDataStr = this.storeSnapshot();
		if (plotDataStr == null) {
			this.showAlert("No plotted data to save");
			return;
		}
		var plot = this;

		this.queuePostJSON("sharing graph", this.makePostUrl("saveSnapshotData"), { name: this.getName() + ' (snapshot)', snapshotData: plotDataStr },
				function(data) {
					if (this.checkData(data)) {
						if (data.success) {
							App.pageView.changePage('DiscussionDetailView', {discussionHash: data.discussionHash});
						} else {
							this.showAlert(data.message);
						}
					}
				}.bind(this));
	};

	PlotMobile.prototype.clearGraphs = function () {
		for (var i in this.lines) {
			var line = this.lines[i];
			console.log('Plot ID: ' + this.id);
			console.log('Line ID: ' + line.id);
			removePlotLine(this.id, line.id);
		}
	};

	PlotMobile.prototype.initiateAddLine = function (tagList, isContinuous) {
		var plot = this;
		this.clearGraphs();
		_.each(tagList, function (tagListItem) {
			if (tagListItem instanceof TagGroup) {
				tagListItem.fetchAll(function () { plot.addLine(tagListItem); });
			} else {
				tagListItem.isContinuous = true;
				tagListItem.showPoints = false;
				plot.addLine(tagListItem);
			}
		});
	};

	PlotMobile.prototype.drawPlot = function() {
		var plotArea = this.plotArea;
		var plot = this;
		this.lastItemClicked = null;
		this.lastItemClickTime = null;
		if (plotArea.is(":hidden")) {
			// Preventing flot.js exception of 0 height or width. (Hiding an element returns width & height as 0)
			console.warn("Plotarea is hidden. Not drawing the graph.");
			return false;
		}
		$.plot(plotArea, this.plotData, this.plotOptions);
		plotArea.off("click");
		plotArea.on("click", function(event) {
			if (plot.ignoreClick) {
				plot.ignoreClick = false;
				return;
			}
			if (typeof plot.activeLineId != 'undefined' && plot.activeLineId != null) {
				var activeLine = plot.getLine(plot.activeLineId);
				if (activeLine) {
					activeLine.deactivate();
				}
				plot.activeLineId = undefined;
			}
		});
		plotArea.off("plothover");
		plotArea.on("plothover", function(event, pos, item) {
			if (item) {
				var now = new Date().getTime();
				plot.lastItemClicked = item;
				plot.lastItemClickTime = now;
				//var dialogDiv = plot.getDialogDiv();
				var plotLine = plot.plotData[item.seriesIndex]['plotLine'];
				plot.ignoreClick = true;
				plot.deactivateActivatedLine(plotLine);
				if(plotLine.smoothLine) {	//means there is a smooth line of this accordion line
					plot.activeLineId = plotLine.smoothLine.id;
					plotLine.smoothLine.activate();
					console.log('plotclick: activating line id: ' + plotLine.id);
				} else {
					plot.activeLineId = plotLine.id;
					plotLine.activate();
					console.log('plotclick: activating line id: ' + plotLine.id);
				}
				if (!plotLine.isSmoothLine()) {	// If current line clicked is a actual line (parent line)
					console.log('plotclick: parent of a smoot line with line id: ' + plotLine.id);
					/*dialogDiv.html(item.series.data[item.dataIndex][2].t + ': <a href="' + plot.properties.showDataUrl(plot.userId, plot.userName, item.datapoint[0])
							+ '">' + $.datepicker.formatDate('M d', new Date(item.datapoint[0])) + "</a>"
							+ ' (' + item.datapoint[1] + ')');
					dialogDiv.dialog({ position: { my: "left+3 bottom-5", at: "left+" + pos.pageX + " top+" + pos.pageY, of: ".container", collision: "fit"}, width: 140, height: 62});*/
				}
			} else {
				console.log('plotclick: Item not found');
			}
		});

		this.store();
	}

	PlotMobile.prototype.setupSlider = function() {
	};

	module.exports = PlotMobile;
});

$(document).on('postLineDetails', function(e, tagLine) {
	App.pageView.getPage('ChartView').graphView.createTagsPill(tagLine.tag, tagLine.color);
});