(function($) {
	var boolean_constructs = ['and', 'or', 'not'],
		other_constructs = ['some', 'only', 'onlysome', 'min', 'max', 'exactly', 'that'],
		axiom_constructs = ['SubClassOf', 'DisjointWith', 'EquivalentClasses', 'DisjointClasses','EquivalentTo', 
		                    'EquivalentProperties', 'DisjointProperties', 'SubPropertyOf', 'DisjointUnionOf', 'Domain', 'Range',
		                    'Functional', 'InverseFunctional', 'Symmetric', 'Transitive', 'Reflexive', 'Irreflexive', 'Asymmetric'],
		currentAxiomTypes = [],
		visible_axiom_types = [];
	
	$.widget("ui.enrichment", {
		
		self : null,
		
		options : {
			endpoint : {
				url : "http://dbpedia.org/sparql",
				graph : "http://dbpedia.org"
			},
			service_url : "http://localhost:9099/interfaces/Enrichment",
		},
		
		_create : function() {
			self = this;
			this.element.load('template/widget.html', function(){
				self._initEntityTypeDetection();
		    	$('[name="type"]').attr("disabled", "disabled");
		    	$('#autodetect').click(self._initEntityTypeDetection);

		    	$('#chckHead').click(function() {
		    		if (this.checked == false) {

		    			$('.chcktbl:checked').attr('checked', false);
		    		} else {
		    			$('.chcktbl:not(:checked)').attr('checked', true);

		    		}
		    	});

		    	$('#chckHead').click(function() {

		    	});

		    	$('#class').click(function() {
		    		$("#axiom_types_table tbody").children().remove();
		    		self._show_class_axiom_types();
		    	});

		    	$('#object_property').click(function() {
		    		$("#axiom_types_table tbody").children().remove();
		    		self._show_object_property_axiom_types();
		    	});

		    	$('#data_property').click(function() {
		    		$("#axiom_types_table tbody").children().remove();
		    		self._show_data_property_axiom_types();
		    	});

		    	$('#options').submit(function() {
		    		alert('Handler for .submit() called.');
		    		return false;
		    	});

		    	$('#start_button').click(function() {
		    		var valid = $('#options').form('validate');

		    		if (valid) {
		    			$('#results').children().remove();//clear results view
		    			currentAxiomTypes = [];
		    			//compute_axioms_one_request();
		    			self._compute_axioms_multiple_requests();
		    		}

		    		return false;
		    	});

		    	$('#sparul').click(function() {
		    		self._show_SPARUL();
		    	});
		    	
		    	//add formatter to threshold slider
				$('#threshold').slider({  
				    tipFormatter: function(value){  
				        return value + '%';  
				    }  
				}); 
			});
			
		},

		destroy : function() {
			this.element.next().remove();
		},

		_setOption : function(option, value) {
			$.Widget.prototype._setOption.apply(this, arguments);
		},
		
		/*
		Shows the selected axioms as SPARUL statements.
		 */
		_show_SPARUL : function() {
			var selected_axioms = [];
			for(var i = 0; i < visible_axiom_types.length; i++){ //get for each axiom type the selected axioms from the table containing the learned axioms 
				var rows = $('#' + visible_axiom_types[i]).datagrid('getSelections');  
				for(var j = 0; j < rows.length; j++){
					selected_axioms.push(rows[j].axiom_sparul);  
				}  
			}
			
			if(selected_axioms.length > 0){
				var dialogElement = $('#sparul_dialog')
				dialogElement.empty();
				dialogElement.append(this._html_escape(selected_axioms.join('\n')));
				dialogElement.dialog({  
				    title: 'SPARUL Statments',  
				    width: 600,  
				    height: 400,  
				    closed: false,  
				    cache: false,  
				    modal: true,
				    resizable: true
				});  
			}
		},

		/*
		Returns the URL parameters extracted from the options on the left side.
		 */
		_get_url_parameters : function() {
			var resource_uri = $('#resource_uri');
			var use_inference = $('#use_inference');
			var threshold = $('#threshold');
			var default_graph_uri = this.options.endpoint.graph;
			var graph_defined = true;
			if(typeof(default_graph_uri) === 'undefined'){
				graph_defined = false;
			}

			var data = 'endpoint_url=' + this.options.endpoint.url + '&default_graph_uri=' + this.options.endpoint.graph + '&resource_uri='
					+ resource_uri.val() + '&use_inference=' + use_inference.val() + '&threshold='
					+ threshold.slider('getValue') / 100;

			if (!$('#autodetect').val()) {
				data += '&entity_type=' + $('input[name=type]:checked', '#options').val();
			}
			return data;
		},

		/*
		Computes axioms for each axiom type in multiple server requests.
		 */
		_compute_axioms_multiple_requests : function() {
			var base_data = this._get_url_parameters();
			var service_url = this.options.service_url;
			self._on_running(true);
			  var number_of_running_tasks = 0;
			  $('tbody input[@type=checkbox]:checked').each(function(){
				  number_of_running_tasks++;
				  var axiom_type = $(this).val();
				  currentAxiomTypes.push(axiom_type);
				  console.log(axiom_type);
				  
				  var data = base_data + '&axiom_types=' + axiom_type;
				  console.log(data);
				  //send request
				  jQuery.ajax({
					url: service_url,
					type: "GET",
					data: data,
					dataType: "jsonp",
					jsonp: 'jsonp_callback',
					success: function (data) {
						self._showTables(data);
						number_of_running_tasks--;
						if(number_of_running_tasks == 0){
							self._on_running(false);
						}
					},
					error: function() {
						console.log('Error!'); 
						number_of_running_tasks--;
						if(number_of_running_tasks == 0){
							self._on_running(false);
						}
					}
				  
				});
			  });
		},

		/*
		Computes axioms for each axiom type in a single server request.
		 */
		_compute_axioms_one_request : function() {
			var data = this._get_url_parameters();
			var service_url = this.options.service_url;
			self._on_running(true);
			var axiom_types = '';
			$('tbody input[@type=checkbox]:checked').each(function() {
				axiom_types += $(this).val() + ',';
				currentAxiomTypes.push($(this).val());
			});
			axiom_types = axiom_types.slice(0, -1); // remove last comma
			data += '&axiom_types=' + axiom_types;
			// send request
			jQuery.ajax({
				url : service_url,
				type : "GET",
				data : data,
				dataType : "jsonp",
				jsonp : 'jsonp_callback',
				success : function(data) {
					self._showTables(data);
				},
				error : function() {
					console.log('Error!');
				}

			});
		},

		/*
		Show the learned axioms in tables on the result panel. We use jQuery EasyUI for now to create tables with some functionality.
		 */
		_showTables : function(data) {
			jQuery.each( data.result, function( index, axiom_type_list){
		    	var axiom_type = axiom_type_list.axiom_type;
		    	var axioms = axiom_type_list.axioms;
		    	var key, count = 0;
		    	for(key in axioms) {//count the number of learned axioms
		    	  count++;
		    	}
		    	//show table only if there exist some learned axioms
		    	if(count > 0){
		    		visible_axiom_types.push(axiom_type);
		    		$('#results').append('<div id="' + axiom_type + '_view" class="axiom_panel">' + axiom_type + ' Axioms</div>');
					$('#' + axiom_type + '_view').append('<table id="' + axiom_type + '"></table>');
					//for each axiom type in the JSON object create a table object with columns 'accuracy' and 'axiom'
					var tableElement = $('#' + axiom_type)
		        	tableElement.datagrid({
		        	    columns:[[  
							{field:'ck',checkbox:true},
		        	        {field:'confidence',title:'Accuracy',width:100,sortable:true,
		        	        	formatter: self._format_accuracy
							},  
		        	        {field:'axiom_rendered',title:'Axiom',
		        	        	formatter: self._format_axiom
		        	        },  
		        	    ]]  
		        	});  
					tableElement.datagrid('loadData',axioms);
		    	}
		    });
		},

		_get_colored : function(rendered_axiom){
			var tokens = rendered_axiom.split(" ");
			var colored_string = '';
			for(var i = 0; i < tokens.length; i++){
				var token = tokens[i];
				var token_end = '';
				if(token[token.length-1] == ':'){
					token_end = ':';
					token = token.slice(0, -1);
				}
				if(axiom_constructs.indexOf(token) != -1){
					colored_string += '<b style="color:green;">' + token + token_end + '</b> ';
				} else if(boolean_constructs.indexOf(token) != -1){
					colored_string += '<b style="color:blue;">' + token + token_end + '</b> ';
				} else if(other_constructs.indexOf(token) != -1){
					colored_string += '<b style="color:magenta;">' + token + token_end + '</b> ';
				} else {
					colored_string += token + ' ';
				}
			}
			return colored_string;
		},

		/*
		Escape string.
		 */
		_html_escape : function(str) {
			return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');
		},

		_show_all_axiom_types : function() {
			$('#axiom_types table').each(function(){
				$(this).hide();
			});
			$("#all_axiom_types_table").show();
		},

		_show_class_axiom_types : function() {
			$('#axiom_types table').each(function(){
				$(this).hide();
			});
			$("#class_axiom_types_table").show();
		},

		_show_object_property_axiom_types : function() {
			$('#axiom_types table').each(function(){
				$(this).hide();
			});
			$("#objectproperty_axiom_types_table").show();
		},

		_show_data_property_axiom_types : function() {
			$('#axiom_types table').each(function(){
				$(this).hide();
			});
			$("#dataproperty_axiom_types_table").show();
		},

		_initEntityTypeDetection : function() {
			$('[name="type"]').each(function() {
				$(this).attr("disabled", !$(this).attr("disabled"));
			});
			$("#axiom_types_table tbody").children().remove();//clear table
			if ($('#autodetect:checked').val()) {//if autodetection is selected show all axiom types
				self._show_all_axiom_types();
			} else {//show only the axiom types for the selected entity type
				if ($('#class:checked').val()) {
					self._show_class_axiom_types();
				} else if ($('#object_property:checked').val()) {
					self._show_object_property_axiom_types();
				} else if ($('#data_property:checked').val()) {
					self._show_data_property_axiom_types();
				}
			}

		},

		/*
		If running make the mouse cursor 'busy' and disable the 'Run' button, else vice versa.
		*/
		_on_running : function(running){
			this._cursor_wait(running);
			if(running){
				$('#start_button').attr('disabled','disabled');
			} else {
				$('#start_button').removeAttr("disabled");
			}
			
		},

		_cursor_wait : function(wait) {
			if(wait){
				$("*").css("cursor", "wait");
			} else {
				$("*").css("cursor", "default");
			}
		},
		
		_format_accuracy : function(value){
			return Math.round(value*100*100)/100;
		},
		
		_format_axiom : function(val, row){
			return self._get_colored(val);
		},
		
		_get_colored : function(rendered_axiom){
			var tokens = rendered_axiom.split(" ");
			var colored_string = '';
			for(var i = 0; i < tokens.length; i++){
				var token = tokens[i];
				var token_end = '';
				if(token[token.length-1] == ':'){
					token_end = ':';
					token = token.slice(0, -1);
				}
				if(axiom_constructs.indexOf(token) != -1){
					colored_string += '<b style="color:green;">' + token + token_end + '</b> ';
				} else if(boolean_constructs.indexOf(token) != -1){
					colored_string += '<b style="color:blue;">' + token + token_end + '</b> ';
				} else if(other_constructs.indexOf(token) != -1){
					colored_string += '<b style="color:magenta;">' + token + token_end + '</b> ';
				} else {
					colored_string += token + ' ';
				}
			}
			return colored_string;
		}
	});

})(jQuery);
