/**
 * Supporting Javascript file for plotting/loading/saving graph data ---
 */

var beforeLinePlotEvent = "curious.before.line.plot";
var afterLinePlotEvent = "curious.after.line.plot";
var beforeLineRemoveEvent = "curious.before.line.remove";
var afterLineRemoveEvent = "curious.after.line.remove";
var afterQueryTitleChangeEvent = "curious.after.title.change";

var plotLineColorSequence =			 [ '#FF6633', '#990066', '#5BCDFC', '#449BAF', '#9AD3AE', '#D5D879' ];
var plotColorClass =	{'#FF6633':'orange', '#990066':'eggplant', '#5BCDFC':'malibu',
	'#449BAF':'bostonBlue','#9AD3AE':'vistaBlue', '#D5D879':'chenin'};
function colorToFillColor(color,opacity) {
	return 'rgba(' + parseInt(color.substr(1,2),16) + ',' + parseInt(color.substr(3,2),16) + ','
			+ parseInt(color.substr(5,2),16) + ',' + opacity + ')';
}

var offsetSequence = [ 0, .05, -.05, .1, -.1, .15, -.15, .2, -.2, .25, -.25, .3, -.3, .35, -.35, .4, -.4 ];

var queryPlots = {};

function _reverseEntries(entries) {
	if (entries == undefined) return undefined;
	var reversed = [];
	for (var i = entries.length - 1; i >= 0; --i) {
		reversed.push(entries[i]);
	}
	return reversed;
}

