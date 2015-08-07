define( function(require, exports, module) {
	var u = require('util/Utils');

	function ParticipantsAutocomplete() {
		this.fetch = function(term, callback) {
			u.queueJSON('Getting autocomplete', '/data/getAutocompleteParticipantsData?callback=',
					u.getCSRFPreventionObject("getAutocompleteParticipantsDataCSRF", {searchString: term}), function(data) {
				if (!checkData(data))
					return;

				if (data.success) {
					callback(data.usernameList);
				}
			}, function(xhr) { 
			
			});
		}
	}
	module.exports = ParticipantsAutocomplete;
});
