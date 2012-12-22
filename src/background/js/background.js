/**
 * This script provides limited access to the Chrome API and settings get/set methods
 * to both the options page and content script.
 */
var defaults = {
	config: "var config = {\r\n\t'a': {\r\n\t\ttitle: 'Alert',\r\n\t\texec: function() {\r\n\t\t\talert('It works!');\r\n\t\t}\r\n\t},\r\n\t'b': {\r\n\t\ttitle: 'Bookmarks',\r\n\t\tnext: {\r\n\t\t\t'w': {\r\n\t\t\t\ttitle: 'Wikipedia',\r\n\t\t\t\turl: 'http://www.wikipedia.org/',\r\n\t\t\t\tnext: {\r\n\t\t\t\t\t'c': {\r\n\t\t\t\t\t\ttitle: 'Chrome',\r\n\t\t\t\t\t\turl: 'http://en.wikipedia.org/wiki/Google_Chrome'\r\n\t\t\t\t\t}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t'y': {\r\n\t\t\t\ttitle: 'Youtube',\r\n\t\t\t\turl: 'http://www.youtube.com/'\r\n\t\t\t},\r\n\t\t}\r\n\t},\r\n\t'c': {\r\n\t\ttitle: 'Chrome issue',\r\n\t\tinput: {\r\n\t\t\ttitle: '#',\r\n\t\t\texec: function(val) {\r\n\t\t\t\tlocation.href = 'http://code.google.com/p/chromium/issues/detail?id=' + val\r\n\t\t\t}\r\n\t\t}\r\n\t},\r\n\t'g': {\r\n\t\ttitle: 'Github',\r\n\t\tinput: {\r\n\t\t\ttitle: 'author,repository',\r\n\t\t\texec: function(val) {\r\n\t\t\t\tvar author = val.split(',')[0],\r\n\t\t\t\t\trepository = val.split(',')[1];\r\n\t\t\t\tchrome.extension.sendMessage({\r\n\t\t\t\t\topenInNewTab: 'https://github.com/' + author + '/' + repository\r\n\t\t\t\t});\r\n\t\t\t}\r\n\t\t}\r\n\t},\r\n\t'u': {\r\n\t\ttitle: 'URL modifications',\r\n\t\tnext: {\r\n\t\t\t'r': {\r\n\t\t\t\ttitle: 'Go to root',\r\n\t\t\t\turl: location.origin\r\n\t\t\t},\r\n\t\t\t'c': {\r\n\t\t\t\ttitle: 'Clean from params',\r\n\t\t\t\turl: location.origin + location.pathname\r\n\t\t\t}\r\n\t\t}\r\n\t},\r\n\t'n': {\r\n\t\ttitle: 'Notify',\r\n\t\texec: function() {\r\n\t\t\text.notify('message');\r\n\t\t\text.notify('error', 'e');\r\n\t\t\text.notify('warning', 'w');\r\n\t\t\text.notify('success', 's');\r\n\t\t\text.notify('Press Esc to hide');\r\n\t\t}\r\n\t},\r\n\t'e': {\r\n\t\ttitle: 'Extension',\r\n\t\tnext: {\r\n\t\t\t'o': {\r\n\t\t\t\ttitle: 'Options',\r\n\t\t\t\texec: function() {\r\n\t\t\t\t\tchrome.extension.sendMessage({\r\n\t\t\t\t\t\topenOptionsPage: true\r\n\t\t\t\t\t});\r\n\t\t\t\t}\r\n\t\t\t}\r\n\t\t}\r\n\t}\r\n}",
	activationCondition: ""
};

function resetSettings() {
	chrome.storage.local.set({
		options: {
			config: defaults.config,
			activationCondition: defaults.activationCondition
		}
	});
	
	getOptions(function(options) {
		var profiles = [{
			title: 'Default profile',
			active: true,
			config: options.config,
			activationCondition: options.activationCondition
		}];
		setProfiles(profiles);
	});
}

function getProfiles(callback) {
	chrome.storage.local.get('profiles', function(content) {
		if (typeof content.profiles == 'undefined') {
			getOptions(function(options) {
				var profiles = [{
					title: 'Default profile',
					active: true,
					config: options.config,
					activationCondition: options.activationCondition
				}];
				setProfiles(profiles);
				callback(profiles);
			});
		} else {
			callback(content.profiles);
		}		
	});
}

function setProfiles(profiles, callback) {
	chrome.storage.local.set({
		profiles: profiles
	}, function() {
		if (callback) {
			callback();
		}
	});
}

function getOptions(callback) {
	chrome.storage.local.get({
		config: defaults.config,
		activationCondition: defaults.activationCondition
	}, function(content) {
		// auto-fixing pre-1.1 config format
		if (content.config.substring(0, 3) != 'var') {
			content.config = 'var config = {\r\n' + content.config + '\r\n}';
			setOptions(content);
		}
		
		callback({
			activationCondition: content.activationCondition,
			config: content.config,
			defaults: defaults
		});
	});
}

function setOptions(options, callback) {
	chrome.storage.local.set(options, function() {
		if (callback) {
			callback();
		}
	});
}

// bridge to the Chrome API for content script
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.openOptionsPage) {
			chrome.tabs.create({
				url: 'options/options.html'
			});
		}
		
		if (request.openInNewTab) {
			chrome.tabs.create({
				url: request.openInNewTab
			});
		}
		
		if (request.getProfiles) {
			getProfiles(function(profiles) {
				sendResponse(profiles);
			});
			
			return true;
		}
		
		if (request.getOptions) {
			getOptions(function(options) {
				sendResponse(options);
			});
			
			return true;
		}
});