function Plot(tagList, userId, userName, plotAreaDivId, store, interactive, properties) {
	// assumes propertyClosure has the following methods:
	// get/set: name, startDate. endDate, centered
	// i.e., getName, setName, etc. --- note that getName passes in a copy of
	// this Plot object

	// clear plot line data if this plot is for a different user
	this.clearStorage = function() {
		localStorage['plotUserId' + this.id] = null;
		localStorage['plotData' + this.id] = '';
		localStorage['plotSnapshotData' + this.id] = '';
	}

	this.userId = userId;
	this.userName = userName;
	this.id = plotAreaDivId.substring(1);
	queryPlots[this.id] = this;
	this.doStore = store;
	this.plotArea = $(plotAreaDivId);
	this.properties = properties;
	this.pendingLoads = 0;
	this.tagList = tagList;

	var plot = this;

	registerLogoutCallback(function() {
		plot.clearStorage();
	});

	this.nextLineId = 0;
	this.lines = [];

	this.cycleTagLine = null;

	this.interactive = interactive;

	this.manualName = false;

	this.setManualName = function(manualName) {
		this.manualName = manualName;
	}

	this.refreshName = function() {
		var i, empty = true;
		for (i in this.lines) {
			empty = false;
			break;
		}
		if (empty) {
			this.manualName = false;
			this.setName('Plot');
			return;
		}
		if (this.manualName) {
			var name = this.getName();
			if (name.length == 0)
				this.setName('Plot');
			return;
		}

		var name = '', first = true;
		for (i in this.lines) {
			var line = this.lines[i];
			if (line.parentLine != null)
				continue;
			if (!first) {
				name = name + '+';
			}
			first = false;
			name = name + line.name;
		}
		var d = new Date();
		name += ':' + d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();

		this.setName(name);

		return name;
	}

	this.getNextLineId = function() {
		return this.nextLineId++;
	}
	this.getName = function() {
		return this.properties.getName();
	}
	this.setName = function(name) {
		this.properties.setName(name);
	}
	this.getLine = function(plotLineId) {
		if (plotLineId == 'cycle')
			return this.cycleTagLine;
		return this.lines['id' + plotLineId];
	}
	this.doRemoveLine = function(plotLineId) {
		// remove line but don't refresh interface
		if (plot.activeLineId == plotLineId)
			plot.activeLineId = null;
		if (plotLineId == 'cycle') {
			this.cycleTagLine = null;
			this.leftCycleSlider = undefined;
			this.rightCycleSlider = undefined;
		} else {
			var line = this.getLine(plotLineId);
			if (line) {
				if (line.parentLine) {
					line.parentLine.smoothLine = null;
					line.parentLine.freqLine = null;
					line.parentLine.hidden = false;
					line.parentLine.setHideCheckbox(false);
				}
				if (line.smoothLine && line.smoothLine != 1)
					delete this.lines['id' + line.smoothLine.id];
				if (line.freqLine && line.freqLine != 1)
					delete this.lines['id' + line.freqLine.id];
			}
			delete this.lines['id' + plotLineId];
		}
	}
	this.removeLine = function(plotLineId) {
		this.doRemoveLine(plotLineId);
		this.refreshName();
		this.refreshAll();
		this.setupSlider();
		this.store();
		$(document).trigger(afterLineRemoveEvent, this);
	}
	this.getCycleTagLine = function() {
		return this.cycleTagLine;
	}
	this.getCycleTagDiv = function() {
		return this.properties.getCycleTagDiv();
	}
	this.removeTagNameFromLine = function(plotLineId, tagName) {
		var plotLine = this.getLine(plotLineId);
		plotLine.removeTagName(tagName);
		if (arrayEmpty(plotLine.getTags())) {
			this.removeLine(plotLine.id);
		} else {
			plotLine.loadPlotData();
		}
	}
	this.store = function() {
		var plotData = [];
		localStorage['plotUserId' + this.id] = this.userId;
		for (var i in this.lines) {
			var line = this.lines[i];
			if (line.isSmoothLine() && line.parentLine.smoothDataWidth == 0) continue; // skip hidden smooth lines
			if (line.isFreqLine() && line.parentLine.freqDataWidth == 0) continue; // skip hidden freq lines
			plotData.push(line.getSavePlotData());
		}
		var cycleTagData = null;
		if (this.cycleTagLine) {
			cycleTagData = this.cycleTagLine.getSavePlotData();
		}
		if (this.doStore && plotData.length == 0) {
			localStorage['plotData' + this.id] = '';
			return null;
		}
		var startTime = this.getStartTime();
		var endTime = this.getEndTime();
		var plotDef = {version:5,name:this.getName(),manualName:this.manualName,userName:this.userName,userId:this.userId,startTime:startTime,endTime:endTime,data:plotData,
			cycleData:cycleTagData,leftCycleSlider:this.leftCycleSlider,rightCycleSlider:this.rightCycleSlider,
			leftLinearSlider:this.leftLinearSlider,rightLinearSlider:this.rightLinearSlider,activeLineId:this.activeLineId};
		var plotDataStr = $.toJSON(plotDef);
		if (this.doStore && supportsLocalStorage()) {
			localStorage['plotData' + this.id] = plotDataStr;
		}
		return plotDataStr;
	}
	this.storeSnapshot = function() {
		var plotData = [];
		localStorage['plotUserId' + this.id] = this.userId;
		for (var i in this.lines) {
			var line = this.lines[i];
			plotData.push(line.getSaveSnapshotData());
		}
		var cycleTagData = null;
		if (this.cycleTagLine) {
			cycleTagData = this.cycleTagLine.getSaveSnapshotData();
		}
		if (this.doStore && plotData.length == 0) {
			localStorage['plotSnapshotData' + this.id] = '';
			return null;
		}
		var startTime = this.getStartTime();
		var endTime = this.getEndTime();
		var plotDef = {version:5,name:this.getName(),manualName:this.manualName,userName:this.userName,userId:this.userId,startTime:startTime,endTime:endTime,data:plotData,
			cycleData:cycleTagData,leftCycleSlider:this.leftCycleSlider,rightCycleSlider:this.rightCycleSlider,
			leftLinearSlider:this.leftLinearSlider,rightLinearSlider:this.rightLinearSlider};
		var plotDataStr = $.toJSON(plotDef);
		if (this.doStore && supportsLocalStorage()) {
			localStorage['plotSnapshotData' + this.id] = plotDataStr;
		}
		return plotDataStr;
	}
	this.saveSnapshot = function() {
		var first = true;
		var plotDataStr = this.storeSnapshot();
		if (plotDataStr == null) {
			this.showAlert("No plotted data to save");
			return;
		}
		var plot = this;

		this.queuePostJSON("sharing graph", this.makePostUrl("saveSnapshotData"), { name: this.getName() + ' (snapshot)', snapshotData: plotDataStr },
				function(data) {
					if (this.checkData(data, '', "Error while saving snapshot")) {
						if (data.success) {
							window.location = this.makePlainUrl('social#discussions/' + data.discussionHash);
						} else {
							this.showAlert(data.message);
						}
					}
				});
	}
	this.load = function(plotData) {
		$(document).trigger(beforeLinePlotEvent);
		var version = plotData.version;
		if (plotData.startTime) {
			this.properties.setStartDate(new Date(plotData.startTime));
		}
		if (plotData.endTime) {
			this.properties.setEndDate(new Date(plotData.endTime));
		}
		for (var i in plotData.data) {
			if (version < 2) {
				plotData.data[i].entries = _reverseEntries(plotData.data[i].entries);
			}
			this.loadLine(plotData.data[i]);
		}
		if (plotData.cycleData) {
			this.loadLine(plotData.cycleData);
		}
		this.properties.setName(plotData.name);
		this.manualName = version > 3 ? plotData.manualName : false;
		if (version >= 3) {
			this.userId = plotData.userId;
			this.userName = plotData.userName;
		}
		this.leftCycleSlider = plotData.leftCycleSlider;
		this.rightCycleSlider = plotData.rightCycleSlider;
		this.leftLinearSlider = plotData.leftLinearSlider;
		this.rightLinearSlider = plotData.rightLinearSlider;
		this.activeLineId = plotData.activeLineId;
		$(document).trigger(afterLinePlotEvent);
	}

	this.loadLine = function(save,version) {
		var parentLine = null;
		this.minSeriesVal = save.min;
		this.maxSeriesVal = save.max;
		this.unitGroupId = save.unitGroupId;
		this.valueScale = save.valueScale;
		var version = version || 5;
		if (save.parentLineName) {
			parentLine = this.getLineByTagName(save.parentLineName);
		}
		save.plot = this;
		save.parentLine = parentLine;

		var isSnapshot = false;
		if (save.entries != null && save.entries != undefined) {
			isSnapshot = true;
		}

		if ((version <= 4 || save.tag == null) && (save.tags != null && save.tags.length > 0)) {
			var tagInstance;
			if (save.tags.length == 1) {
				tagInstance = new Tag({
					id:save.name+0,
					type: "Tag",
					description: save.tags[0],
					treeStore: tagList.store});
				tagInstance = tagList.store.createOrUpdate(tagInstance);
				save.tag = tagInstance;
			} else if (save.tags.length > 1) {
				var tagInstance = new TagGroup({
					id: "tagGroup"+save.name+i,
					description: save.name,
					type: "TagGroup",
					treeStore: tagList.store
				});
				tagInstance = tagList.store.createOrUpdate(tagInstance);
				for (var j in save.tags) {
					var childTagInstance = new Tag({
						id:"tag"+save.name+j,
						type: "Tag",
						description: save.tags[j],
						treeStore: tagList.store});
					childTagInstance = tagList.store.createOrUpdate(childTagInstance);
					tagInstance.addChild(childTagInstance);
				}
				save.tag = tagInstance;
			}
		}

		if (save.tag != null) {
			if ( version >= 5 && isSnapshot && typeof save.tag !== 'undefined') {
				if (save.tag.type.indexOf("Group") !== -1) {
					save.tag = this.restoreTagGroup(save.tag);
				} else {
					save.tag = this.restoreTag(save.tag);
				}
			} else {
				save.tag = tagList.store.getTagByName(save.tag.description);
			}
		}

		if (!isSnapshot && save.tag instanceof TagGroup && save.tag.children.length == 0) {
			save.tag.getChildren(function() { this.createPlotLine(save, parentLine); }.bind(this));
		} else {
			this.createPlotLine(save, parentLine);
		}
	}

	this.createPlotLine = function(save, parentLine) {
		var plotLine = new PlotLine(save);
		if (parentLine) {
			if (save.isFreqLineFlag)
				parentLine.freqLine = plotLine;
			else
				parentLine.smoothLine = plotLine;
		}
		if (plotLine.isCycle)
			this.cycleTagLine = plotLine;
		else
			this.lines['id' + plotLine.id] = plotLine;
		plotLine.loadPlotData();

		if (parentLine) {
			if (!plotLine.hidden && !parentLine.hidden) {
				this.activeLineId = plotLine.id;
				parentLine.activated = true;
			}
		}

		if (plotLine.showYAxis) {
			plotLine.activate();
		}
		return plotLine;
	}

	this.restoreTag = function(tag) {
		tag = new Tag({
			id:tag.id,
			type: "Tag",
			description: tag.description,
			treeStore: tagList.store,
			state: TREEITEM_SNAPSHOT});
		tag = tagList.store.createOrUpdate(tag);
		return tag;
	}

	this.restoreTagGroup = function(tagGroup) {
		/**
		 * tagGroup is a generic object using which we create an Instance of type TagGroup called tagGroupInstance
		 */
		var type = "tagGroup";

		if (tagGroup.type.indexOf("wildcard") !== -1) {
			type = "wildcardTagGroup";
		}
		var tagGroupInstance = new TagGroup({
			id: tagGroup.id,
			description: tagGroup.description,
			type: type,
			treeStore: tagList.store,
			state: TREEITEM_SNAPSHOT
		});
		tagGroupInstance = tagList.store.createOrUpdate(tagGroupInstance);
		for (var j in tagGroup.children) {
			var child;
			if (tagGroup.children[j].type.indexOf("Group") !== -1) {
				child = this.restoreTagGroup(tagGroup.children[j]);
			} else {
				child = this.restoreTag(tagGroup.children[j]);
			}
			tagGroupInstance.addChild(child);
		}
		return tagGroupInstance;
	}

	this.restore = function() {
		if (this.doStore && supportsLocalStorage() && localStorage['plotData' + this.id]) {
			if (localStorage['plotUserId' + this.id] != this.userId) {
				this.clearStorage();
			} else {
				this.load($.evalJSON(localStorage['plotData' + this.id]));
			}
		}
	}
	this.restoreSnapshot = function() {
		if (this.doStore && supportsLocalStorage() && localStorage['plotSnapshotData' + this.id]) {
			if (localStorage['plotUserId'] != this.userId) {
				this.clearStorage();
			} else {
				this.loadSnapshot($.evalJSON(localStorage['plotSnapshotData' + this.id]));
			}
		}
	}
	this.loadSnapshot = function(plotData) {
		var version = plotData.version;
		if (plotData.startTime) {
			this.properties.setStartDate(new Date(plotData.startTime));
		}
		if (plotData.endTime) {
			this.properties.setEndDate(new Date(plotData.endTime));
		}
		for (var i in plotData.data) {
			if (version < 2) {
				plotData.data[i].entries = _reverseEntries(plotData.data[i].entries);
			}

			this.loadLine(plotData.data[i],version);
		}
		if (plotData.cycleData) {
			this.loadLine(plotData.cycleData);
		}
		this.manualName = version > 3 ? plotData.manualName : false;
		this.properties.setName(plotData.name);
		if (plotData.userName)
			this.properties.setUsername(plotData.userName);
		if (version >= 3) {
			this.userId = plotData.userId;
			this.userName = plotData.userName;
		}
		this.leftCycleSlider = plotData.leftCycleSlider;
		this.rightCycleSlider = plotData.rightCycleSlider;
		this.leftLinearSlider = plotData.leftLinearSlider;
		this.rightLinearSlider = plotData.rightLinearSlider;
		this.refreshPlot();
		this.setupSlider();
		this.store();
	}
	this.loadId = function(id) {
		var plot = this;
		this.queueJSON("loading graph", this.makeGetUrl("loadPlotDataId"), this.makeGetArgs({ id:id }), function(plotData) {
			if (this.checkData(plotData)) {
				plot.load(plotData);
			} else
				this.showAlert("Error while loading");
		});
	}
	this.loadSnapshotId = function(id) {
		var plot = this;
		this.queueJSON("loading graph", this.makeGetUrl("loadSnapshotDataId"), this.makeGetArgs({ id:id }), function(plotData) {
			if (this.checkData(plotData)) {
				plot.loadSnapshot(plotData);
			} else {
				this.showAlert("Error while loading");
				window.location = '/home/index';
			}
		});
	}
	this.loadAllData = function() {
		// redraw left nav
		for (var i in this.lines) {
			this.lines[i].loadPlotData();
		}
	}
	this.prepAllLines = function() {
		// redraw left nav
		for (var i in this.lines) {
			this.lines[i].prepEntries();
		}
	}
	this.refreshAll = function() {
		this.refreshNav();
		this.refreshPlot();
	}
	this.refreshNav = function() {
		// redraw left nav
		$("#plotLines" + this.id).html('');
		this.plotArea.html('');
		for (var i in this.lines) {
			if (this.lines[i].appendHTML) {
				this.lines[i].appendHTML();
			}
		}
		// TODO: move these styles out into main.css
		var cycleTagDiv = this.getCycleTagDiv();
		if (this.cycleTagLine && this.cycleTagLine.appendHTML) {
				this.cycleTagLine.appendHTML();
		} else if (cycleTagDiv) {
			cycleTagDiv.html('drag relative tag here');
			cycleTagDiv.css('padding-top','7px');
			cycleTagDiv.css('height','23px');
		}
	}
	// redraw plot but don't recompute it, only change min/max if needed
	this.redrawPlot = function() {
		if (this.plotData == null || this.plotData[0] == undefined)
			this.refreshPlot();

		var sliders = this.getLinearSliderValues();

		if (this.cycleTagLine) {
			this.plotOptions['xaxis']['min'] = this.minCycleRange;
			this.plotOptions['xaxis']['max'] = this.maxCycleRange;
		} else {
			this.plotOptions['xaxis']['min'] = sliders[0];
			this.plotOptions['xaxis']['max'] = sliders[1];
			var span = sliders[1] - sliders[0];
			this.plotOptions['xaxis']['timeformat'] = span < 172800000 ? '%h%p' : (span > 432000000 ? '%m/%d' : '%m/%d %h%p');
		}

		this.drawPlot();
	}

	this.refreshPlot = function() {
		var minTime = undefined, maxTime = undefined;

		for (var i in this.lines) {
			var line = this.lines[i];

			if (line.isSmoothLine() && (!line.entries)) {
				line.calculateSmoothEntries();
				line.prepEntries();
			}
			if (line.isFreqLine() && (!line.entries)) {
				line.calculateFreqEntries();
				line.prepEntries();
			}

			if (minTime == undefined || line.minTime < minTime) minTime = line.minTime;
			if (maxTime == undefined || line.maxTime > maxTime) maxTime = line.maxTime;
		}

		this.minTime = minTime;
		this.maxTime = maxTime;

		if (arrayEmpty(this.lines)) {
			// no more plot lines, remove graph
			this.plotArea.html('');
			this.plotData = null;
			this.plotOptions = null;
			this.store();
			return;
		}

		var d1Data = [];

		var plotData = [];

		var yaxes = [];

		var maxId = -1;

		for (i in this.lines) {
			var line = this.lines[i];

			if (line.hidden) continue;

			var valueScale = line.valueScale;

			var scaleMin, scaleMax;

			var min = line.minTotal;
			var max = line.maxTotal;
			var delta = max - min;
			var unitGroupId = line.unitGroupId;

			if (delta == 0) {
				if (max == 0) {
					line.scaleMin = 0;
					line.scaleMax = 0;
				} else if (max < 0) {
					line.scaleMin = max;
					line.scaleMax = max;
				} else {
					var logMax = Math.log(max) / Math.LN10;
					var newDelta = Math.pow(10, Math.ceil(logMax * 4) / 4);
					line.scaleMax = newDelta;
					line.scaleMin = 0;
				}
			} else {
				var logDelta = Math.log(delta) / Math.LN10;

				if (min < 0) {
					logDelta = Math.log(delta + 5) / Math.LN10;
					var newDelta = Math.pow(10, Math.ceil(logDelta * 4) / 4);
					var deltaDiff = newDelta - delta / 2;

					line.scaleMin = min - deltaDiff;
					line.scaleMax = min + newDelta;
				} else if (logDelta < logMin - 1 && (min > 0)) {
					// variation of data is much smaller than minimum value, set minimum to 
					// nearest increment below min
					var logMin = Math.log(max) / Math.LN10;
					var logMin = Math.log(min) / Math.LN10;

					var newMax = Math.pow(10, Math.ceil(logMax * 4) / 4);
					var newMin = Math.pow(10, Math.floor(logMin * 4) / 4);

					line.scaleMin = newMin;
					line.scaleMax = newMax;
				} else {
					var newDelta = Math.pow(10, Math.ceil(logDelta * 4) / 4);
					line.scaleMax = min + newDelta;
					line.scaleMin = 0;
				}
			}
		}

		for (i in this.lines) {
			var line = this.lines[i];

			if (line.hidden) continue;

			var pData = line.plotData;
			/* changed to no legend
			 if (pData != null) {
			 pData.label = line.name;
			 }*/

			if (line.id > maxId) {
				maxId = line.id;
			}
			var rangeLine = line.isSmoothLine() ? line.parentLine : line;
			yaxes[line.id] = { show: line.yAxisVisible(),
				position: 'left', tickDecimals: 1 };
			if (!rangeLine.isContinuous) {
				var min = rangeLine.scaleMin;
				yaxes[line.id]['min'] = min;
				yaxes[line.id]['max'] = (rangeLine.scaleMax - min) * 1.1 + min + 0.5;
			} else {
				var min = rangeLine.minVal - (rangeLine.scaleMax - rangeLine.scaleMin) / 20;
				if (rangeLine.minVal >= 0 && min < 0)
					min = 0;
				yaxes[line.id]['min'] = min;
				yaxes[line.id]['max'] = (rangeLine.scaleMax - min) * 1.1 + min;
			}
			if (line.allUnity || line.flatten) {
				yaxes[line.id]['min'] = 0;
				yaxes[line.id]['max'] = 2 - (line.yOffset == undefined ? 0 : line.yOffset);
			}
			if (yaxes[line.id]['max'] == yaxes[line.id]['min']) {
				yaxes[line.id]['max'] += 0.5;
			}
			if (yaxes[line.id]['min'] > 0) {
				yaxes[line.id]['min'] -= 0.5;
			}
		}

		for (var j = 0; j < maxId; ++j) {
			if (yaxes[j] == undefined || yaxes[j] == null)
				yaxes[j] = { show: false };
		}

		var options;

		if (this.cycleTagLine) {
			options = {
				series: {
					lines: { show: true },
					points: { show: true }
				},
				xaxis: {
					mode: null,
					min: this.minCycleRange,
					max: this.maxCycleRange
				},
				yaxes: yaxes,
				grid: {
					hoverable: true,
					clickable: true,
					autoHighlight: true,
					mouseActiveRadius: 5
				}
			};
		} else {
			// SEE ALSO redrawPlot() DUPLICATED LOGIC FOR UPDATING THESE
			// PARAMETERS
			var sliders = this.getLinearSliderValues();
			var span = sliders[1] - sliders[0];
			options = {
				series: {
					lines: { show: true },
					points: { show: true }
				},
				xaxis: {
					mode: 'time',
					timeformat: span < 172800000 ? '%h%p' : (span > 432000000 ? '%m/%d' : '%m/%d %h%p'),
					browsertimezone: true,
					min: sliders[0],
					max: sliders[1]
				},
				yaxes: yaxes,
				grid: {
					hoverable: true,
					clickable: true,
					autoHighlight: true,
					mouseActiveRadius: 5
				}
			};
		}

		if (options.xaxis['max'] == options.xaxis['min']) {
			options.xaxis['min'] -= 0.5;
			options.xaxis['max'] += 0.5;
		}

		for (var i in this.lines) {
			if (this.cycleTagLine) {
				var cyclicData = this.lines[i].getCyclicData(this.cycleTagLine);
				for (var j in cyclicData) {
					plotData.push(cyclicData[j]);
				}
			} else
				plotData.push(this.lines[i].getPlotData());
		}

		this.plotData = plotData;
		this.plotOptions = options;

		this.drawPlot();
	}
	this.getDialogDiv = function() {
		return $('#dialogDiv' + plot.id);
	}

	this.addPendingLoad = function() {
		++this.pendingLoads;
	}
	/**
	 * Deactivate any active line determined by activateLineId in Plot instance.
	 * If the current line that was clicked on is a smooth line and also active do not deactivate it.
	 */
	this.deactivateActivatedLine = function(plotLine) {
		var plot = this;

		if (plotLine) {
			if(plotLine.smoothLine) {
				if(plotLine.smoothLine == 1 || plotLine.smoothLine.id == plot.activeLineId) {
					return false;
				}
			}
		}
		var activeLine = plot.getLine(plot.activeLineId);
		if (activeLine) {
			console.log('plot.deactivateActivatedLine: Deactivating line id: ' + plot.activeLineId);
			activeLine.deactivate();
			var dialogDiv = plot.getDialogDiv();
			if (dialogDiv.dialog) {
				dialogDiv.dialog().dialog("close");
			}
		} else {
			console.log('plot.deactivateActivatedLine: No active line to deactivate');
		}
	}
	this.removePendingLoad = function() {
		if (!--this.pendingLoads) {
			this.refreshPlot();
			this.setupSlider();
			this.store();
		}
		if (this.pendingLoads < 0)
			this.pendingLoads = 0; // error check
	}
	this.leastUsedPlotLineColor = function() {
		var colorMap = [];
		var color;
		for (var i in this.lines) {
			color = this.lines[i].color;
			var n = colorMap[color];
			if (!n) colorMap[color] = 1;
			else ++colorMap[color];
		}
		var minCount = 999999999;
		var minColor;
		for (var j in plotLineColorSequence) {
			color = plotLineColorSequence[j];
			var c = colorMap[color];
			if (!c) return color;
			if (c < minCount) {
				minCount = c;
				minColor = color;
			}
		}

		return minColor;
	}
	this.leastUsedOffset = function() {
		var offsetMap = [];
		var offset;
		for (var i in this.lines) {
			if (!(this.lines[i].allUnity || this.lines[i].flatten)) continue;
			offset = this.lines[i].yOffset;
			if (offset != undefined) {
				if (!offsetMap[offset]) {
					offsetMap[offset] = 1;
				} else
					offsetMap[offset]++;
			}
		}
		var minCount = 999999999;
		var minOffset;
		for (var j in offsetSequence) {
			offset = offsetSequence[j];
			var c = offsetMap[offset];
			if (!c) return offset;
			if (c < minCount) {
				minCount = c;
				minOffset = offset;
			}
		}

		return minOffset;
	}
	this.countYAxesShowing = function() {
		var count = 0;

		for (var i in this.lines) {
			if (this.lines[i].showYAxis)
				++count;
		}

		return count;
	}
	this.getLineByTag = function(tag) {
		for (var i in this.lines) {
			var line = this.lines[i];
			if (tag == line.tag)
				return line;
		}

		return null;
	}
	this.getLineByTagName = function(tagName) {
		for (var i in this.lines) {
			var line = this.lines[i];
			if (line.name == tagName)
				return line;
		}

		return null;
	}

	this.drawLine = function($elt) {
		var tagListItem = $elt.data(DATA_KEY_FOR_ITEM_VIEW).getData();
		var plot = this;

		if (tagListItem instanceof TagGroup) {
			tagListItem.fetchAll(function() { plot.addLine(tagListItem); });
		} else {
			tagListItem.getTagProperties(function(tagProperties){
				console.log("import tag properties");
				plot.addLine(tagListItem);
			});
		}
	}

	this.addLine = function(initialTag) {
		// prevent adding duplicate lines
		if (this.getLineByTag(initialTag))
			return;

		$(document).trigger(beforeLinePlotEvent, [initialTag]);
		var plotLine = new PlotLine({plot:this, name:initialTag.description, color:this.leastUsedPlotLineColor(),
			tag: initialTag,showYAxis: false/*this.countYAxesShowing() == 0*/,
			isContinuous:initialTag.isContinuous, showPoints:initialTag.showPoints});

		this.lines['id' + plotLine.id] = plotLine;
		plotLine.loadPlotData();

		this.refreshName();

		this.store();
		$(document).trigger(afterLinePlotEvent, [initialTag]);
	}
	this.addCycleLine = function(initialTag) {
		if (this.cycleTagLine != null) {
			this.cycleTagLine.addTag(initialTag);
		} else {
			this.cycleTagLine = new PlotLine({plot:this,name:initialTag.description,color:'#FF9966',isCycle:true,isContinuous:initialTag.isContinuous,showPoints:false});
			this.refreshName();
			this.cycleTagLine.loadPlotData();
		}
	}
	this.addSmoothLine = function(parentLine, smoothValue) {
		if (parentLine.smoothLine == null) {
			var smoothLine = new PlotLine({plot:this,name:parentLine.name + ' (smooth)',color:parentLine.color,
				parentLine:parentLine,isContinuous:parentLine.isContinuous,showPoints:false,smoothDataWidth:smoothValue,fill:parentLine.fill});
			parentLine.smoothLine = smoothLine;
			smoothLine.calculateSmoothEntries();
			smoothLine.prepEntries();

			this.lines['id' + smoothLine.id] = smoothLine;

			this.refreshName();
			this.store();
		}
	}
	this.addFreqLine = function(parentLine, freqValue) {
		if (parentLine.freqLine == null) {
			var freqLine = new PlotLine({plot:this,name:parentLine.name + ' (freq)',color:parentLine.color,
				parentLine:parentLine,isFreqLineFlag:true,isContinuous:parentLine.isContinuous,showPoints:false,smoothDataWidth:0,fill:parentLine.fill});
			parentLine.freqLine = freqLine;
			freqLine.calculateFreqEntries();
			freqLine.prepEntries();

			this.lines['id' + freqLine.id] = freqLine;

			this.refreshName();
			this.store();
		}
	}
	// delegation methods for PlotProperties
	this.getName = function() {
		return this.properties.getName();
	}
	this.setName = function(name) {
		return this.properties.setName(name);
	}
	this.setUsername = function(name) {
		return this.properties.setUsername(name);
	}
	this.getStartDate = function() {
		return this.properties.getStartDate();
	}
	this.getStartTime = function() {
		return this.properties.getStartTime();
	}
	this.setStartDate = function(date) {
		return this.properties.setStartDate(date);
	}
	this.getEndDate = function() {
		return this.properties.getEndDate();
	}
	this.getEndTime = function() {
		return this.properties.getEndTime();
	}
	this.setEndDate = function(date) {
		return this.properties.setEndDate(date);
	}
}

