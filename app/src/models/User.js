define(['require', 'exports', 'module','exoskeleton'],function(require, exports, module, exoskeleton) {
	var User = Backbone.Model.extend({
		property: {}
	});

	User.login = function (username, password, callback) {
		callback('test-user');
	}
    module.exports = User;
});
