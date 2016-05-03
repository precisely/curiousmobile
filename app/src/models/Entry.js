define(['require', 'exports', 'module', 'exoskeleton', 'util/Utils', 'main'],
	function(require, exports, module, exoskeleton, u, main) {
		'use strict';

		var User = require('models/User');
		// Singleton Class function.
		var RepeatType = new function() {
			this.DAILY_BIT = 1;
			this.WEEKLY_BIT = 2;
			this.REMIND_BIT = 4;
			this.HOURLY_BIT = 8;
			this.MONTHLY_BIT = 0x0010;
			this.YEARLY_BIT = 0x0020;
			this.CONTINUOUS_BIT = 0x100;
			this.GHOST_BIT = 0x200;
			this.CONCRETEGHOST_BIT = 0x400;
			this.DURATION_BIT = 0x0800;
			this.REPEAT_BIT = this.DAILY_BIT | this.WEEKLY_BIT | this.HOURLY_BIT | this.MONTHLY_BIT | this.YEARLY_BIT;
			this.DAILYGHOST = this.DAILY_BIT | this.GHOST_BIT;
			this.WEEKLYGHOST = this.WEEKLY_BIT | this.GHOST_BIT;
			this.REMINDDAILY = this.REMIND_BIT | this.DAILY_BIT;
			this.REMINDWEEKLY = this.REMIND_BIT | this.WEEKLY_BIT;
			this.REMINDDAILYGHOST = this.REMIND_BIT | this.DAILY_BIT | this.GHOST_BIT;
			this.REMINDWEEKLYGHOST = this.REMIND_BIT | this.WEEKLY_BIT | this.GHOST_BIT;
			this.CONTINUOUSGHOST = this.CONTINUOUS_BIT|  this.GHOST_BIT;
			this.DAILYCONCRETEGHOST = this.CONCRETEGHOST_BIT | this.DAILY_BIT;
			this.DAILYCONCRETEGHOSTGHOST = this.CONCRETEGHOST_BIT | this.GHOST_BIT | this.DAILY_BIT;
			this.WEEKLYCONCRETEGHOST = this.CONCRETEGHOST_BIT | this.WEEKLY_BIT;
			this.MONTHLYCONCRETEGHOST = this.CONCRETEGHOST_BIT | this.WEEKLY_BIT;
			this.WEEKLYCONCRETEGHOSTGHOST = this.CONCRETEGHOST_BIT | this.GHOST_BIT | this.WEEKLY_BIT;
			this.DURATIONGHOST = this.GHOST_BIT | this.DURATION_BIT;
		};

		var Entry = Backbone.Model.extend({
			'userId': 0,
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
			isAnyGhost: function() {
				return (this.get('repeatType') & (RepeatType.GHOST_BIT | RepeatType.CONCRETEGHOST_BIT)) != 0
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
			isHourly: function() {
				return (this.get('repeatType') & RepeatType.HOURLY_BIT) != 0
			},
			isDaily: function() {
				return (this.get('repeatType') & RepeatType.DAILY_BIT) != 0
			},
			isHourlyOrDaily: function() {
				return (this.get('repeatType') & (RepeatType.HOURLY_BIT | RepeatType.DAILY_BIT)) != 0
			},
			isWeekly: function() {
				return (this.get('repeatType') & RepeatType.WEEKLY_BIT) != 0
			},
			isMonthly: function() {
				return (this.get('repeatType') & RepeatType.MONTHLY_BIT) != 0
			},
			isYearly: function() {
				return (this.get('repeatType') & RepeatType.YEARLY_BIT) != 0
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
				if (this.isRemind(repeatType)) {
					classes.push('remind');
					return classes;
				}
				if (this.isRepeat(repeatType) || this.isDaily() || this.isWeekly() || this.isMonthly()) {
					classes.push('repeat');
				}
				return classes;
			},
			getSelectionRange: function(argument) {
				var formattedAmount = this.formattedAmount();

				if (!this.get('description')) {
					return [0, 0];
				}
				// store first amount for post-selection highlighting
				this.selectStart = this.get('description').length + 1 + (formattedAmount.length == 0 ? 1 : 0);
				this.selectEnd = this.selectStart + formattedAmount.length - 1;
				return [this.selectStart, this.selectEnd, this.get('amountPrecision') < 0 && this.get('amount') != null];
				// if third item is true, insert extra space at cursor
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
				var entryStr = escapeHTML(entry.description);
				var amounts = entry.amounts;
				var i = 0, iString;
				if (this.isContinuous()) {
					if (this.get('amountPrecision') > 0) {
						entryStr += ' ' + this.get('amount') + ' ' + escapehtml(this.get('units'));
					} else if (this.get('amount') == null) {
						entryStr += ' # ' + escapehtml(this.get('units'));
					}
				} else {
					while ((iString = (i++).toString()) in amounts) {
						var amountEntry = amounts[iString];
						var amount = amountEntry.amount;
						var amountPrecision = amountEntry.amountPrecision;
						var units = amountEntry.units;

						var formattedAmount = this.formattedAmount({amount: amount, amountPrecision: amountPrecision});
						entryStr += escapeHTML(formattedAmount) + escapeHTML(this.formatUnits(units))
					}
				}

				entryStr += escapeHTML(this.dateStr()) + (entry.comment != '' ? ' ' + escapeHTML(entry.comment) : '')
				return entryStr;
			},
			formattedAmount: function(args) {
				var entry;
				if (args) {
					entry = args;
				} else {
					entry = this.attributes;
				}
				if (entry.amount == null) return " #";
				if (entry.amountPrecision < 0) return "";
				if (entry.amountPrecision == 0) {
					return entry.amount ? " yes" : " no";
				}
				return " " + entry.amount;
			},
			formatUnits: function(units) {
				if (!units) {
					units = this.get('units');
				}
				if (units && units.length > 0)
					return " " + units;

				return "";
			},
			dateStr: function () {
				var dateStr = '';
				if (this.get('datePrecisionSecs') < 43200) {
					dateStr = u.dateToTimeStr(new Date(this.get('date')), false);
					dateStr = ' ' + dateStr;
				}
				return dateStr;
			},
			removeSuffix: function() {
				var text = this.toString();
				if (text.endsWith(' repeat') || text.endsWith(' pinned') || text.endsWith(' remind')
					|| text.endsWith(' button')) {
						text = text.substr(0, text.length - 7);
					} else if (text.endsWith(' bookmark')) {
						text = text.substr(0, text.length - 9);
					}

					if (text.endsWith(' favorite')) {
						text = text.substr(0, text.length - 8);
					}

					if (text.startsWith('repeat') || text.startsWith('pinned') || text.startsWith('remind')
						|| text.startsWith('button')) {
							text = text.substr(6, text.length);
					} else if (text.startsWith('bookmark')) {
						text = text.substr(8, text.length);
					}

					if (text.startsWith('favorite')) {
						text = text.substr(7, text.length);
					}
					return text;
			},

			saveHelpEntry: function(callback) {
				var now = new Date();
				var collectionCache = window.App.collectionCache;
				var baseDate = window.App.selectedDate || new Date(now.setHours(0, 0, 0, 0));
				var argsToSend = u.getCSRFPreventionObject("addEntryCSRF", {
					currentTime: new Date().toUTCString(),
					userId: this.userId || User.getCurrentUserId(),
					entryId: this.get('id'),
					text: this.text,
					baseDate: baseDate.toUTCString(),
					timeZoneName: u.getTimezone(),
					defaultToNow: '1'
				});

				u.queueJSON("Adding entry", u.makeGetUrl("createSingleHelpEntrysData"), u.makeGetArgs(argsToSend),
						function(entries) {
							if (u.checkData(entries)) {
								if (!entries[0]) {
									u.showAlert("You must enter a time duration, like 'sleep 8 hours 10 mins'");
									return;
								}
								Entry.cacheEntries(baseDate, entries[0]);
								callback({
									entries: entries[0],
									glowEntry: entries[3],
									key: Entry.getCacheKey(baseDate)
								});
							} else {
								u.showAlert("Error adding entry");
							}
						}, function (data) {
							console.log('Entry creation failed: ' + this.toString());
						}.bind(this), 0, false, true);
			},

			create: function(callback) {
				var now = new Date();
				var collectionCache = window.App.collectionCache;
				var baseDate = window.App.selectedDate || new Date(now.setHours(0, 0, 0, 0));
				var argsToSend = u.getCSRFPreventionObject("addEntryCSRF", {
					currentTime: new Date().toUTCString(),
					userId: this.userId || User.getCurrentUserId(),
					text: this.text,
					baseDate: baseDate.toUTCString(),
					timeZoneName: u.getTimezone(),
					defaultToNow: '1'
				});
				if (this.get("repeatType")) {
					argsToSend.repeatTypeId = this.get("repeatType");
				}
				if (this.get("repeatEnd")) {
					argsToSend.repeatEnd = this.get("repeatEnd");
				}

				argsToSend.text = argsToSend.text.replace('Repeat', 'repeat');
				argsToSend.text = argsToSend.text.replace('Remind', 'remind');
				argsToSend.text = argsToSend.text.replace('Button', 'button');

				u.backgroundJSON("adding new entry", u.makeGetUrl("addEntrySData"), u.makeGetArgs(argsToSend), function(
				entries) {
					if (u.checkData(entries)) {
						if (entries[1] != null) {
							u.showAlert(entries[1]);
						}
						Entry.cacheEntries(baseDate, entries[0]);
						callback({
							entries: entries[0],
							glowEntry: new Entry(entries[3]),
							tagStats: entries[2],
							showEntryBalloon: entries[5],
							showBookmarkBalloon: entries[6],
							key: Entry.getCacheKey(baseDate)
						});
						//if (entries[2] != null)
							//updateAutocomplete(entries[2][0], entries[2][1], entries[2][2],
				//entries[2][3]);
					} else {
						u.showAlert("Error adding entry");
					}
				}, function (data) {
					console.log('Entry creation failed: ' + this.toString());
				}.bind(this), 0, false, false);

			},

			save: function(allFuture, callback) {
				var collectionCache = window.App.collectionCache;
				var now = new Date();
				var baseDate = window.App.selectedDate || new Date(now.setHours(0, 0, 0, 0));
				var argsToSend = u.getCSRFPreventionObject("updateEntrySDataCSRF", {
					entryId: this.get('id'),
					currentTime: new Date().toUTCString(),
					text: this.text,
					baseDate: baseDate.toUTCString(),
					timeZoneName: u.getTimezone(),
					defaultToNow: 1, //TODO Is this going to be configurable
					allFuture: allFuture ? '1' : '0',
					bookmarkEdit: this.state === 'bookmarkEdit' ? true : false
				});

				if (this.get("repeatType")) {
					argsToSend.repeatTypeId = this.get('repeatType');
				}
				if (this.get("repeatEnd")) {
					argsToSend.repeatEnd = this.get('repeatEnd') ? new Date(this.get('repeatEnd')).toUTCString() : null;
				}

				u.backgroundJSON("saving entry", u.makeGetUrl("updateEntrySData"), u.makeGetArgs(argsToSend),
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
							glowEntry: this,
							tagStats: [entries[1], entries[2]]
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
				}.bind(this), function (data) {
					//callback({fail: true});
					console.log('Entry update failed for entry: ' + this.toString());
				}.bind(this), 0, false, false);

			},
			delete: function(callback) {
				var collectionCache = window.App.collectionCache;
				if (this.isGhost() && !this.get('sprintEntry')) {
					if (this.isContinuous() || this.isTodayOrLater()) {
						this.deleteGhost(true, callback);
					} else {
						u.showAlert({
							type: 'alert',
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

						u.backgroundJSON("deleting entry", u.makeGetUrl("deleteEntrySData"), u.makeGetArgs(argsToSend),
						function(entries) {
							if (u.checkData(entries)) {
								var collectionCache = window.App.collectionCache;
								collectionCache.clear();
								Entry.cacheEntries(baseDate, entries[0]);
								callback(entries[0]);
							} else {
								u.showAlert("Error deleting entry");
							}
						},
						function (data) {
							callback({fail:true});
						}, 0, false, false
						);

				}

			},
			deleteGhost: function(allFuture, callback) {
				var collectionCache = window.App.collectionCache;
				var selectedDate = window.App.selectedDate;
				var baseDate = window.App.selectedDate.toUTCString();
				u.backgroundJSON("deleting entry", u.makeGetUrl("deleteGhostEntryData"),
				u.makeGetArgs(u.getCSRFPreventionObject(
					"deleteGhostEntryDataCSRF", {
						entryId: this.id,
						all: allFuture,
						baseDate: baseDate,
						timeZoneName: u.getTimezone(),
						date: selectedDate.toUTCString(),
						displayDate: baseDate
					})),
					function(entries) {
						if (u.checkData(entries)) {
							var collectionCache = window.App.collectionCache;
							collectionCache.clear();
							Entry.cacheEntries(baseDate, entries[0]);
							callback(entries[0]);
							return;
						} else {
							u.showAlert("Error deleting entry");
						}
					}.bind(this), function (data) {
						callback({fail: true});
					}, 0, false, false);

			},
			setText: function(text) {
				this.oldText = this.text;
				this.text = text;
			},
			isTodayOrLater: function() {
				return new Date().getTime() - (24 * 60 * 60000) < window.App.selectedDate.getTime();

			}

		});

		Entry.RepeatType = RepeatType;

		Entry.getCacheKey = function _getCacheKey(date) {
			var dateStr;
			if (typeof date == 'object') {
				var month = ("0" + (date.getMonth() + 1)).slice(-2);
				var day = ("0" + date.getDate()).slice(-2);
				dateStr = month + '/' + day + '/' + (date.getYear() + 1900);
			} else if (typeof date == 'string' && date.indexOf('/') < 0) {
				dateStr = Entry.getCacheKey(new Date(date));
			} else {
				dateStr = date;
			}
			return dateStr;
		}

		Entry.cacheEntries = function cacheEntries(date, entries) {
			var collectionCache = window.App.collectionCache;
			var key;
			key = Entry.getCacheKey(date);
			collectionCache.setItem(key, entries);
		}

		Entry.getRepeatParams = function getRepeatParams(isRepeat, isRemind, repeatEnd) {
			var repeatTypeId = getRepeatTypeId(isRepeat, isRemind, repeatEnd);
			if (repeatEnd) {
				repeatEnd = repeatEnd.setHours(23, 59, 59, 0);
				var now = new Date();
				if(new Date(repeatEnd) < now) {
					now.setHours(23,59,59,0);
					repeatEnd = now;
				}
				repeatEnd = new Date(repeatEnd).toUTCString();
			}
			return {repeatTypeId: repeatTypeId, repeatEnd: repeatEnd};
		}

		function getRepeatTypeId(isRepeat, isRemind, repeatEnd) {
			var confirmRepeat = document.getElementById('confirm-each-repeat') ? document.getElementById('confirm-each-repeat').checked : false;
			var frequencyBit, repeatTypeBit;

			if (document.getElementById('daily') && document.getElementById('daily').checked) {
				frequencyBit = RepeatType.DAILY_BIT;
			} else if (document.getElementById('weekly') && document.getElementById('weekly').checked) {
				frequencyBit = RepeatType.WEEKLY_BIT;
			} else if (document.getElementById('monthly') && document.getElementById('monthly').checked) {
				frequencyBit = RepeatType.MONTHLY_BIT;
			}

			if (!isRepeat && (frequencyBit || confirmRepeat)) {
				isRepeat = true;
			}
			if (isRepeat) {
				if (frequencyBit) {
					repeatTypeBit = (RepeatType.CONCRETEGHOST_BIT | frequencyBit);
				} else {
					repeatTypeBit = (RepeatType.DAILYCONCRETEGHOST);
				}
			}
			if (isRemind) {
				if (repeatTypeBit) {
					repeatTypeBit = (RepeatType.REMIND_BIT | repeatTypeBit);
				} else {
					repeatTypeBit = RepeatType.REMIND_BIT;
				}
			}

			if (confirmRepeat) {
				return (repeatTypeBit | RepeatType.GHOST_BIT);
			}
			return (repeatTypeBit);
		}

		module.exports = Entry;
	});