function parseISO8601(str) {
	// we assume str is a UTC date ending in 'Z'

	var parts = str.split('T'),
			dateParts = parts[0].split('-'),
			timeParts = parts[1].split('Z'),
			timeSubParts = timeParts[0].split(':'),
			timeSecParts = timeSubParts[2].split('.'),
			timeHours = Number(timeSubParts[0]),
			_date = new Date;

	_date.setUTCFullYear(Number(dateParts[0]));
	_date.setUTCDate(1);
	_date.setUTCMonth(Number(dateParts[1])-1);
	_date.setUTCDate(Number(dateParts[2]));
	_date.setUTCHours(Number(timeHours));
	_date.setUTCMinutes(Number(timeSubParts[1]));
	_date.setUTCSeconds(Number(timeSecParts[0]));
	if (timeSecParts[1]) _date.setUTCMilliseconds(Number(timeSecParts[1]));

	// by using setUTC methods the date has already been converted to local
	// time(?)
	return _date;
}

function renamePlotLine(plotId, lineId) {
	var plot = queryPlots[plotId];

	if (!plot.interactive) return;

	var line = plot.getLine(lineId);

	var newName = prompt("Rename line:", line.getName());

	if (newName) {
		line.setName(newName);
		plot.refreshName();
		plot.refreshAll();
	}
}

