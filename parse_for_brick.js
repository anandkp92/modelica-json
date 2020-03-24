const fs = require('fs')
var model_elements = {}
var model_equations = {}

file = 'Buildings.Examples.VAVReheat.Guideline36.json'
//file = 'Buildings.Examples.VAVReheat.BaseClasses.PartialOpenLoop.json'

function get_model_elements(file, model_elements, equations) {
	console.log(file)
	console.log(model_elements)
	var contents = fs.readFileSync('./raw-json/'+file);
	var jsonContent = JSON.parse(contents);
	var rawjson = jsonContent[0]
	class_specifiers = rawjson.class_definition[0].class_specifier
	elements = {}
	//equations = {}

	if ('long_class_specifier' in class_specifiers) {
		if ('composition' in class_specifiers.long_class_specifier) {
			composition = class_specifiers.long_class_specifier.composition

			for (key in composition) {
				if (key == 'element_list') {
					//elements['element_list'] = list of one dictionary with key 'element'
					elements[file+"."+key] = [composition[key]]
				}
				else if (key == 'prefixed_element') {
					//elements['prefixed_element'] = list of dictionaries, each with key 'element'
					elements[file+"."+key] = composition[key]
				}
				else if (key == 'equation_section') {
					//elements['equation_section'] = list of dictionaries, each might have a connect clause
					equations[file+"."+key] = composition[key]
				}
			}
		}
	}
	else if ('short_class_specifier' in class_specifiers) {
		console.log('short class specifier')
		//elements = class_specifiers.long_class_specifier.composition.element_list
	}
	else if ('der_class_specifier' in class_specifiers) {
		console.log('der class specifier')
		//elements = class_specifiers.long_class_specifier.composition.element_list
	}

	//console.log(elements['element_list'][0].element)
	
	for(key in elements) {
		var element_type_list = elements[key]
		for (element_idx in element_type_list) {
			var element = element_type_list[element_idx].element
			for (component_idx in element) {
				var component_dict = element[component_idx]
				if ('component_clause' in component_dict) {
					var component_obj = component_dict['component_clause']
					if ('type_specifier' in component_obj) {
						var component_name = component_obj.component_list.component_declaration[0].declaration.name
						//console.log(component_name)
						if (component_name in model_elements) {
							//console.log(component_name+" already exists")
						}
						//console.log(file+" inside")
						model_elements[component_name] = component_obj
					}
				}
				else if ('class_definition' in component_dict) {
					//console.log('class_definition')
					//console.log(component.class_definition)
				}
				else if ('extends_clause' in component_dict) {
					var extends_file = component_dict.extends_clause.name

					if (extends_file.startsWith("Buildings.Examples.VAVReheat")) {
						var return_values = get_model_elements(extends_file+".json", model_elements, equations)
						model_elements = return_values[0]
						equations = return_values[1]
					}
				}
			}
			//console.log(elemenIt_idx)
		}
	}

	//console.log(equations)

	return [model_elements, equations]

}
equations = {}
var return_values = get_model_elements(file, model_elements, equations)
model_elements = return_values[0]
equations = return_values[1]
for (key in equations) {
	equation_type_list = equations[key]
	//console.log(equation_type_list)	
	for (equation_idx in equation_type_list) {
		equation_dict = equation_type_list[equation_idx]
		if ('equation' in equation_dict) {
			for (connect_idx in equation_dict.equation) {
				connect_dict = equation_dict.equation[connect_idx]
				//console.log(connect_dict)
				if ('connect_clause' in connect_dict) {
					connect_obj = connect_dict['connect_clause']
					comp1 = connect_obj['component1']
					comp2 = connect_obj['component2']
					if (comp1[0].split('[')[0] in model_elements) {
						//console.log("found "+comp1[0])
					}
					else {
						console.log("not found "+comp1[0])
					}
					if (comp2[0].split('[')[0] in model_elements) {
						//console.log("found "+comp2[0])
					}
					else {
						console.log("not found "+comp2[0])
					}
					//console.log(comp1+" -> "+comp2)
					model_equations[comp1] = comp2
				}
			}
		}
	}
}
console.log("\nComponent List:")
console.log(model_elements)
console.log("\nConnect List:")
console.log(model_equations)
