/**
 * Attaches to every page user visits. Only has access to DOM.
 * Other scripts are not available (and, in turn, this script is unavailable to them).
 */
var ext = {
	/** Used to create unique ids for DOM elements */
	id: chrome.i18n.getMessage('@@extension_id'),
	/** Holds links to the corresponding DOM elements (Zepto-wrapped) */
	ui: {
		keys: null,
		notifications: null
	},
	/** This is what was defined on the 'options' page */
	settings: {
		config: null,
		activationCondition: null
	},
	/** This is used for conditional activation */
	prevKey: {
		code: null,
		time: null
	},
	/** Holds links to current and all previous keys definitions (as objects) */
	key: {
		cur: null,
		prev: [],
	},
	/** A list of all keys which were pressed to reach to the current key (as strings) */
	path: [],
	/**
	 * Extension initiation: reads options, attaches event listeners 
	 */
	init: function() {
		chrome.extension.sendMessage({
			getOptions: true,
			url: location.href
		}, function(settings) {
			// essentially equals to "var config = { ... }"
			eval(settings.config);
			ext.settings.activationCondition = settings.activationCondition;
			ext.settings.config = {
				next: config
			};
			ext.key.cur = ext.settings.config;
			$(window).on('keydown', ext.handleKey);
		});
	},
	/**
	 * Decides, what to do when user presses some key
	 */
	handleKey: function(event) {
		var code = event.keyCode;
		
		// only handle special keys for activation and navigation
		if (ext.settings.activationCondition == '' && (!ext.ui.keys || !ext.ui.keys.hasClass('active') ) && !( [8, 13, 27].indexOf(code) != -1 || (code >= 48 && code <= 57) || (code >= 96 && code <= 105) || (code >= 65 && code <= 90) ) ) {
			return;
		}
		
		// make sure we don't break user's interaction with forms
		if (['input', 'textarea', 'select'].indexOf(event.target.nodeName.toLowerCase() ) != -1) {
			// special scenarios needed for cases when working with input in ext's UI 
			if (ext.ui.keys && $.contains(ext.ui.keys[0], event.target) ) {
				if (code == 8) {
					// pressing backspace on empty input should send user on previous key level
					if (event.target.value.length == 0) {
						event.target.value = '';
						ext.prevLevel();
						event.preventDefault();
					}
					
					// if input is not empty, prevent ext to handle keypress further
					return;
				} else if (code == 27) {
					event.target.value = '';
					ext.prevLevel();
					
					return;
				}
			} else {
				// ignore key presses when user works with some regular form on a page
				return;
			}
		}
		
		// this results in an english character no matter what input language user have
		var key = String.fromCharCode(code).toLowerCase();
		
		// if there are notifications, let them be hidden on Esc or Backspace
		if (ext.ui.notifications && ext.ui.notifications.hasClass('active') && (code == 27 || code == 8 && !ext.ui.keys.hasClass('active') ) ) {
			ext.ui.notifications.removeClass('active').empty();
			event.preventDefault();
		} else if (ext.ui.keys && ext.ui.keys.hasClass('active') ) {			
			if (code == 13) {
				ext.execKey(event.shiftKey);
				event.preventDefault();
				
				return false;
			} else if (code == 8) {
				if (ext.path.length) {
					ext.prevLevel();
				} else {
					ext.deactivate();
				}
				
				return false;
			} else if (code == 27) {
				ext.deactivate();
			} else {
				ext.nextLevel(key);
			}			
		} else if (!ext.ui.keys || ext.ui.keys && !ext.ui.keys.hasClass('active') ) {
			// ctrlKey filtration set to prevent ext to popup on Ctrl+C and alike keystrokes
			if (ext.settings.activationCondition == '' && !event.ctrlKey && ext.key.cur.next[key]) {
				ext.activate();
				ext.nextLevel(key);
				event.preventDefault();
			} else if (eval(ext.settings.activationCondition) ) {
				ext.activate();
				event.preventDefault();
			}
		}
		
		ext.prevKey = {
			code: code,
			time: new Date()
		};
	},
	/**
	 * Steps to previous level
	 */
	prevLevel: function() {
		ext.ui.keys.find('li.current input').blur();
		
		ext.key.cur = ext.key.prev.pop();
		ext.path.pop();
		
		ext.ui.keys.find('li.current').removeAttr('class');
		
		if (ext.path.length) {
			ext.ui.keys.find('li[rel="' + ext.path.join('') + '"]').addClass('active current');
		}
	},
	/**
	 * Steps to next level 
	 */
	nextLevel: function(key) {
		if (ext.key.cur.next && ext.key.cur.next[key]) {
			ext.key.prev.push(ext.key.cur);
			ext.key.cur = ext.key.cur.next[key];
			ext.path.push(key);
			
			ext.ui.keys.find('li.current').attr('class', 'active');
			ext.ui.keys.find('li[rel="' + ext.path.join('') + '"]').addClass('active current');
			
			ext.ui.keys.find('li[rel="' + ext.path.join('') + '"] input').focus();
			event.preventDefault();
		}
	},
	/**
	 * Executes code, binded to current key
	 */
	execKey: function(shiftKey) {
		if (ext.key.cur.input && ext.key.cur.input.exec) {
			ext.key.cur.input.exec(ext.ui.keys.find('li.current input').val() );
		} else if (ext.key.cur.exec) {
			ext.key.cur.exec();
		} else if (ext.key.cur.url) {
			if (shiftKey) {
				chrome.extension.sendMessage({
					openInNewTab: ext.key.cur.url
				});
			} else {
				location.href = ext.key.cur.url;
			}
		}
		
		ext.deactivate();
	},
	/**
	 * Activates UI (builds it beforehand, if needed) 
	 */
	activate: function() {
		if (!ext.ui.keys) {			
			ext.ui.keys = $('<div id="ext-' + ext.id + '-keys" />').html(ext.generateKeysHTML() ).appendTo('body');
			ext.ui.notifications = $('<ul id="ext-' + ext.id + '-notifications" />').appendTo('body');
		}
		
		ext.ui.keys.addClass('active');
	},
	/**
	 * Resets UI into its initial state 
	 */
	reset: function() {
		ext.ui.keys.find('li').removeAttr('class');		
		ext.path = [];
		ext.key = {
			cur: ext.settings.config,
			prev: []
		};
	},
	/**
	 * Resets and hides UI 
	 */
	deactivate: function() {
		ext.reset();
		ext.ui.keys.removeClass('active');
	},
	/**
	 * Generates HTML for the list of available keys 
	 */
	generateKeysHTML: function() {
		var html = '';
		
		/**
		 * Generates HTML for a wrapper holding a list of keys on a given level 
		 */
		function generateLevel(level, rel) {
			html += '<ul>';
			
			for (key in level) {
				generateKey(level, key, rel);
			}
			
			html += '</ul>';
		}
		
		/**
		 * Generates HTML for a single key on a level 
		 */
		function generateKey(level, key, rel) {
			rel = rel + key;
			html += '<li rel="' + rel + '">'
			html += level[key].title + ' (<strong>' + key + '</strong>)'
			
			if (level[key].url || level[key].exec) {
				html += ' ↳';
			}
			
			if (level[key].input) {
				html += ' ↦ <input /> ' + level[key].input.title;
			}
			
			if (level[key].next) {
				generateLevel(level[key].next, rel);
			}
			
			html += '</li>';
		}
		
		generateLevel(ext.settings.config.next, '');
				
		return html;
	},
	/**
	 * Adds notification
	 * @param {String} message Text to show
	 * @param {String} type Type of notification ('e','w','s')
	 */
	notify: function(message, type) {
		ext.ui.notifications.addClass('active').append('<li class="' + type + '">' + message + '</li>');
	}
};

ext.init();