function removePlotLine(plotId, lineId) {
	queryPlots[plotId].removeLine(lineId);
}

function removeTagNameFromLine(plotId, lineId, tagName) {
	queryPlots[plotId].removeTagNameFromLine(lineId, tagName);
}

var DAYTICKS = 1000*60*60*24;

function PlotLine(p) {
	this.plot = p.plot;
	if (p.isCycle) {
		this.id = "cycle"
	} else {
		this.id = p.plot.getNextLineId();
	}
	this.name = p.name;
	this.color = p.color;
	this.parentLine = p.parentLine ? p.parentLine : null;
	this.isFreqLineFlag = p.isFreqLineFlag ? true : false;
	this.fillColor = colorToFillColor(p.color,'0.3');
	this.cycleFillColor = colorToFillColor(p.color,'0.15');
	this.sumData = p.sumData || p.sumNights ? true : false;
	this.sumNights = false;
	this.tag = p.tag == undefined ? null : p.tag;
	this.tags = p.tags == undefined ? [] : p.tags;
	this.yaxis = this.id + 1;
	this.showYAxis = p.showYAxis ? true : false;
	this.hidden = p.hidden ? true : false;
	this.showLines = p.showLines == undefined ? true : p.showLines;
	this.isContinuous = p.literalData == undefined ? (p.isContinuous == undefined ? false : p.isContinuous) : p.literalData;
	this.showPoints = p.showPoints == undefined ? true : p.showPoints;
	this.smoothDataWidth = p.smoothDataWidth ? p.smoothDataWidth : 0;
	this.smoothLine = p.smoothData ? 1 : null;
	this.freqDataWidth = p.freqDataWidth ? p.freqDataWidth : 0;
	this.freqLine = p.freqData ? 1 : null;
	this.fill = p.fill == undefined ? true : (p.fill ? true : false);
	this.isCycle = p.isCycle ? true : false; // true if this line is used as cyclic data

	if (this.isCycle) {
		this.minRange = p.minRange ? p.minRange : 0;
		this.maxRange = p.maxRange ? p.maxRange : 10000;
	}
	this.flatten = p.flatten ? true : false;
	if (p.entries != null && p.entries != undefined) {
		this.entries = p.entries;
		this.snapshot = true;
	} else {
		this.plotData = [];
		this.snapshot = false;
	}

	this.getTags = function () {
		if (this.snapshot && this.version <= 4) {
			// lecacy snapshots that do not have instances of Tag or TagGroup as references
			return this.tags;
		}
		if (!this.tag) {
			// this shouldn't happen
			return [];
		}
		var tags = this.tag.tagList();
		var tagNames = [];
		for (var i=0;i<tags.length;i++) {
			tagNames.push(tags[i].description);
		}
		return tagNames;
	}

	this.bindTagEventListeners = function() {
		if (!this.tag) return;

		$(this.tag).on("updateEvent", function(event,data) {
			this.setName(data.description)
		}.bind(this));

		$(this.tag).on("updateChildren", function(event,args) {
			this.loadPlotData();
			this.plot.store();
			this.refreshTagList();
			this.plot.refreshPlot();
		}.bind(this));

		$(this.tag).on("removeChild", function(event,args) {
			this.loadPlotData();
			this.plot.store();
			this.refreshTagList();
			this.plot.refreshPlot();
		}.bind(this));
	}

	if(!this.snapshot) {
		this.bindTagEventListeners();
	}

	this.matchTag = function(tag) { // Tag or TagGroup argument
		return tag.matchNameList(tags); // in future when query plot uses real tag references, this will use unique id comparison
	}
	this.getName = function() {
		return this.name;
	}
	this.setName = function(newName) {
		this.name = newName;
		var div = this.getDiv();
		$(".description",div).html(newName);
	}
	this.getDiv = function() {
		return $("#plotline" + this.plot.id + this.id);
	}
	this.getNumTags = function() {
		return tags.length;
	}
	this.getSavePlotData = function() {
		var data = {name:this.name,color:this.color,sumData:this.sumData,
			tag:this.tag,showYAxis:this.showYAxis,hidden:this.hidden,showLines:this.showLines,isCycle:this.isCycle,
			isContinuous:this.isContinuous,isFreqLineFlag:this.isFreqLineFlag,showPoints:this.showPoints,fill:this.fill,smoothDataWidth:this.smoothDataWidth,
			freqDataWidth:this.freqDataWidth,parentLineName:this.parentLine?this.parentLine.name:'',flatten:this.flatten,smoothData:this.smoothLine&&this.smoothDataWidth>0?true:false,
			freqData:this.freqLine&&this.freqDataWidth>0?true:false,
			min:this.minSeriesVal,max:this.maxSeriesVal,unitGroupId:this.unitGroupId,valueScale:this.valueScale};
		if (this.minRange != undefined) data.minRange = this.minRange;
		if (this.maxRange != undefined) data.maxRange = this.maxRange;
		return data;
	}
	this.getSaveSnapshotData = function() {
		var save = this.getSavePlotData();

		save.entries = this.entries;
		return save;
	}

	// TODO: Not required in mobile graph
	this.handleDropTag = function(event, ui) {
		var plotLine = this;
		var $sourceElement = $(ui.draggable[0]);
		var tagListItem = $sourceElement.data(DATA_KEY_FOR_ITEM_VIEW).getData();
		if (!tagListItem)
			return false;
		plotLine.addTag(tagListItem);
	}
	this.displayTag = function(tag) {
		if (!this.snapshot && typeof tag == 'string') {
			var div = $("#plotline" + this.plot.id + this.id + 'list').append('<div class="plotLine" style="color:' + this.color + '"/>').children().last()
					.append('<a href="" style="color:' + this.color + '"/>');
			div.append(escapehtml(tag)).append('<span class="plotLine"><a href="#" style="padding-left:8px;color:#999999" onclick="removeTagNameFromLine(\'' + this.plot.id + "','" + this.id + '\', \'' + addslashes(tagName) + '\')"><img height="12" width="12" src="/images/x.gif"/></a></span>');
		} else {
			var viewInstance;
			if (tag instanceof TagGroup) {
				viewInstance = new TagGroupView(tag);
			} else {
				viewInstance = new TagView(tag);
			}
			$("#plotline" + this.plot.id + this.id + 'list').append(viewInstance.render());
			$(viewInstance.getDOMElement()).data(DATA_KEY_FOR_ITEM_VIEW, viewInstance);
		}

	}

	this.addTagName = function(tagName) {
		// TODO evaluate if this is still needed
	}

	this.addTag = function(tag) {
		if (this.isSmoothLine() || this.isFreqLine()) return; // cannot add or remove tags from

		// this.tag is the plotline's tag group to which another instance is being dropped on
		if ((tag instanceof TagGroup)
				&& (this.tag && this.tag instanceof TagGroup)) {
			this.plot.tagList.addTagGroupToTagGroup(this.tag, tag);
			this.refreshTagList();
		} else if ((tag instanceof Tag)
				&& (this.tag && this.tag instanceof TagGroup)) {
			this.plot.tagList.addTagToTagGroup(this.tag, tag);
			this.displayTag(tag.description);
		} else if (!(tag instanceof TagGroup) && (tag instanceof Tag) && (this.tag && this.tag instanceof Tag)) {
			this.plot.tagList.createTagGroupFromTags(this.tag, tag, this.createTagGroupCallback.bind(this));
		}


		this.loadPlotData();
		this.plot.store();
	}

	this.removeTagName = function(tagName) {
		if (this.tag && this.tag instanceof TagGroup) {
			return this.tag.removeTagByName(tagName);
		}
		return false;
	}

	this.createTagGroupCallback = function(tagGroup) {
		this.tag = tagGroup;
		this.setName(tagGroup.description);
		this.refreshTagList();
		this.loadPlotData();
		this.plot.store();
	}

	this.refreshTagList = function () {
		$("#plotline" + this.plot.id + this.id + 'list').html('');
		var tags = null;

		if (!this.tag) return;
		if (this.tag instanceof TagGroup) {
			for (var i=0;i<this.tag.children.length;i++) {
				this.displayTag(this.tag.children[i]);
			}
		} else {
			this.displayTag(this.tag);
		}


	}
	this.isSmoothLine = function() {
		return this.parentLine != null && (!this.isFreqLineFlag);
	}
	this.isFreqLine = function() {
		return this.parentLine != null && this.isFreqLineFlag;
	}
	this.getIdSuffix = function() {
		return this.plot.id + this.id;
	}
	this.setHideCheckbox = function(val) {
		$("#plotlinehide" + this.getIdSuffix()).attr('checked', val);
	}
	this.setContinuousCheckbox = function(val) {
		$("input[name='plotlinecontinuous" + this.getIdSuffix() + "']").each(function(index, radio) {
			if ($(radio).val() == 'continuous') {
				$(radio).prop('checked', val);
			}
		});
	}
	this.setShowPointsCheckbox = function(val) {
		$("input[name='plotlinepoints" + this.getIdSuffix() + "']").each(function(index, radio) {
			if ($(radio).val() == 'points') {
				$(radio).prop('checked', val);
			}
		});
	}
	this.setIsContinuous = function(val) {
		if (this.isContinuous != val) {
			this.isContinuous = val;
			var plotLine = this;
			this.plot.queueJSON("saving setting", this.plot.makeGetUrl("setTagPropertiesData"), getCSRFPreventionObject("setTagPropertiesDataCSRF",
							{ tags:$.toJSON(this.getTags()), isContinuous:val ? 'true' : 'false' }),
					function(result){
						if (this.checkData(result)) {
							if (plotLine.tag) plotLine.tag.setIsContinuous(val);
						}
					});
		}
	}
	this.setShowPoints = function(val) {
		if (this.showPoints != val) {
			this.showPoints = val;
			var plotLine = this;
			this.plot.queueJSON("saving setting", this.plot.makeGetUrl("setTagPropertiesData"), getCSRFPreventionObject("setTagPropertiesDataCSRF",
							{ tags:$.toJSON(this.getTags()), showPoints:val ? 'true' : 'false' }),
					function(result){
						if (this.checkData(result)) {
							if (plotLine.tag) plotLine.tag.setShowPoints(val);
						}
					});
		}
	}
	this.getMinRange = function() {
		return (this.minRange / 10000.0) * (this.maxVal - this.minVal) + this.minVal;
	}
	this.getMaxRange = function() {
		return (this.maxRange / 10000.0) * (this.maxVal - this.minVal) + this.minVal;
	}
	this.setRange = function(handle, value) {
		var idSuffix = this.getIdSuffix();
		if (handle == 0) {
			this.minRange = value;
			$('#plotlinerangemin' + idSuffix).html('' + Math.floor(this.getMinRange() * 10.0) / 10.0);
			this.plot.refreshPlot();
		} else {
			this.maxRange = value;
			$('#plotlinerangemax' + idSuffix).html('' + Math.ceil(this.getMaxRange() * 10.0) / 10.0);
			this.plot.refreshPlot();
		}
	}
	this.yAxisVisible = function() {
		//if (this.parentLine) return (this.parentLine.hidden || this.parentLine.activated) && this.parentLine.showYAxis;
		if (this.smoothLine) {
			if (this.smoothDataWidth == 0 && this.showYAxis) {
				if (this.freqLine)
					return this.freqDataWidth == 0 && this.showYAxis;
			}
		}
		if (this.freqLine)
			return this.freqDataWidth == 0 && this.showYAxis;
		return this.showYAxis;
	}

	/**
	 * Loading all innner tag groups so that snapshots persists them
	 */
	this.loadAllTagGroupChildren = function(tagGroup) {
		if (tagGroup instanceof TagGroup) {
			tagGroup.fetchAll();
		}
	}

	this.getPlotData = function() {
		if (this.hidden) {
			return [];
		}

		return this.plotData;
	}
	this.loadPlotData = function() {
		if (this.snapshot) {
			this.parseEntries();
			this.prepEntries();
			return; // do not reload snapshots
		}
		if (this.parentLine) {
			return;
		}

		var plot = this.plot;

		plot.addPendingLoad();

		var startDate = this.plot.getStartDate();
		var endDate = this.plot.getEndDate();

		var timeZoneName = jstz.determine().name();

		var method = this.sumData ? "getSumPlotDescData" : "getPlotDescData";
		var plotLine = this;

		this.plot.queueJSON("loading graph data", this.plot.makeGetUrl(method), this.plot.getCSRFPreventionObject(method + "CSRF", {tags: $.toJSON(this.getTags()),
					startDate:startDate == null ? "" : startDate.toUTCString(),
					endDate:endDate == null ? "" : endDate.toUTCString(),
					timeZoneName:timeZoneName }),
				function(plotDesc){
					if (this.checkData(plotDesc)) {
						plotLine.loadEntries(plotDesc);
						if (plotLine.smoothLine && plotLine.smoothDataWidth > 0 && plot.interactive)
							plotLine.smoothLine.entries = undefined;
						if (plotLine.freqLine && plotLine.freqDataWidth > 0 && plot.interactive)
							plotLine.freqLine.entries = undefined;
						plot.removePendingLoad();
					}
				});
	}
	this.calculateSmoothEntries = function() {
		var parentLine = this.parentLine;
		var parentEntries = parentLine.entries;

		if (!parentEntries) return; // don't calculate if parent line hasn't
									// been loaded yet

		var entries = [];

		var segments = [];

		var lastTime = 0;

		var width = Math.ceil(parentLine.smoothDataWidth);

		// parse data into segments
		// if space between two data points >= 1/2 day, start new segment, unless it's a continuous line
		var smoothMinGap = this.parentLine.isContinuous ? DAYTICKS*(width + 1)*3 : DAYTICKS;
		var segment = [];
		for (var i = 0; i < parentEntries.length; ++i) {
			var entry = parentEntries[i];
			var time = entry[0].getTime();
			if (lastTime && time - lastTime > smoothMinGap) {
				segments.push(segment);
				segment = [];
				lastTime = 0;
			}
			var segWidth = lastTime ? time - lastTime : 0;
			segment.push([time, entry[1], segWidth/DAYTICKS]);
			lastTime = time;
		}
		if (segment.length > 0) segments.push(segment);

		// process each segment
		for (i = 0; i < segments.length; ++i) {
			var segment = segments[i];

			if (segment.length == 0) continue; // skip empty sements (should
			// never happen)

			if (segment.length == 1) { // trivial length-one segment
				entries.push([new Date(segment[0][0]), segment[0][1]]);
				continue;
			}

			var series = [];
			var seriesStart = 0;
			var cellStartT = segment[0][0];
			var endT = segment[segment.length - 1][0];
			var r = 0;
			var rangeArea = 0;

			for (; r < segment.length - 1; ++r) {
				var rangeStartT = segment[r][0];
				if (segment[r+1][0] - cellStartT >= DAYTICKS) { // next range
					// boundary at or after 1 day
					var w = (cellStartT + DAYTICKS - segment[r][0]) / DAYTICKS;
					var frac = w / segment[r+1][2];
					var h = segment[r+1][1] - segment[r][1];
					var y = segment[r][1] + h * frac;
					rangeArea += w * (y + segment[r][1]) / 2;
					series.push(rangeArea);
					cellStartT += DAYTICKS;
					// while remaining ranges are greater than a day long, fill
					// in spaces
					while (segment[r+1][0] - cellStartT >= DAYTICKS) {
						var yEnd = y + h / segment[r+1][2];
						series.push((yEnd + y) / 2);
						frac += 1 / segment[r+1][2];
						y = yEnd;
						cellStartT += DAYTICKS;
					}
					// advance to next segment
					rangeArea = ((segment[r+1][1] + y) / 2) * (segment[r+1][0] - cellStartT) / DAYTICKS;
				} else
					rangeArea += segment[r+1][2] * (segment[r][1] + segment[r+1][1]) / 2;
			}
			if (rangeArea > 0) {
				series.push(rangeArea / ((segment[r][0] - cellStartT) / DAYTICKS));
			}

			/**
			 * symmetrical exponential moving average
			 */
			var sum = 0;

			var decay = 1 - 1/(width / 10 + 1);
			var denom = 0;

			// record rightTail values to avoid roundoff error problems with near unity decay values
			var rightTailValues = []
			var rightTailDenom = []

			for (var j = series.length - 1; j >= 0; --j) {
				sum *= decay;
				sum += series[j];

				denom = denom * decay + 1;
				rightTailValues.push(sum);
				rightTailDenom.push(denom);
			}

			var t = segment[0][0];

			entries.push([new Date(t), sum / denom]);

			var rightTailSum = sum;
			var leftTailSum = 0;
			var leftDenom = 0;

			var l = series.length;

			for (j = 0; j < l; ++j) {
				t += DAYTICKS;

				// shift right tail sum
				rightDenom = rightTailDenom[l - j - 1];
				rightTailSum = rightTailValues[l - j - 1];

				// grow left tail sum
				leftTailSum = (leftTailSum * decay) + series[j];
				leftDenom = leftDenom * decay + 1;

				entries.push([new Date(t), (rightTailSum + leftTailSum) / (rightDenom + leftDenom)]);
			}
		}
		this.entries = entries;
	}
	this.calculateFreqEntries = function() {
		var parentLine = this.parentLine;
		var parentEntries = parentLine.entries;

		if (!parentEntries) return; // don't calculate if parent line hasn't
									// been loaded yet

		var flatten = parentLine.flatten;

		var entries = [];
		var length = parentEntries.length;

		if (length == 0) {
			this.entries = entries;
			return;
		}

		var freqWidth = parentLine.freqDataWidth;
		var width = (Math.ceil(freqWidth) / 4.0) * 24 * 60 * 1000 * 1000;
		var halfwidth = width/2;
		var sum = 0;
		var leadingEdge = 0;
		var trailingEdge = -1;

		while (trailingEdge < length) {
			var tl = leadingEdge < length ? (parentEntries[leadingEdge][0].getTime() - halfwidth) : -1;
			var vl = leadingEdge < length ? (flatten ? (parentEntries[leadingEdge][1] > 0 ? 1 : 0) : parentEntries[leadingEdge][1]) : 0;

			if (trailingEdge < 0) {
				sum += vl;
				++trailingEdge;
				entries.push([new Date(tl), sum]);
				continue;
			} else {
				var tt = parentEntries[trailingEdge][0].getTime() + halfwidth;
				var vt = flatten ? (parentEntries[trailingEdge][1] > 0 ? 1 : 0) : parentEntries[trailingEdge][1];
				if (tl > 0 && tl < tt) {
					sum += vl;
					++leadingEdge;
					entries.push([new Date(tl), sum]);
					continue;
				} else if (tl == tt) {
					sum += vl - vt;
					++leadingEdge;
					++trailingEdge;
					entries.push([new Date(tl), sum]);
					continue;
				} else {
					sum -= vt;
					++trailingEdge;
					entries.push([new Date(tt), sum]);
				}
			}
		}

		this.entries = entries;
	}
	this.generateSmoothLine = function(smoothValue) {
		this.plot.addSmoothLine(this, smoothValue);
	}
	this.generateFreqLine = function(freqValue) {
		this.plot.addFreqLine(this, freqValue);
	}
	this.activate = function() {
		this.showYAxis = true;
		//this.activated = true;
		if (this.parentLine) {
			this.parentLine.hidden = false;
			this.parentLine.activated = true;
			this.parentLine.prepEntries();
		}
		this.plot.store();
		this.plot.refreshPlot();
	}
	this.deactivate = function() {
		this.showYAxis = false;
		//this.activated = false;
		if (this.parentLine) {
			this.parentLine.hidden = true;
			this.parentLine.activated = false;
		}
		this.plot.store();
		this.plot.refreshPlot();
	}
	this.isHidden = function() {
		if (this.smoothLine && this.smoothDataWidth > 0) {
			return this.smoothLine.hidden;
		} else if (this.freqLine && this.freqDataWidth > 0) {
			return this.freqLine.hidden;
		} else
			return this.hidden;
	}
	this.setHidden = function(hidden) {
		if (this.smoothLine && this.smoothDataWidth > 0) {
			this.smoothLine.hidden = hidden;
		} else if (this.freqLine && this.freqDataWidth > 0) {
			this.freqLine.hidden = hidden;
		} else
			this.hidden = hidden;
	}
	this.setSmoothDataWidth = function(value) {
		if (value != this.smoothDataWidth) {
			var oldSmoothValue = this.smoothDataWidth;
			this.smoothDataWidth = value;
			if (value > 0) {
				// create smooth line
				// hide current line, show smooth line
				if (!this.activated)
					this.hidden = true;
				else if (oldSmoothValue) {
					this.prepEntries();
				}
				if ((!this.smoothLine) || this.smoothLine == 1) {
					this.generateSmoothLine(value);
				} else {
					this.smoothLine.hidden = false;
					this.smoothLine.calculateSmoothEntries();
					this.smoothLine.prepEntries();
					this.plot.store();
				}
			} else {
				this.hidden = false;
				if (this.smoothLine) {
					this.smoothLine.hidden = true;
				}
				this.prepEntries();
				this.plot.store();
			}
			this.plot.refreshPlot();
		}
	}
	this.setFreqDataWidth = function(value) {
		if (value != this.freqDataWidth) {
			var oldFreqValue = this.freqDataWidth;
			this.freqDataWidth = value;
			if (value > 0) {
				// create freq line
				// hide current line, show freq line
				if ((!this.freqLine) || (this.freqLine == 1)) {
					this.generateFreqLine(value);
					this.prepEntries();
				} else {
					this.freqLine.hidden = false;
					this.freqLine.calculateFreqEntries();
					this.freqLine.prepEntries();
					this.prepEntries();
					this.plot.store();
				}
			} else {
				this.hidden = false;
				if (this.freqLine) {
					this.freqLine.hidden = true;
				}
				this.prepEntries();
				this.plot.store();
			}
			this.plot.refreshPlot();
		}
	}
	this.parseEntries = function() {
		var entries = this.entries;
		// parse times if needed
		for (var i = 0; i < entries.length; ++i) {
			if (typeof(entries[i][0]) == 'string') {
				entries[i][0] = parseISO8601(entries[i][0]);
			}
		}
	}
	this.loadEntries = function(plotDesc) {
		this.entries = plotDesc.entries;
		this.minSeriesVal = plotDesc.min;
		this.maxSeriesVal = plotDesc.max;
		this.unitGroupId = plotDesc.unitGroupId;
		this.valueScale = plotDesc.valueScale;
		this.parseEntries();
		this.prepEntries();
	}
	this.makePlotData = function(name, data) {
		if (this.intervals || (!this.fill)) {
			return {
				popuplabel: name,
				data: data,
				color: ((this.smoothLine && this.smoothDataWidth > 0) || (this.freqLine && this.freqDataWidth > 0)) ? colorToFillColor(this.color,"0.25") : this.color,
				lines: {
					show: this.showLines
				},
				points: {
					show: this.isSmoothLine() ? false : true
				},
				yaxis: this.yaxis,
				plotLine: this
			};
		} else {
			return {
				popuplabel: name,
				data: data,
				color: ((this.smoothLine && this.smoothDataWidth > 0) || (this.freqLine && this.freqDataWidth > 0)) ? colorToFillColor(this.color,"0.25") : this.color,
				lines: {
					show: this.showLines,
					fill: true,
					fillColor: this.plot.cycleTagLine ? this.cycleFillColor : this.fillColor
				},
				points: {
					show: this.isSmoothLine() ? false : true
				},
				yaxis: this.yaxis,
				plotLine: this
			};
		}
	}
	this.prepEntries = function() {
		var d1Data = [];

		var entries = this.entries;

		var plotLine = this;

		var oldAllUnity = this.allUnity;
		this.allUnity = true;

		var minTime = undefined;
		var maxTime = undefined;

		var minVal = undefined;
		var maxVal = undefined;

		var reZero = (this.isFreqLineFlag || this.isContinuous) ? false : (this.isSmoothLine() ? !this.parentLine.isContinuous : !this.isContinuous);

		var lastTime = 0;
		var lastVal = undefined;

		for (var i = 0; i < entries.length; ++i) {
			var entry = entries[i];
			if (entry[1] != 1.0)
				plotLine.allUnity = false;
			var time = entry[0].getTime();
			// if space between two data points >= 2 days
			if (reZero && (time - lastTime >= 1000*60*60*24*2)) {
				if (lastTime && lastVal != 0) {
					// create additional null point at 12 hours after last data
					// point if it wasn't already zero
					d1Data.push([new Date(lastTime + 1000*60*60*12), null]);
				}
				/*if (entry[1] != 0) {
				 // 12 hours before first data point if it isn't zero
				 d1Data.push([new Date(time - 1000*60*60*12), 0]);
				 if (minTime == undefined) minTime = time - 1000*60*60*12;
				 }*/
			}
			if (minTime == undefined || time < minTime) minTime = time;
			if (maxTime == undefined || time > maxTime) maxTime = time;
			if (minVal == undefined || entry[1] < minVal) minVal = entry[1];
			if (maxVal == undefined || entry[1] > maxVal) maxVal = entry[1];
			d1Data.push([entry[0], plotLine.flatten ? (entry[1] > 0.0 ? 1.0 : (entry[1] < 0 ? -1.0 : 0)) : entry[1], {t:entry[2] ? entry[2] : this.name}]);
			if (plotLine.name == null)
				plotLine.name = entry['description'];

			lastTime = time;
			lastVal = entry[1];
		}
		if (reZero && lastTime && lastVal != 0) {
			// create additional null point at 12 hours after last data point
			var currentTime = new Date(lastTime);
			var dateRangeForToday = new DateUtil().getDateRangeForToday(); // See base.js
			// Checking if last data point is not within a day of "now"
			if(!(currentTime >= dateRangeForToday.start && currentTime <= dateRangeForToday.end)) {
				d1Data.push([new Date(lastTime + 1000*60*60*12), null]);
			}
			minTime = minTime - 1000*60*60*12;
			maxTime = lastTime + 1000*60*60*12;
		} else {
			if (minTime == maxTime) {
				minTime = minTime - 1000*60*60;
				maxTime = lastTime + 1000*60*60;
			}
		}

		this.minTime = minTime;
		this.maxTime = maxTime;
		this.minVal = minVal;
		this.maxVal = maxVal;

		if (this.allUnity) {
			if (!oldAllUnity) {
				this.yOffset = this.plot.leastUsedOffset();
			}
		}

		this.plotData = this.makePlotData(this.name, d1Data);

		if (this.isCycle) {
			// initialize range slider values
			this.setRange(0, this.minRange);
			this.setRange(1, this.maxRange);
		}

		this.minTotal = this.minSeriesVal < this.minVal ? this.minSeriesVal : this.minVal;
		this.maxTotal = this.maxSeriesVal < this.maxVal ? this.maxSeriesVal : this.maxVal;
		if (this.minTotal == undefined) this.minTotal = this.minVal;
		if (this.maxTotal == undefined) this.maxTotal = this.maxVal;
	}
	this.getCyclicData = function(cyclicPlotLine) {
		var multiCyclicData = [];

		var cyclicData = cyclicPlotLine.plotData.data;

		var minRange = cyclicPlotLine.getMinRange();
		var maxRange = cyclicPlotLine.getMaxRange();

		var plotLine = this;

		if (this.hidden) return [];

		var numCycles = 0;

		var first = true;

		for (var i in cyclicData) {
			var cyclePoint = cyclicData[i];
			// skip cycle points out of range
			if (cyclePoint[1] < minRange || cyclePoint[1] > maxRange) continue;
			var data = this.plotData.data;
			var newData = [];

			for (var j in data) {
				var point = data[j];
				var days = (point[0].getTime() - cyclePoint[0].getTime()) / 86400000;
				if (days < -80 || days > 80) continue;
				newData.push([days, point[1]]);
			}

			multiCyclicData.push(this.makePlotData(first ? this.name : null, newData));

			first = false;

			if (++numCycles > 100)
				break;
		}

		return multiCyclicData;
	}
	if (this.appendHTML) {
		this.appendHTML();
	}
	//Displaying Tags in a TagGroup or Snapshot
	if (this.tag && this.tag instanceof TagGroup) {
		this.refreshTagList();
	}

	$(document).trigger('postLineDetails', this);

	if ((!this.isSmoothLine()) && (!this.isFreqLine()) && (!this.getTags()))
		this.addTagName(p.name);
	if (this.entries)
		this.parseEntries();
}