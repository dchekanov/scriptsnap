/**
 * Powers options page. 
 */
var options = {
 	init: function() {
 		var backgroundPage = chrome.extension.getBackgroundPage(),
 			form = $('form'),
 			activationConditionTextarea = $('textarea.config[name="activation-condition"]'),
 			configTextarea = $('textarea.config[name="config"]'),
 			profilesContainer = $('div.profiles'),
 			profilesList = $('<ul class="profiles" />').prependTo(profilesContainer);
  		
 		backgroundPage.getProfiles(function(profiles) {
 			
 			function saveSettings(callback) {
 				profiles.some(function(profile) {
	 				if (profile.active == true) {
	 					profile.activationCondition = activationConditionTextarea.data('editor').getValue();
	 					profile.config = configTextarea.data('editor').getValue();
	 					backgroundPage.setProfiles(profiles);
	 					
	 					return true;
	 				}
	 			});
	 			
	 			backgroundPage.setOptions({
	 				activationCondition: activationConditionTextarea.data('editor').getValue(),
	 				config: configTextarea.data('editor').getValue()
	 			}, function() {
	 				activationConditionTextarea.data('editor').markClean();
	 				configTextarea.data('editor').markClean();
	 			
	 				if (callback) {
	 					callback();
	 				}
	 			});
 			}
 			
		 	function switchProfile(idx) {
		 		var activeProfileEl = profilesList.find('li.active');
		 		
	 			if (activeProfileEl.length && (!activationConditionTextarea.data('editor').isClean() || !configTextarea.data('editor').isClean() ) && confirm('Save changes in the current profile?') ) {
 					form.submit();
	 			}
	 			
	 			if (activeProfileEl.length) {
	 				activeProfileEl.removeClass('active');
		 			profiles[activeProfileEl.index()].active = false;
	 			}
		 		
		 		profilesList.find('li:eq(' + idx + ')').addClass('active');
		 		profiles[idx].active = true;
		 		
	 			activationConditionTextarea.data('editor').setValue(profiles[idx].activationCondition);
	 			configTextarea.data('editor').setValue(profiles[idx].config);
	 			
	 			saveSettings();
	 		}
	 		
 			profiles.forEach(function(profile) {
 				var profileEl = $('<li><a>' + profile.title + '</a></li>');
 				
 				if (profile.active) {
 					profileEl.addClass('active');
 				}
 				
 				profilesList.append(profileEl);
 			});
 			
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
	 					activationCondition: ''
	 				});
	 				
	 				profilesContainer.find('a.delete').show();
	 				
	 				switchProfile(profiles.length - 1);
	 			}
	 			
	 			return false;
	 		});
 			
 			profilesContainer.find('a.rename').click(function() {
	 			var activeProfileEl = profilesContainer.find('li.active'), activeProfile = profiles[activeProfileEl.index()],
	 				newTitle = prompt('New title:', activeProfile.title);
	 			
	 			if (newTitle) {
	 				activeProfile.title = newTitle;
	 				activeProfileEl.find('a').text(newTitle);
	 				backgroundPage.setProfiles(profiles);
	 			}
	 			
	 			return false;
	 		});
	 		
	 		profilesContainer.find('a.delete').click(function() {
	 			if (confirm('Are you shure?')) {
	 				var link = $(this), activeProfileEl = profilesContainer.find('li.active');
	 				
	 				profiles.splice(activeProfileEl.index(), 1);
	 				activeProfileEl.remove();
	 				
	 				if (profilesContainer.find('ul.profiles li').length == 1) {
	 					link.hide();
	 				}
	 				
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
			
			backgroundPage.getOptions(function(result) {
	 			activationConditionTextarea.val(result.activationCondition).data({
	 				'default': result.defaults.activationCondition,
	 				editor: CodeMirror.fromTextArea(activationConditionTextarea[0], {
		 				indentWithTabs: true,
		 				tabSize: 2
		 			})
	 			});
	 			
	 			configTextarea.val(result.config).data({
	 				'default': result.defaults.config,
	 				editor: CodeMirror.fromTextArea(configTextarea[0], {
		 				indentWithTabs: true,
		 				tabSize: 2,
		 				matchBrackets: true
		 			})
	 			});
	 			
	 			configTextarea.data('editor').on('cursorActivity', function() {
	 				configTextarea.data('editor').matchHighlight("CodeMirror-matchhighlight");
	 			})
	 			
	 			activationConditionTextarea.data('editor').markClean();
	 			configTextarea.data('editor').markClean();
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