define(function(require, exports, module) {
	'use strict';
	module.exports = [{
		title: 'Show Profile',
		iconFont: '<i class="fa fa-user"></i>',
		trigger: {name:'change-page', data: 'PeopleDetailView'}
	}, {
		title: 'Help',
		iconFont: '<i class="fa fa-question-circle"></i>',
		trigger: {name:'change-page', data: 'HelpContentsView'}
	}, {
		title: 'Terms of Service',
		iconFont: '<i class="fa fa-file-text-o"></i>',
		trigger: {name:'change-page', data: 'TermsView'}
	}, {
		title: 'Logout',
		iconFont: '<i class="fa fa-sign-out"></i>',
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
