define(function(require, exports, module) {
	'use strict';
	module.exports = [{
		title: 'Show Profile',
		iconFont: '<i class="fa fa-user"></i>',
		trigger: {name:'change-page', data: 'PeopleDetailView'}
	}, {
		title: 'Help',
		iconFont: '<i class="fa fa-cloud"></i>',
		trigger: {name:'change-page', data: 'QuickHelpView'}
	}, {
		title: 'Logout',
		iconFont: '<i class="fa fa-cloud"></i>',
		trigger: {name:'logout', data: 'HomeView'}
	}, {
		title: '             ',
	}, {
		title: '             ',
	}, {
		title: '             ',
	}, {
		title: '             ',
	}, {
		title: '             ',
	}, {
		title: '             ',
	}, {
		title: '             ',
	},];
});
