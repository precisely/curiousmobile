//assumes propertyClosure has the following methods:
//get/set: name, startDate. endDate, centered
function PlotProperties(divIdArray) {
	if (divIdArray['username'] != null)
		this.usernameField = $(divIdArray['username']);
	else
		this.usernameField = null;
	this.nameField = '';
	this.renameField = $(divIdArray['rename']);

	this.getName = function() {
		if (this.nameField) {
			return this.nameField;
		}
		return '';
	}
	this.setName = function(name) {
		this.nameField = name;
	}
	this.setUsername = function(name) {
		if (this.usernameField)
			this.usernameField.text(name);
	}
	this.getStartDate = function() {
		if (this.startDate) {
			return this.startDate;
		}
		return null;
	}
	this.getStartTime = function() {
		if (!this.startDate) return 0;
		return this.startDate.getTime();
	}
	this.setStartDate = function(date) {
		this.startDate = date;
	};
	this.getEndDate = function() {
		if (this.endDate) {
			return this.endDate;
		}
		return null;
	};
	this.getEndTime = function() {
		if (!this.endDate) return 0;
		return this.endDate.getTime();
	};
	this.setEndDate = function(date) {
		this.endDate = date;
	};
	this.getZoomControl = function() {
		return this.zoomControl;
	}
	this.getStartDatePicker = function() {
		return this.startDatePicker;
	}
	this.getEndDatePicker = function() {
		return this.endDatePicker;
	}
	this.getUsernameField = function() {
		return this.usernameField;
	}
	this.getNameField = function() {
		return this.nameField;
	}
	this.getRenameField = function() {
		return this.renameField;
	}
	this.getCycleTagDiv = function() {
		return this.cycleTagDiv;
	}
	// show data for a given userId at a given timestamp
	this.showDataUrl = function(userId, userName, timestamp) {
		if (User.getCurrentUserId() != userId) return;
		if (User.getCurrentUser().get('username') != userName) return;
		if (User.getCurrentUserId() < 0) return; // disallow showData for anonymous users
		//return "/home/index?showTime=" + timestamp;
	}
	// show data for a given userId at a given timestamp
	this.showData = function(userId, userName, timestamp) {
		window.location = this.showDataUrl(userId, userName, timestamp);
	}
}