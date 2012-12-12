/**
 * Powers options page. 
 */
var options = {
 	init: function() {
 		var form = $('form'),
 			activationConditionTextarea = $('textarea.config[name="activation-condition"]'),
 			configTextarea = $('textarea.config[name="config"]'),
 			backgroundPage = chrome.extension.getBackgroundPage();
 		
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
	 				matchBrackets: true,
	 				onCursorActivity: function() {
						configTextarea.data('editor').matchHighlight("CodeMirror-matchhighlight");
					}
	 			})
 			});
 		});
 		
 		form.submit(function(event) {
 			backgroundPage.setOptions({
 				activationCondition: activationConditionTextarea.data('editor').getValue(),
 				config: configTextarea.data('editor').getValue()
 			}, function() {
 				form.find('input').next('.success').remove();
 				form.find('div.title strong').addClass('success');
 				$('<span class="success">Saved</span>').insertAfter(form.find('input') ).delay(2000).fadeOut(1000, function() {
 					form.find('div.title strong').removeClass('success');
 				});
 			});
 			
 			return false;
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
 		
 		$('#sections-toggler').click(function() {
 			$('.section').toggleClass('active');
 			$(this).text($('.section:not(.active) h2').text().toLowerCase());
 			
 			return false;
 		});
 		
 		$(window).keydown(function(event) {
 			if (event.keyCode == 83 && event.ctrlKey == true && $('div.section.active').is('.config') ) {
 				form.submit();
 				
 				return false;
 			} else if (event.keyCode == 70 && event.ctrlKey == true && event.shiftKey == true && $('div.section.active').is('.config') ) {
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