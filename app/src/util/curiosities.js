// Global variable for "Curious."
C = {};

// correlationIndex is a master list of all correlations seen so far.
C.correlationIndex = {};

// Collect correlation ids for the page into an array.
C.pageIds = [];

// Each combination of search terms has a different page number.
C.curiositiesPageNumber = {};

// Collect number of search results for a given set of search parameters / filter / sortBy combinations
//	 so that we'll know ahead of time whether or not there will be any results.	If the last search had 0
//	 results then there will always be no more results since we're storing past results in C.correlationIndex.
C.curiositiesNumSearchResults = {};
if (!isMobile) {
	$(function() {
		initCuriosities();
	});
}

function initCuriosities() {

	var loadedPositive = false;
	var loadedNegative = false;
	var loadedTrigger  = false;
	C.curiositiesScrollReady = true;

	// Possible sort orders include:
	// 'natural', 'alpha asc', 'alpha desc', 'marked asc', 'marked desc',
	// 'score asc', score desc', 'type positive', 'type negative', 'type triggered'
	// We will store the last 5 sort orders.	If no orders are found in in
	// localStorage['curiositiesSortOrder'] or if localStorage is not available, then it
	// will be initialized to 'natural'.
	//
	var possibleSortOrders = ['natural', 'rated', 'all'];
	// A transition "matrix" for toggling sort orders.
	var LABELS = {positive: "proportional", negative: "inversely proportional", triggered: "triggered"};

	var log = function() {
		if (console) {
			return console.log.apply(console, arguments);
		}
	}

	var getDomIdFromOrder = function(order) {
		return _.first(order.split(" "));
	};

	var validateSortOrderValue = function(order) {
		var success = _.contains(possibleSortOrders, order);
		if (!success) {
			log('invalid sort order value:', order);
		}
		return success;
	};

	var initSortOrder = function() {
		try {
			C.curiositiesSortOrder = JSON.parse(localStorage['curiositiesSortOrder']);
			// Make sure every element is one of the possible values.
			if (! _.isArray(C.curiositiesSortOrder)) {
				log('C.curiositiesSortOrder is not an array.', C.curiositiesSortOrder);
			} else if ( ! _.every(C.curiositiesSortOrder, function(x) { return _.contains(possibleSortOrders, x)})) {
				log('C.curiositiesSortOrder contains an invalid value.');
				C.curiositiesSortOrder = ['natural'];
				saveSortOrder();
			}
		} catch(e) {
			C.curiositiesSortOrder = ['natural'];
			log('Could not load sort order from localStorage.', e.message);
		}
		updateUISortOrder();
		return C.curiositiesSortOrder;
	}

	var saveSortOrder = function() {
		var success = false;
		try {
			localStorage['curiositiesSortOrder'] = JSON.stringify(C.curiositiesSortOrder);
			success = true;
		} catch(e) {
			log('Could not save sort order.');
		}
		return success;
	};

	var appendSortOrder = function(order) {
		if (! validateSortOrderValue(order)) {
			return false;
		}
		C.curiositiesSortOrder.unshift(order);
		if (C.curiositiesSortOrder.length > 5) {
			C.curiositiesSortOrder = _.first(C.curiositiesSortOrder,	5);
		}
		saveSortOrder();
		return C.curiositiesSortOrder;
	};

	var replaceFirstSortOrder = function(order) {
		C.curiositiesSortOrder.shift();
		return appendSortOrder(order);
	};

	if (!isMobile) {
		// Only execute this code on the /home/curiosities page.
		if ($('body.curiosities').length < 1 ) { return undefined; }
	}

	var reRenderCorrelations = function(ids) {
		if (!isMobile) {
			$('.curiosities-row-container').remove();
		}
		_.forEach(ids, function(id, i) {
			// e stands for element, which is the raw data for a correlation row, stored in C.correlationIndex.
			var e = C.correlationIndex[id];
			setTimeout(function() {
				renderCorrelationRow(e.id, e.type, e.description1, e.description2, e.score, e.signalLevel, e.marked);
			}, 2*i);
		});
	};

	var getCorrelations = function(ids) {
		return _.map(ids, function(id) { return C.correlationIndex[id]; });
	};

	var mapToIds = function(objArr) {
		return _.map(objArr, function(o) { return o.id; });
	};

	// Use Lodash's stable sort.
	var naturalSort = function(ids) {
		var sortedItems = _.chain(getCorrelations(ids)).sortBy(function(e) {
			var number_score = e.score;
			var abs_score = Math.abs(number_score);
			return -abs_score;
		}).sortBy(function(e) {
			return e.signalLevel;
		}).value();
		return mapToIds(sortedItems);
	};

	var ratedSort = function(ids) {
		var sortedItems = _.chain(getCorrelations(ids)).sortBy(function(e) {
			var number_score = e.score;
			var abs_score = Math.abs(number_score);
			return -abs_score;
		}).sortBy(function(e) {
			return -e.signalLevel;
		}).value();
		return mapToIds(sortedItems);
	};

	var allSort = function(ids) {
		var sortedItems = _.chain(getCorrelations(ids)).sortBy(function(e) {
			var number_score = e.score;
			var abs_score = Math.abs(number_score);
			return -abs_score;
		}).value();
		return mapToIds(sortedItems);
	};

	// Note: all these functions (and naturalSort) require 1 argument: a list of correlation ids.
	var sortFunction = {
		'natural': naturalSort,
		'rated': ratedSort,
		'all': allSort,
	};

	var resort = function(ids, order) {
		if (undefined == sortFunction[order]) {
			log("ERROR: unhandled order", order, sortFunction);
		}
		return sortFunction[order].call(null, ids);
	};

	var resortAll = function(ids) {
		var sortedIds = ids;
		var reverseOrder = C.curiositiesSortOrder.slice();
		reverseOrder.reverse(); // reverse() mutates order of array.
		_.forEach(reverseOrder, function(order) {
			sortedIds = resort(sortedIds, order);
		});
		return sortedIds;
	}

	var viewGraph = function(correlation_id) {
		var c = C.correlationIndex[correlation_id];
		var new_uri = '/home/graph/curiosities/' + c.description1 + '/' + c.description2;
		window.location = new_uri;
	};

	// Load data.

	var correlation_template = $('#correlation-template').html();
	if(!isMobile) {
		Mustache.parse(correlation_template);
	}

	var in_english = {
		triggered: 'triggered by',
		positive: 'correlated with',
		negative: 'inversely related to'
	};

	var bubble = function(signalLevel, bubble_position) {
		if (bubble_position == signalLevel) {
			return "marked";
		} else {
			return "empty";
		}
	};

	var renderCorrelationRow = function(id, type, description1, description2, score, signalLevel, marked) {
		var display = 'block';

		var relationText;

		if (type == 'triggered') {
			relationText = 'Could ' + description1 + ' be a trigger of ' + description2;
		} else {
			relationText = 'Could there be ';
			if (type == 'negative') {
				relationText += ' an inverse ';
			} else {
				relationText += ' a ';
			}
			relationText += ' relationship between ' + description1 + ' and ' + description2;
		}

		var strengthText;
		var absScore = Math.abs(score);

		if (absScore >= .8)
			strengthText = 'very strong';
		else if (absScore >= .6)
			strengthText = 'strong';
		else if (absScore >= .35)
			strengthText = 'medium';
		else if (absScore >= .15)
			strengthText = 'weak';
		else
			strengthText = 'very weak';

		var new_row;
		var templateProperties = {
			id: id,
			type: type,
			marked: marked,
			label: LABELS[type],
			description1: description1,
			description2: description2,
			bubble_0: bubble(signalLevel, 0),
			bubble_1: bubble(signalLevel, 1),
			bubble_2: bubble(signalLevel, 2),
			bubble_3: bubble(signalLevel, 3),
			bubble_4: bubble(signalLevel, 4),
			relation_text: relationText,
			score: score,
			strength: strengthText,
			display: display
		};

		if (!isMobile) {
			var new_row = Mustache.render(correlation_template, templateProperties);
			$('#correlation-container').append(new_row);
		} else {
			App.pageView.getCurrentView().addListItems(templateProperties);
		}
	};

	if (!isMobile) {
		$('#correlation-container').on('mouseenter', '.bubble', function() {
			if ($(this).attr('src').match(/empty/)) {
				$(this).attr('src', "/images/curiosities/hover_circle.png")
			}
		});

		$('#correlation-container').on('mouseleave', '.bubble', function() {
			if ($(this).attr('src').match(/hover/)) {
				$(this).attr('src', "/images/curiosities/empty_circle.png")
			}
		});
	}

	var makeActiveById = function(id) {
		var v = $('#' + id).parents('ul').find('.filter').removeClass('active');
		$('#' + id).addClass('active');
	};

	if (!isMobile) {
		$('#correlation-container').on('click', '.bubble', function() {
			setNoiseOrSignal(this);
		});
	}

	var incPageNumber = function(searchId) {
		if (undefined == C.curiositiesPageNumber[searchId]) {
			C.curiositiesPageNumber[searchId] = 0;
		}
		C.curiositiesPageNumber[searchId] += 1;
	};

	C.performSearch = function(q, withRefresh) {
		if (undefined == q) {
			var q = (isMobile ? $('#curiosities-search').val() : $('#search-input').val()) || '';
		}
			var searchId = getSearchId(q);
		if (withRefresh) {
			C.curiositiesPageNumber[searchId] = 0;
		}
		C.curiositiesLastSearch = q;
		C.searchWithDefaults(afterSearch(q), q, C.curiositiesPageNumber[searchId]);
	};

	// search
	$('#search-input').keyup(function(e) {
		C.performSearch();
	});

	$('#search-image').click(function() {
		C.performSearch();
	});

	// Record the last 5 sort orders and store it in localStorage if it is available.
	C.sortClickHandler = function(selector) {
		$(selector).on('click', '.filter', function(e) {
			var id = $(this).attr('id');
			var idReg = new RegExp(id);
			var order = $(this).attr('data-order');
			var newOrder = order;
			$(this).attr('data-order', newOrder);
			C.curiositiesSortOrder = _.filter(C.curiositiesSortOrder, function(sortOrder) { return !sortOrder.match(idReg); });
			appendSortOrder(newOrder);

			log("C.curiositiesSortOrder", C.curiositiesSortOrder);

			C.pageIds = [];
			C.curiositiesPageNumber = {};
			C.curiositiesNumSearchResults = {};
			reRenderCorrelations(C.pageIds);
		});

		$('.filter-group').on('click', '.filter', function() {
			var id = $(this).attr('id');
			makeActiveById(id);
			if (shouldLoad()) {
				C.performSearch();
			}
		});
	}

	C.sortClickHandler('#sort-by-row');
	// Click on row to view graph.
	$('#correlation-container').on('click', '.curiosities-row-top', function() {
		var correlationId = $(this).parent().attr('data-id');
		viewGraph(correlationId);
	});

	var getSearchId = function(q) {
		return [q.replace(/,/g, ' '), 'all', C.curiositiesSortOrder[0], C.curiositiesSortOrder[1]].join(",");
	};

	descriptionFilter = function(q) {
		var reg = new RegExp(q);
		_.forEach(C.pageIds, function(id) {
			var obj = C.correlationIndex[id];
			var $row = $('.curiosities-row-container[data-id=' + id + ']');
			if (obj.description1.match(reg) || obj.description2.match(reg)) {
				$row.show();
			} else {
				$row.hide();
			}
		});
	};

	// Separate the search function from the application-specific prep work for calling the search function
	//	 in order to make testing of the search function easier.
	C.searchWithDefaults = function(afterSuccess, q) {
		var searchId = getSearchId(q);
		incPageNumber(searchId);
		var pageNumber = C.curiositiesPageNumber[searchId];
		var filter = 'all';
		var order1 = C.curiositiesSortOrder[0];
		var order2 = undefined;
		if (C.curiositiesSortOrder.length > 1) {
			order2 = C.curiositiesSortOrder[1];
		}

		// There are no more search results for the current search parameters/filter so no need to do the
		//	 search on the server.
		if (noMoreSearchResults(searchId)) {
			log("no more search results for the filter:", "q:", q, "filter:", filter, "order1:", C.curiositiesSortOrder[0], "order2", C.curiositiesSortOrder[1]);
			return 0;
		}
		search(afterSuccess, q, pageNumber, filter, order1, order2);
	};

	var processSearchResults = function(searchId, afterSuccess) {
		return function(data) {
			if (!checkData(data))
				return;

			log( "search results", data.length);
			C.curiositiesNumSearchResults[searchId] = data.length;
			for (var i=0; i < data.length; i++) {
				// Aliases for readability.
				var id = data[i].id;
				var description1 = data[i].description1;
				var description2 = data[i].description2;
				var saved = data[i].saved;
				var noise = data[i].noise;
				var signalLevel = data[i].signalLevel;
				var valueType = data[i].valueType;
				var score = 0.0;
				var marked = (-1 == signalLevel) ? 'empty' : 'marked';
				if (data[i].value) {
					score = data[i].value.toFixed(2);
					if (typeof score == 'string') {
						score = parseFloat(score);
					}
				}

				if ('TRIGGER' == valueType ) {
					intent = 'triggered';
				} else if (score >= 0) {
					intent = 'positive';
				} else {
					intent = 'negative';
				}

				if (C.pageIds == undefined) {
					C.pageIds = [];
				}
				if (undefined == C.correlationIndex[id]) {
					C.pageIds.push(id);
				}

				// Save in the master list in browser memory.
				var correlation = {
					id: id,
					type: intent,
					marked: marked,
					description1: description1,
					description2: description2,
					score: score,
					signalLevel: signalLevel
				};
				C.correlationIndex[id] = correlation;
				renderCorrelationRow(id, intent, description1, description2, score, signalLevel, marked);

			} // for
			if (afterSuccess) { afterSuccess(); }
		};
	};	 // processSearchResults

	search = function(afterSuccess, q, pageNumber, filter, order1, order2) {
		var url = App.serverUrl + '/correlation/search';
		log('search more data via AJAX', url);
		var searchId = getSearchId(q)
		queuePostJSON('search', url, {q: q, page: pageNumber, filter: filter, order1: order1, order2: order2}, processSearchResults(searchId, afterSuccess));
	};

	var updateUISortOrder = function() {
		var domId = getDomIdFromOrder(_.first(C.curiositiesSortOrder));
		makeActiveById(domId);
	};

	var resetScrollReady = function() {
		C.curiositiesScrollReady = true;
	};

	var afterSearch  =	function(q) {
		return function() {
			resetScrollReady();
			descriptionFilter(q);
		}
	};

	var noMoreSearchResults = function(searchId) {
		return (undefined != C.curiositiesNumSearchResults[searchId] && C.curiositiesNumSearchResults[searchId] == 0);
	};

	var shouldLoad = function () {
		var scrollPos = $(window).scrollTop();
		var pageHeight = $(window).height();
		var docHeight = $(document).height();
		return (C.curiositiesScrollReady && (docHeight - (scrollPos + pageHeight) < 800) && C.curiositiesScrollReady);
	};

	var handleScroll = function() {
		// Infinite scroll.
		if (shouldLoad()) {
			var q = $('#search-input').val() || '';
			var searchId = getSearchId(q);
			if ( noMoreSearchResults(searchId) ) {
				log("no more search results:", searchId);
				return 0;
			}
			C.curiositiesScrollReady = false;
			C.searchWithDefaults(afterSearch(q), q, C.curiositiesPageNumber);
			log('infinite scroll!', C.curiositiesPageNumber);
		}
	};

	$(window).on('scroll', handleScroll);

	initSortOrder();
	C.performSearch();
}

function setNoiseOrSignal(currentElement) {
	var signalLevel = $(currentElement).attr('signal-level');
	var correlationId = parseInt($(currentElement).closest('.curiosities-row-container').attr('data-id'));
	var action = 'updateSignalLevel'
	var url = App.serverUrl + '/correlation/' + correlationId + '/updateSignalLevel'
	queuePostJSON(action, url, { _method: 'PATCH', signalLevel: signalLevel},
			function(data) {
				if (!checkData(data))
					return;

				console.log('success', data);
			});
	$(currentElement).siblings('img').attr('src', (isMobile ? 'content' : '') + "/images/curiosities/empty_circle.png");
	$(currentElement).siblings('img').attr('marked', 'empty');
	$(currentElement).attr('src', (isMobile ? 'content' : '') + "/images/curiosities/marked_circle.png");
	$(currentElement).attr('marked', 'marked');
	C.correlationIndex[correlationId].marked = 'marked';
}
