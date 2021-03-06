/**
 * This script provides limited access to the Chrome API and settings get/set methods
 * to both the options page and content script.
 */
var defaults = {
	config: "var config = {\r\n\t'a': {\r\n\t\ttitle: 'Alert',\r\n\t\texec: function() {\r\n\t\t\talert('It works!');\r\n\t\t}\r\n\t},\r\n\t'b': {\r\n\t\ttitle: 'Bookmarks',\r\n\t\tnext: {\r\n\t\t\t'w': {\r\n\t\t\t\ttitle: 'Wikipedia',\r\n\t\t\t\turl: 'http://www.wikipedia.org/',\r\n\t\t\t\tnext: {\r\n\t\t\t\t\t'c': {\r\n\t\t\t\t\t\ttitle: 'Chrome',\r\n\t\t\t\t\t\turl: 'http://en.wikipedia.org/wiki/Google_Chrome'\r\n\t\t\t\t\t}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t'y': {\r\n\t\t\t\ttitle: 'Youtube',\r\n\t\t\t\turl: 'http://www.youtube.com/'\r\n\t\t\t},\r\n\t\t}\r\n\t},\r\n\t'c': {\r\n\t\ttitle: 'Chrome issue',\r\n\t\tinput: {\r\n\t\t\ttitle: '#',\r\n\t\t\texec: function(val) {\r\n\t\t\t\tlocation.href = 'http://code.google.com/p/chromium/issues/detail?id=' + val\r\n\t\t\t}\r\n\t\t}\r\n\t},\r\n\t'g': {\r\n\t\ttitle: 'Github',\r\n\t\tinput: {\r\n\t\t\ttitle: 'author,repository',\r\n\t\t\texec: function(val) {\r\n\t\t\t\tvar author = val.split(',')[0],\r\n\t\t\t\t\trepository = val.split(',')[1];\r\n\t\t\t\tchrome.extension.sendMessage({\r\n\t\t\t\t\topenInNewTab: 'https://github.com/' + author + '/' + repository\r\n\t\t\t\t});\r\n\t\t\t}\r\n\t\t}\r\n\t},\r\n\t'u': {\r\n\t\ttitle: 'URL modifications',\r\n\t\tnext: {\r\n\t\t\t'r': {\r\n\t\t\t\ttitle: 'Go to root',\r\n\t\t\t\turl: location.origin\r\n\t\t\t},\r\n\t\t\t'c': {\r\n\t\t\t\ttitle: 'Clean from params',\r\n\t\t\t\turl: location.origin + location.pathname\r\n\t\t\t}\r\n\t\t}\r\n\t},\r\n\t'n': {\r\n\t\ttitle: 'Notify',\r\n\t\texec: function() {\r\n\t\t\text.notify('message');\r\n\t\t\text.notify('error', 'e');\r\n\t\t\text.notify('warning', 'w');\r\n\t\t\text.notify('success', 's');\r\n\t\t\text.notify('Press Esc to hide');\r\n\t\t}\r\n\t},\r\n\t'e': {\r\n\t\ttitle: 'Extension',\r\n\t\tnext: {\r\n\t\t\t'o': {\r\n\t\t\t\ttitle: 'Options',\r\n\t\t\t\texec: function() {\r\n\t\t\t\t\tchrome.extension.sendMessage({\r\n\t\t\t\t\t\topenOptionsPage: true\r\n\t\t\t\t\t});\r\n\t\t\t\t}\r\n\t\t\t}\r\n\t\t}\r\n\t}\r\n}",
	activationCondition: ""
};

defaults.profiles = [{
	title: 'Default profile',
	active: true,
	config: defaults.config,
	activationCondition: defaults.activationCondition,
	urls: ''
}];

function resetSettings() {
	setSettings(defaults.profiles);
}

function getSettings(callback) {
	chrome.storage.local.get('profiles', function(content) {
		if (typeof content.profiles == 'undefined') {
			legacy.getOptions(function(options) {
				var profiles = [{
					title: 'Default profile',
					active: true,
					config: options.config,
					activationCondition: options.activationCondition,
					//urls: ''
				}];
				setProfiles(profiles);
				callback(profiles, defaults);
			});
		} else {			
			callback(content.profiles, defaults);
		}		
	});
}

function setSettings(profiles, callback) {
	chrome.storage.local.set({
		profiles: profiles
	}, function() {
		if (callback) {
			callback();
		}
	});
}

function getOptions(url, callback) {
	getSettings(function(profiles) {
		var activeProfile = null;
		
		profiles.some(function(profile) {
			// first profile, tied to given URL
			if (profile.urls && new RegExp(profile.urls).test(url) ) {
				activeProfile = profile;
				
				return true;
			}
			
			// otherwise, active non-tied profile
			if (profile.active) {
				activeProfile = profile;
			}
		});
		
		callback({
			activationCondition: activeProfile.activationCondition,
			config: activeProfile.config,
			defaults: defaults
		});
	});
}

// bridge to the Chrome API for content script
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.openOptionsPage) {
			chrome.tabs.query({'active': true}, function (tabs) {
				var url = tabs[0].url;
				
				chrome.tabs.create({
					url: 'options/options.html?from=' + url
				});
			});
		}
		
		if (request.openInNewTab) {
			chrome.tabs.create({
				url: request.openInNewTab
			});
		}
		
		if (request.getOptions) {
			getOptions(request.url, function(options) {
				sendResponse(options);
			});
			
			return true;
		}
});

// crutches for painless upgrading from previous versions
var legacy = {
	getOptions: function(callback) {
		chrome.storage.local.get({
			config: defaults.config,
			activationCondition: defaults.activationCondition
		}, function(content) {
			// auto-fixing pre-1.1 config format
			if (content.config.substring(0, 3) != 'var') {
				content.config = 'var config = {\r\n' + content.config + '\r\n}';
			}
			
			callback({
				activationCondition: content.activationCondition,
				config: content.config,
				defaults: defaults
			});
		});
	}
};