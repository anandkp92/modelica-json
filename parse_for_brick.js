const fs = require('fs')
const rdflib = require('rdflib')
var model_elements = {}
var model_equations = {}

file = 'Buildings.Examples.VAVReheat.Guideline36.json'
//file = 'Buildings.Examples.VAVReheat.BaseClasses.PartialOpenLoop.json'

function get_model_elements(file, model_elements, equations) {
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
for (var key in equations) {
	equation_type_list = equations[key]
	//console.log(equation_type_list)	
	for (var equation_idx in equation_type_list) {
		equation_dict = equation_type_list[equation_idx]
		if ('equation' in equation_dict) {
			for (var connect_idx in equation_dict.equation) {
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

const fluid_sensor_brick_map = {
	'TemperatureTwoPort': ':Temperature_Sensor',
	'Temperature': ':Temperature_Sensor',
	'RelativeTemperature': ':Temperature_Sensor',
	'TemperatureWetBulbTwoPort': ':Temperature_Sensor',
	'VolumeFlowRate': ':Flow_Sensor',
	'RelativeHumidityTwoPort': ':Humidity_Sensor',
	'RelativeHumidity': ':Humidity_Sensor',
	'Pressure': ':Pressure_Sensor',
	'RelativePressure': ':Pressure_Sensor'
}

function get_type(component) {
	return component.type_specifier
}

function get_brick_type(component) {
	if (typeof component.brick_type === 'undefined') {
		return false
	}
	else {
		return component.brick_type
	}
}

var model_elements_brick = {}
for (var key in model_elements) { 
	var model_element = model_elements[key]
	var model_element_type = model_element.type_specifier
	// console.log(key+" type: "+model_element_type)
	if (model_element_type.startsWith("Buildings")) {
		model_element_type = model_element_type.substring(10)
	}
	var model_element_type_split = model_element_type.split('.')

	if (model_element_type_split[0] === 'Controls') {
		// console.log("controller "+key+": "+model_element_type)
	}
	else if (model_element_type_split[0] === 'Fluid') {
		if (model_element_type_split[1] === 'Sensors') {
			var_sensor_type = model_element_type_split[2]
			// console.log("fluid sensors "+key+": brick"+fluid_sensor_brick_map[var_sensor_type])
			model_elements[key]['brick_type'] = fluid_sensor_brick_map[var_sensor_type]
		}
	}
	else {
		// console.log("unclassified "+key+ " type: "+model_element_type)
	}
}

routing_type_list = ["Modelica.Blocks.Routing.RealPassThrough", "Modelica.Blocks.Routing.Multiplex5"]

for (key in model_equations) {
	var comp1_variable = key.split(',')[0].split('[')[0]
	var comp2_variable = model_equations[key][0].split('[')[0]
	//console.log(comp1+": "+get_type(model_elements[comp1]))
	//console.log(comp2+": "+get_type(model_elements[comp2]))

	var comp1 = model_elements[comp1_variable]
	var comp2 = model_elements[comp2_variable]

	if (get_brick_type(comp1) && get_brick_type(comp2)) {
		// console.log("brick for both")
		// console.log(comp1_variable+": "+get_type(comp1))
		// console.log(comp2_variable+": "+get_type(comp2))
		// console.log()
	}
	else if (routing_type_list.includes(get_type(comp1)) && get_brick_type(comp2)) {
		model_elements[comp1_variable]['brick_type'] = get_brick_type(comp2)
		// console.log(comp1_variable+": "+get_type(comp1))
		// console.log(comp2_variable+": "+get_type(comp2))
	}
	else if (routing_type_list.includes(get_type(comp2)) && get_brick_type(comp1)) {
		model_elements[comp2_variable]['brick_type'] = get_brick_type(comp1)
		// console.log(comp1_variable+": "+get_brick_type(comp1))
		// console.log(comp2_variable+": "+get_type(comp2))
	}
	else if (get_type(comp2) == "Modelica.Blocks.Routing.DeMultiplex5") {
		// model_elements[comp2_variable]['brick_type'] = get_brick_type(comp1)
		// console.log(comp1_variable+": "+get_brick_type(comp1))
		// console.log(comp1_variable+": "+get_type(comp1))
		// console.log(comp2_variable+": "+get_type(comp2))
	}
	else {
		// console.log(comp1_variable+": "+get_type(comp1))
		// console.log(comp2_variable+": "+get_type(comp2))
	}
}

console.log("************************************************************************************************************************************")

for (key in model_equations) {
	var comp1_variable = key.split(',')[0].split('[')[0]
	var comp2_variable = model_equations[key][0].split('[')[0]
	//console.log(comp1+": "+get_type(model_elements[comp1]))
	//console.log(comp2+": "+get_type(model_elements[comp2]))

	var comp1 = model_elements[comp1_variable]
	var comp2 = model_elements[comp2_variable]

	if (get_brick_type(comp1) && get_brick_type(comp2)) {
		console.log("\nbrick for both")
		console.log(comp1_variable+": "+get_type(comp1)+ " "+get_brick_type(comp1))
		console.log(comp2_variable+": "+get_type(comp2)+ " "+get_brick_type(comp2))
		console.log()
	}
	else if (get_brick_type(comp2)) {
		console.log("\nbrick for one")
		console.log(comp1_variable+": "+get_type(comp1))
		console.log(comp2_variable+": "+get_type(comp2)+ " " +get_brick_type(comp2))
		console.log()
		// model_elements[comp1_variable]['brick_type'] = get_brick_type(comp2)
	}
	else if (get_brick_type(comp1)) {
		console.log("\nbrick for one-2")
		console.log(comp1_variable+": "+get_type(comp1)+ " " +get_brick_type(comp1))
		console.log(comp2_variable+": "+get_type(comp2))
		console.log()
		// model_elements[comp2_variable]['brick_type'] = get_brick_type(comp1)
	}
	else {
		console.log(comp1_variable+": "+get_type(comp1))
		console.log(comp2_variable+": "+get_type(comp2))
	}
}