define(['require', 'exports', 'module', 'exoskeleton'], function(require, exports, module, exoskeleton) {
	'use strict';
	var Entry = Backbone.Model.extend({

		isConcreteGhost: function() {
			return (this.repeatType &  RepeatType.CONCRETEGHOST_BIT) != 0;
		},
		isContinuous: function() {
			return (this.repeatType &  RepeatType.CONTINUOUS_BIT) != 0;
		},
		isGhost: function() {
			return (this.repeatType &  RepeatType.GHOST_BIT) != 0;
		},
		isRemind: function() {
			return (this.repeatType &  RepeatType.REMIND_BIT) != 0;
		},
		isRepeat: function() {
			return (this.repeatType &  RepeatType.REPEAT_BIT) != 0;
		},
		isTimed: function() {
			return (this.repeatType &  RepeatType.TIMED_BIT) != 0;
		},
	});

	// Singleton Class function.
	Entry.RepeatType = {
		CONTINUOUS_BIT: 0x100,
		GHOST_BIT: 0x200,
		CONCRETEGHOST_BIT: 0x400,
		TIMED_BIT: 0x1 | 0x2 | 0x4,
		REPEAT_BIT: 0x1 | 0x2,
		REMIND_BIT: 0x4,

	}

	module.exports = Entry;
});
