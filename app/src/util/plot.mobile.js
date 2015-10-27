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
				});
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
			this.removePlotLine(this.id, line.id);
		}
	};

	PlotMobile.prototype.initiateAddLine = function (tagList) {
		var plot = this;
		_.each(tagList, function (tagListItem) {
			if (tagListItem instanceof TagGroup) {
				tagListItem.fetchAll(function () { plot.addLine(tagListItem); });
			} else {
				Tags.getTagProperties(tagListItem.id, function (tagProperties) {
					console.log("import tag properties");
					tagListItem.isContinuous = tagProperties.isContinuous;
					tagListItem.showPoints = tagProperties.showPoints;
					plot.addLine(tagListItem);
				});
			}
		});
	};

	PlotMobile.prototype.setupSlider = function() {
	};

	module.exports = PlotMobile;
});
