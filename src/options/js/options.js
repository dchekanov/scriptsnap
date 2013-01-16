/**
 * Powers options page. 
 */
var options = {
 	init: function() {
 		var backgroundPage = chrome.extension.getBackgroundPage(),
 			currentProfileIdx = -1,
 			form = $('form'),
 			urlsInput = $('input.config[name="urls"]'),
 			activationConditionTextarea = $('textarea.config[name="activation-condition"]'),
 			configTextarea = $('textarea.config[name="config"]'),
 			profilesContainer = $('div.profiles'),
 			profilesList = $('<ul class="profiles" />').prependTo(profilesContainer);
  		
 		backgroundPage.getSettings(function(profiles, defaults) {
 			 			
 			function markProfileAsActive(idx) {
 				profiles.forEach(function(profile) {
 					profile.active = false;
 				});
 				
	 			profiles[idx].active = true;
	 			profilesList.find('li:eq(' + idx + ')').removeClass('tied').addClass('active untied').siblings().removeClass('active');
 			}
 			
 			function saveSettings(callback) {
 				var currentProfileListEl = profilesList.find('li:eq(' + currentProfileIdx + ')');
 				
 				profiles[currentProfileIdx].urls = urlsInput.val();
				profiles[currentProfileIdx].activationCondition = activationConditionTextarea.data('editor').getValue();
				profiles[currentProfileIdx].config = configTextarea.data('editor').getValue();
				
 				if (profiles[currentProfileIdx].urls) {
 					profiles[currentProfileIdx].active = false;
					currentProfileListEl.addClass('tied').removeClass('active untied');
					
					if (!profilesList.find('li.active').length) {
						profilesList.find('li.untied:first').addClass('active');
						profiles[profilesList.find('li.untied:first').index()].active = true;
					}
				} else {
					markProfileAsActive(currentProfileIdx);
				}
				
				backgroundPage.setSettings(profiles, function() {
					urlsInput.data('savedValue', urlsInput.val() );
					activationConditionTextarea.data('editor').markClean();
					configTextarea.data('editor').markClean();
					
					if (callback) {
	 					callback();
	 				}
				});
 			}
 			
		 	function switchProfile(idx) {
	 			if (currentProfileIdx != -1 && (urlsInput.data('savedValue') != urlsInput.val() || !activationConditionTextarea.data('editor').isClean() || !configTextarea.data('editor').isClean() ) && confirm('Save changes in the current profile?') ) {
 					form.submit();
	 			}
	 			
	 			if (currentProfileIdx != -1) {
	 				profilesList.find('li').removeClass('current');
	 			}
		 		
		 		profilesList.find('li:eq(' + idx + ')').addClass('current');
		 		
		 		urlsInput.val(profiles[idx].urls);
	 			activationConditionTextarea.data('editor').setValue(profiles[idx].activationCondition);
	 			configTextarea.data('editor').setValue(profiles[idx].config);
	 			
	 			currentProfileIdx = idx;
	 			
	 			saveSettings();
	 		}
	 		
	 		activationConditionTextarea.data({
 				'default': defaults.activationCondition,
 				editor: CodeMirror.fromTextArea(activationConditionTextarea[0], {
	 				indentWithTabs: true,
	 				tabSize: 2
	 			})
 			});
 			
 			configTextarea.data({
 				'default': defaults.config,
 				editor: CodeMirror.fromTextArea(configTextarea[0], {
	 				indentWithTabs: true,
	 				tabSize: 2,
	 				matchBrackets: true
	 			})
 			});
	 		
	 		// building the list of defined profiles and determining which one should be loaded to the editors
	 		var onLoadProfileIdx = -1;
	 		
 			profiles.forEach(function(profile, idx) {
 				var profileListEl = $('<li><a>' + profile.title + '</a></li>');
 				
 				if (profile.urls) {
 					profileListEl.addClass('tied');
 				} else {
 					profileListEl.addClass('untied');
 				}
 				
 				profileListEl.appendTo(profilesList);
 				
 				if (profile.active) {
 					onLoadProfileIdx = idx;
 				}
 			});
 			
 			profiles.some(function(profile, idx) {
 				if (profile.urls && new RegExp(profile.urls).test(location.href.match(/from=(.*)/)[1]) ) {
 					onLoadProfileIdx = idx;
 				}
 			});
 			
 			switchProfile(onLoadProfileIdx == -1 ? 0 : onLoadProfileIdx);

 			// there should be no option to delete the only profile
 			if (profilesList.find('li').length == 1) {
				profilesContainer.find('a.delete').hide();
			}
 			
 			profilesList.on('click', 'li a', function() {
 				switchProfile($(this).parent().index() );
 				
 				return false;
 			});
 			
 			profilesContainer.find('a.add').click(function() {
	 			var title = prompt('Title:', 'New profile');
	 			
	 			if (title) { 				
	 				profilesList.append('<li><a>' + title + '</a></li>');
	 				profiles.push({
	 					title: title,
	 					config: 'var config = {\r\n\t\r\n}',
	 					activationCondition: '',
	 					urls: ''
	 				});
	 				
	 				profilesContainer.find('a.delete').show();
	 				
	 				switchProfile(profiles.length - 1);
	 			}
	 			
	 			return false;
	 		});
 			
 			profilesContainer.find('a.rename').click(function() {
	 			var currentProfileEl = profilesContainer.find('li.current'),
	 				newTitle = prompt('New title:', profiles[currentProfileIdx].title);
	 			
	 			if (newTitle) {
	 				profiles[currentProfileIdx].title = newTitle;
	 				currentProfileEl.find('a').text(newTitle);
	 				saveSettings();
	 			}
	 			
	 			return false;
	 		});
	 		
	 		profilesContainer.find('a.delete').click(function() {
	 			if (confirm('Are you shure?')) {
	 				var link = $(this), currentProfileEl = profilesContainer.find('li.current');
	 				
	 				profiles.splice(currentProfileIdx, 1);
	 				currentProfileEl.remove();
	 				
	 				if (profiles.length == 1) {
	 					link.hide();
	 				}
	 				
	 				currentProfileIdx = -1;	 				
	 				switchProfile(profiles.length - 1);
	 			}
	 			
	 			return false;
	 		});
	 		
	 		form.submit(function() {
	 			saveSettings(function() {
	 				form.find('input').next('.success').remove();
	 				form.find('div.title strong').addClass('success');
	 				$('<span class="success">Saved</span>').insertAfter(form.find('input') );
	 				
	 				setTimeout(function() {
	 					form.find('span.success').fadeOut(1000, function() {
		 					form.find('div.title strong').removeClass('success');
		 				});
	 				}, 2000);
	 			});
	 			
	 			return false;
	 		});
 			
 			urlsInput.data('savedValue', urlsInput.val() );
 			
 			configTextarea.data('editor').on('cursorActivity', function() {
 				configTextarea.data('editor').matchHighlight("CodeMirror-matchhighlight");
 			});
 		});
 		
 		$('a.explain').click(function() {
 			$('div.explain:eq(' + $('a.explain').index(this) + ')').toggle();
 			
 			return false;
 		});
 		
 		$('a.restore').click(function() {
 			var textarea = $('textarea.config:eq(' + $('a.restore').index(this) + ')'); 
 			
 			textarea.data('editor').setValue(textarea.data('default') );
 			
 			return false;
 		});
 		
 		// switch to/from version history
 		$('#sections-toggler').click(function() {
 			$('.section').toggleClass('active');
 			$(this).text($('.section:not(.active) h2').text().toLowerCase());
 			
 			return false;
 		});
 		
 		// shortcuts
 		$(window).keydown(function(event) {
 			if (event.keyCode == 83 && event.ctrlKey == true && $('div.section.active').is('.config') ) {
 				// Ctrl+S = save changes
 				form.submit();
 				
 				return false;
 			} else if (event.keyCode == 70 && event.ctrlKey == true && event.shiftKey == true && $('div.section.active').is('.config') ) {
 				// Ctrl+Shift+F = format config code
 				var formattedCode = js_beautify(configTextarea.data('editor').getValue(), {
					indent_size: 1,
					indent_char: '\t',
					preserve_newlines: false
 				});
 				
 				configTextarea.data('editor').setValue(formattedCode);
 				
 				return false;
 			}
 		});
 	}
 };
 
 $(function() {
 	options.init();
 });