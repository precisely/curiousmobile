define(['require', 'exports', 'module', 'exoskeleton', 'util/Utils', 'main'],
	function(require, exports, module, exoskeleton, u, main) {
		'use strict';

		var User = require('models/User');
		// Singleton Class function.
		var RepeatType = {
			CONTINUOUS_BIT: 0x100,
			GHOST_BIT: 0x200,
			CONCRETEGHOST_BIT: 0x400,
			TIMED_BIT: 0x1 | 0x2 | 0x4,
			REPEAT_BIT: 0x1 | 0x2,
			REMIND_BIT: 0x4,

		};

		var Entry = Backbone.Model.extend({
			'userId': -1,
			'date': '2014-08-03T11:58:28.000Z',
			'datePrecisionSecs': 86400,
			'description': '',
			'amount': null,
			'amountPrecision': 3,
			'units': '',
			'comment': '',

			isConcreteGhost: function() {
				return (this.get('repeatType') & RepeatType.CONCRETEGHOST_BIT) != 0;
			},
			isContinuous: function() {
				return (this.get('repeatType') & RepeatType.CONTINUOUS_BIT) != 0;
			},
			isGhost: function() {
				return (this.get('repeatType') & RepeatType.GHOST_BIT) != 0;
			},
			isRemind: function() {
				return (this.get('repeatType') & RepeatType.REMIND_BIT) != 0;
			},
			isRepeat: function() {
				return (this.get('repeatType') & RepeatType.REPEAT_BIT) != 0;
			},
			isTimed: function() {
				return (this.get('repeatType') & RepeatType.TIMED_BIT) != 0;
			},
			repeatTypeAsClass: function() {
				var repeatType = this.get('repeatType');
				var classes = ['entry'];
				if (this.isGhost(repeatType)) {
					classes.push('ghost');
					classes.push('anyghost');
				}
				if (this.isConcreteGhost(repeatType)) {
					classes.push('concreteghost');
					classes.push('anyghost');
				}
				if (this.isContinuous(repeatType)) {
					classes.push('continuous');
				}
				if (this.isTimed(repeatType)) {
					classes.push('timedrepeat');
				}
				if (this.isRepeat(repeatType)) {
					classes.push('repeat');
				}
				if (this.isRemind(repeatType)) {
					classes.push('remind');
				}
				return classes;
			},
			getSelectionRange: function(argument) {
				var formattedAmount = this.formattedAmount();
				if (!this.get('description')) {
					return [0, 0];
				}
				var selectStart = this.get('description').length + 1 + (formattedAmount.length == 0 ? 1 : 0);
				var selectEnd = selectStart + formattedAmount.length - 1;
				return [selectStart, selectEnd]; // if third item is true, insert extra space at cursor
			},
			needExtraSpace: function() {
				return this.get('amountPrecision') < 0;
			},
			toString: function(argument) {
				var entry = this.attributes;
				var escapeHTML = u.escapeHTML;
				var dateStr = '';
				if (!this.get('id')) {
					return '';
				}
				if (this.get('datePrecisionSecs') < 43200) {
					dateStr = u.dateToTimeStr(new Date(entry.date), false);
					dateStr = ' ' + dateStr;
				}
				var entryStr = escapeHTML(entry.description) + escapeHTML(this.formattedAmount()) + escapeHTML(this.formatUnits()) + escapeHTML(dateStr) + (entry.comment != '' ? ' ' + escapeHTML(entry.comment) : '')
				return entryStr;
			},
			formattedAmount: function(argument) {
				var entry = this.attributes;
				if (entry.amount == null) return " ___";
				if (entry.amountPrecision < 0) return "";
				if (entry.amountPrecision == 0) {
					return entry.amount ? " yes" : " no";
				}
				return " " + entry.amount;
			},
			formatUnits: function() {
				var units = this.get('units');
				if (units && units.length > 0)
					return " " + units;

				return "";
			},
			removeSuffix: function() {
				var text = this.toString();
				if (text.endsWith(' repeat') || text.endsWith(' pinned')
					|| text.endsWith(' button')) {
						text = text.substr(0, text.length - 7);
					}
					if (text.endsWith(' favorite')) {
						text = text.substr(0, text.length - 8);
					}
					return text;
			},
			create: function(callback) {
				var collectionCache = window.App.collectionCache;
				var baseDate = window.App.selectedDate;
				var argsToSend = u.getCSRFPreventionObject("addEntryCSRF", {
					currentTime: new Date().toUTCString(),
					userId: User.getCurrentUserId(),
					text: this.text,
					baseDate: baseDate.toUTCString(),
					timeZoneName: u.getTimezone(),
					defaultToNow: '1'
				})

				u.queueJSON("adding new entry", u.makeGetUrl("addEntrySData"), u.makeGetArgs(argsToSend), function(
				entries) {
					if (u.checkData(entries)) {
						if (entries[1] != null) {
							u.showAlert(entries[1]);
						}
						Entry.cacheEntries(baseDate, entries[0]);
						callback({
							entries: entries[0],
							glowEntry: entries[3],
							key: Entry.getCacheKey(baseDate)
						});
						//if (entries[2] != null)
							//updateAutocomplete(entries[2][0], entries[2][1], entries[2][2],
				//entries[2][3]);
					} else {
						u.showAlert("Error adding entry");
					}
				});

			},
			save: function(allFuture, callback) {
				var collectionCache = window.App.collectionCache;
				var baseDate = window.App.selectedDate;
				var argsToSend = u.getCSRFPreventionObject("updateEntrySDataCSRF", {
					entryId: this.get('id'),
					currentTime: new Date().toUTCString(),
					text: this.text,
					baseDate: baseDate.toUTCString(),
					timeZoneName: u.getTimezone(),
					defaultToNow: 1, //TODO Is this going to be configurable
					allFuture: allFuture ? '1' : '0'
				});

				u.queueJSON("saving entry", u.makeGetUrl("updateEntrySData"), u.makeGetArgs(argsToSend),
				function(entries) {
					if (entries == "") {
						return;
					}
					// Temporary fix since checkData fails
					if (typeof entries[0] != 'undefined' && entries[0].length > 0) {
						_.each(entries[0], function(entry) {
							// Finding entry which is recently updated.
							if (entry.id == this.id) {
								this.set(entry);
							}
						}.bind(this));
						Entry.cacheEntries(baseDate, entries[0]);
						callback({
							entries: entries[0],
							glowEntry: this
						});
						//if (entries[1] != null)
							//updateAutocomplete(entries[1][0], entries[1][1],
				//entries[1][2], entries[1][3]);
				//if (entries[2] != null)
					//updateAutocomplete(entries[2][0], entries[2][1],
				//entries[2][2], entries[2][3]);
					} else {
						u.showAlert("Error updating entry");
					}
				}.bind(this));

			},
			delete: function(callback) {
				var collectionCache = window.App.collectionCache;
				if (this.isTimed() || this.isGhost()) {
					if (this.isContinuous() || this.isTodayOrLater()) {
						this.deleteGhost(true, callback);
					} else {
						u.showAlert({
							message: 'Delete just this one event or also future events?',
							verify: false,
							a: 'One',
							b: 'Future',
							onA: function() {
								this.deleteGhost(false, callback);
							}.bind(this),
							onB: function() {
								this.deleteGhost(true, callback);
							}.bind(this),
						});
					}
				} else {
					var baseDate = window.App.selectedDate.toUTCString();
					var argsToSend = u.getCSRFPreventionObject(
						"deleteEntryDataCSRF", {
							entryId: this.id,
							currentTime: new Date().toUTCString(),
							baseDate: baseDate,
							timeZoneName: u.getTimezone(),
							displayDate: baseDate
						});

						u.queueJSON("deleting entry", u.makeGetUrl("deleteEntrySData"), u.makeGetArgs(argsToSend),
						function(entries) {
							if (u.checkData(entries)) {
								Entry.cacheEntries(baseDate, entries[0]);
								callback(entries[0]);
								//if (entries[1] != null)
									//updateAutocomplete(entries[1][0], entries[1][1],
						//entries[1][2], entries[1][3]);
						//if (entries[2] != null)
							//updateAutocomplete(entries[2][0],
								//entries[2][1], entries[2][2],
						//entries[2][3]);
							} else {
								u.showAlert("Error deleting entry");
							}
						});

				}

			},
			deleteGhost: function(allFuture, callback) {
				var collectionCache = window.App.collectionCache;
				var selectedDate = window.App.selectedDate;
				u.queueJSON("deleting entry", u.makeGetUrl("deleteGhostEntryData"),
				u.makeGetArgs(u.getCSRFPreventionObject(
					"deleteGhostEntryDataCSRF", {
						entryId: this.id,
						all: allFuture,
						date: selectedDate.toUTCString()
					})),
					function(ret) {
						console.log('deleteGhost: Response received' + u.checkData(ret, 'success', "Error deleting entry"));
						if (u.checkData(ret, 'success', "Error deleting entry")) {
							console.log('deleteGhost: Removing entry from cache as well');
							callback();
							return;
						}

					}.bind(this));

			},
			setText: function(text) {
				this.oldText = this.text;
				this.text = text;
			},
			isTodayOrLater: function() {
				return new Date() - (24 * 60 * 60000) < window.App.selectedDate.getTime();

			}

		});

		Entry.RepeatType = RepeatType;

		Entry.getCacheKey = function _getCacheKey(date) {
			var dateStr;
			if (typeof date == 'object') {
				var month = ("0" + (date.getMonth() + 1)).slice(-2);
				var day = ("0" + date.getDate()).slice(-2);
				dateStr = month + '/' + day + '/' + (date.getYear() + 1900);
			} else {
				dateStr = date;
			}
			return dateStr;
		}

		Entry.cacheEntries = function cacheEntries(date, entries) {
			var collectionCache = window.App.collectionCache;
			var key;
			if (date instanceof Date) {
				key = Entry.getCacheKey(date);
			} else {
				key = date;
			}
			collectionCache.setItem(key, entries);
		}

		module.exports = Entry;
	});
