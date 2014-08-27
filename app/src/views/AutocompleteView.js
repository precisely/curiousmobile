define(function(require, exports, module) {
    'use strict';
    var Utility = require('famous/utilities/Utility');
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var Timer = require('famous/utilities/Timer');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
    var TrueSurface = require('surfaces/TrueSurface');
    var u = require('util/Utils');

    var FormContainerSurface = require("famous/surfaces/FormContainerSurface");
    var InputSurface = require("famous/surfaces/InputSurface");
    var SequentialLayout = require("famous/views/SequentialLayout");
    var User = require('models/User');
//    var AutocompleteCollection = require('models/AutocompleteCollection'),

    function AutocompleteView() {
        View.apply(this, arguments);
        _createView.call(this);
    }

    AutocompleteView.prototype = Object.create(View.prototype);
    AutocompleteView.prototype.constructor = AutocompleteView;

    AutocompleteView.DEFAULT_OPTIONS = {};

    var resultOut;
    
    function _createView(argument) {
        var formSurface = new FormContainerSurface({
            size: [1270, 100],
        });
        
        var usernameSurface = new InputSurface({
            placeholder: resultOut,
            size: [1270, 100]
        });
        var passwordSurface = new InputSurface({
            placeholder: 'password',
            size: [200, 25],
            type: 'password'
        });

        this.usernameSurface = usernameSurface;

        var formLayout = new SequentialLayout({
            direction: 1,
            itemSpacing: 7,
        });

        var otherLinksSurface = new Surface({
            size: [200,20],
//            content: '<a href="#" class="create-account">Create an account</a> | ' +
//                '<a href="#" class="forgot-password">Forgot Password?</a>',
            properties: {
                color: 'black',
                fontSize: '11px'
            }
                
        });

        otherLinksSurface.on('click', function(e) {
            if (e instanceof CustomEvent) {
                if (_.contains(e.srcElement.classList, 'create-account')) {
                    console.log("Show create-account form");
                    this._eventOutput.emit('create-account');
                } else if (_.contains(e.srcElement.classList, 'forgot-password')) {
                    console.log("otherLinksSurface forgot password");
                    this._eventOutput.emit('forgot-password');
                }
            }
        }.bind(this));

        formLayout.sequenceFrom([usernameSurface, otherLinksSurface]);
        formSurface.add(formLayout);

        var autoCompleteModifier = new StateModifier({
            transform:Transform.translate(6,35,11)
        });

        this.add(autoCompleteModifier).add(formSurface);
    }

    var argsToSend = u.getCSRFPreventionObject('autocompleteDataCSRF', {
        all: 'info'
    });
    
    u.backgroundJSON("getting autocomplete info", u.makeGetUrl("autocompleteData"), u.makeGetArgs(argsToSend),
            function(data) {
                if (u.checkData(data)) {
                    console.log('autocomplete entries from the server: ', data);
                    tagStatsMap.import(data['all']);
                    algTagList = data['alg'];
                    freqTagList = data['freq'];
                    
//                    var inputField = $("#input0");
                    
//                    var term = request.term.toLowerCase();
                    var term = "C".toLowerCase();
                    
                    var skipSet = {};
                    var result = [];
                    
                    var matches = findAutoMatches(tagStatsMap, algTagList, term, 3, skipSet, 1);
                    
                    addStatsTermToSet(matches, skipSet);
                    appendStatsTextToList(result, matches);
                    
                    var remaining = 6 - matches.length;
                    
                    if (term.length == 1) {
                        var nextRemaining = remaining > 3 ? 3 : remaining;
                        matches = findAutoMatches(tagStatsMap, algTagList, term, nextRemaining, skipSet, 0);
                        addStatsTermToSet(matches, skipSet);
                        appendStatsTextToList(result, matches);
                        remaining -= nextRemaining;
                    }
                    
                    if (remaining > 0) {
                        matches = findAutoMatches(tagStatsMap, freqTagList, term, remaining, skipSet, 0);
                        appendStatsTextToList(result, matches);
                    }
                    
                    var obj = new Object();
                    obj.data = result;
                    console.log("result", result);
                    console.log("result length", result.length);

                    result.forEach(function(entry) {
//                        console.log(entry);
                        resultOut = entry.label;
                      alert(resultOut);
                    });
//                    response(result);
                    
                    
                    
//                    inputField.autocomplete({
//                        minLength: 1,
//                        attachTo: "#autocomplete",
//                        source: function(request, response) {
//                        },
//                        selectcomplete: function(event, ui) {
//                            var tagStats = tagStatsMap.getFromText(ui.item.value);
//                            if (tagStats) {
//                                var range = tagStats.getAmountSelectionRange();
//                                inputField.selectRange(range[0], range[1]);
//                                inputField.focus();
//                            }
//                        }
//                        });
//                        // open autocomplete on focus
//                        inputField.focus(function(){
//                            inputField.autocomplete("search",$("#input0").val());
//                        });
                    }
        });
    
    function addStatsTermToSet(list, set) {
        for (var i in list) {
            set[list[i].term] = 1;
        }
    }

    function appendStatsTextToList(list, stats) {
        for (var i in stats) {
            list.push(stats[i].text());
        }
    }

    function findAutoMatches(map, list, term, limit, skipSet, additionalWordsCharLimit) {
        var i, j, num = 0, result = [];
        
        var terms = term.split(' ');
        var spaceTerms = [];
        
        for (j in terms) {
            spaceTerms.push(' ' + terms[j]);
        }
        
        var termLonger = term.length > additionalWordsCharLimit;
        
        for (i in list) {
            var tag = list[i];
            if (tag in skipSet) continue;
            var match = true;
            for (j in terms) {
                if (terms[j].length >0 && (!(tag.startsWith(terms[j]) || (termLonger && (tag.indexOf(spaceTerms[j]) >= 0)) ))) {
                    match = false;
                    break;
                }
            }
            if (match) {
                result.push(map.get(tag));
                if (++num >= limit) break;
            }
        }
        
        return result;
    }

    //static autocomplete
    function TagStats(term, amount, amountPrecision, units) {
        this.term = term;
        this.amount = amount;
        this.amountPrecision = amountPrecision;
        this.units = units;
        
        this.set = function(amount, amountPrecision, units) {
            if (this.amount != amount || this.amountPrecision != amountPrecision
                    || this.units != units) {
                this.amount = amount;
                this.amountPrecision = amountPrecision;
                this.units = units;
                
                return true;
            }
            
            return false;
        }
        
        this.text = function() {
            var label = this.term;
            var value = this.term;
            var noAmt = true;
            
            if (this.amount != null && this.amountPrecision > 0) {
                label += ' ' + this.amount;
                value += ' ' + this.amount;
                noAmt = false;
            } else if (this.amount == null && this.units.length == 0) {
                label += ' ';
                value += ' ';
            }
            
            if (this.units != null && this.units.length > 0) {
                if (noAmt) {
                    //label += '   ';
                    value += ' ';
                }
                //label += ' ' + this.units;
                value += ' ' + this.units;
            }
            
            return { label:label, value:value };
        }
        
        this.getAmountSelectionRange = function() {
            var start = this.term.length;
            var end = start;
            
            if (this.amount != null && this.amountPrecision > 0) {
                ++start;
                end += ('' + this.amount).length + 1;
            } else if (this.amount == null) {
                ++start;
                ++end;
            } else if (this.units != null && this.units.length > 0) {
                ++start;
                ++end;
            }
            
            return [start, end];
        }
    }

    function TagStatsMap() {
        this.map = {};
        this.textMap = {};

        this.import = function(list) {
            // import list of tag elements from server
            for (var i in list) {
                this.add(list[i][0], list[i][1], list[i][2], list[i][3]);
            }
        }
        
        this.add = function(term, amount, amountPrecision, units) {
            var tagStats = new TagStats(term, amount, amountPrecision, units);
            this.map[term] = tagStats;
            this.textMap[tagStats.text().value] = tagStats;
            return tagStats;
        }
        
        // return null if stats already present, stats if it isn't
        this.set = function(term, amount, amountPrecision, units) {
            var stats = this.map[term];
            
            if (stats != null) {
                var oldTextValue = stats.text().value;
                if (stats.set(amount, amountPrecision, units)) {
                    var newTextValue = stats.text().value;
                    if (oldTextValue != newTextValue) {
                        delete this.textMap[oldTextValue];
                        delete this.map[term];
                        this.textMap[newTextValue] = stats;
                        this.map[term] = stats;
                    }
                }
                
                return null;
            }f
            
            return this.add(term, amount, amountPrecision, units);
        }
        
        this.get = function(term) {
            return this.map[term];
        }
        
        this.getFromText = function(textValue) {
            return this.textMap[textValue];
        }
    }

    var tagStatsMap = new TagStatsMap();
    var algTagList = [];
    var freqTagList = [];

    // refresh autocomplete data if new tag added
    function updateAutocomplete(term, amount, amountPrecision, units) {
        var stats = tagStatsMap.set(term, amount, amountPrecision, units);
        if (stats != null) {
            algTagList.push(term);
            freqTagList.push(term);
        }
    }

    // clear any cached state on logoff
    registerLogoutCallback(function() {
    });
    
    module.exports = AutocompleteView;
});
