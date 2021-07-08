/**
 * @license
 * Visual Blocks Language
 *
 * Copyright 2014 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Lisp for Widget blocks.
 * @author luppy@appkaki.com (Lee Lup Yuen)
 */
'use strict';

goog.provide('Blockly.Lisp.widgets');

goog.require('Blockly.Lisp');

Blockly.Lisp['widgets_defreturn'] = function(block) {
  // Define a Widget event with a return value.
  var widgetName = Blockly.Lisp.variableDB_.getName(block.getFieldValue('NAME'),
    Blockly.Procedures.NAME_TYPE);  //  e.g. my_label

  var branch = Blockly.Lisp.statementToCode(block, 'STACK');
  if (Blockly.Lisp.STATEMENT_PREFIX) {
    var id = block.id.replace(/\$/g, '$$$$');  // Issue 251.
    branch = Blockly.Lisp.prefixLines(
        Blockly.Lisp.STATEMENT_PREFIX.replace(/%1/g,
        '\'' + id + '\''), Blockly.Lisp.INDENT) + branch;
  }
  if (Blockly.Lisp.INFINITE_LOOP_TRAP) {
    branch = Blockly.Lisp.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + block.id + '\'') + branch;
  }

  //  Get the return value and return type
  var returnValue = Blockly.Lisp.valueToCode(block, 'RETURN',
      Blockly.Lisp.ORDER_NONE) || '';
  var returnType = returnValue ? 'dynamic' : 'void';

  //  Get the event name, event description and return type
  var eventName = returnValue ? 'show' : 'press';  //  TODO
  var desc = '';
  switch(eventName) {  //  TODO
    case 'show':
      returnType = 'ArgValue';
      desc = '/// Callback function that will be called to create the formatted text for the label `' + widgetName + '`';
      break;
    case 'press':
      returnType = 'void';
      desc = '/// Callback function that will be called when the button `' + widgetName + '` is pressed';
      break;
  }
  returnValue = Blockly.Lisp.INDENT + 'Ok(' + (returnValue || '()') + ')\n';

  //  Get the function name
  var funcName = ['on', widgetName, eventName].join('_');  //  e.g. on_my_label_show
  funcName = funcName.split('__').join('::');  //  TODO: Convert sensor__func to sensor::func

  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    //  Assemble the args and give them placeholder types: `arg1: _`
    args[i] = Blockly.Lisp.variableDB_.getName(block.arguments_[i],
        Blockly.Variables.NAME_TYPE) + ': _';
  }
  var code;
  if (funcName.indexOf('::') >= 0) {
    //  System function: Do nothing
    //  Previously: code = '//  Import ' + funcName;
    return null;
  } else {
    //  User-defined function: Define the function
    code = [
      desc + '\n',
      //  Set the `infer_type` attribute so that the `infer_type` macro will infer the placeholder types.
      '#[infer_type]  //  Infer the missing types\n',
      'fn ', funcName,
      '(', 
        args.join(', '),
      ') ',
      '-> MynewtResult<', 
      returnType == 'void' ? '()' : returnType, 
      '> ',
      '{\n',
      Blockly.Lisp.INDENT, 'console::print("', funcName, '\\n");\n',
      branch,
      returnValue,
      '}'
    ].join('');  
  }
  code = Blockly.Lisp.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  Blockly.Lisp.definitions_['%' + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.Lisp['widgets_defnoreturn'] = Blockly.Lisp['widgets_defreturn'];

Blockly.Lisp['widgets_callreturn'] = function(block) {
  //  Call a procedure with a return value.
  var funcName = Blockly.Lisp.variableDB_.getName(block.getFieldValue('NAME'),
    Blockly.Procedures.NAME_TYPE);
  funcName = funcName.split('__').join('::');  //  TODO: Convert sensor__func to sensor::func
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.Lisp.valueToCode(block, 'ARG' + i,
      Blockly.Lisp.ORDER_NONE) || 'null';
    //  If function is `sensor::new_sensor_listener`, convert the third arg from string to function name, e.g.
    //  sensor::new_sensor_listener(sensor_key, sensor_type, "handle_sensor_data") becomes
    //  sensor::new_sensor_listener(sensor_key, sensor_type, handle_sensor_data) 
    //  TODO: Need a better solution.
    if (funcName === 'sensor::new_sensor_listener' && i === 2) {
      args[i] = args[i].split('"').join('');
    }
  }
  //  Generate the function call.
  var code = funcName + '(' + args.join(', ') + ') ? ';

  //  If function is `sensor_network::get_device_id`, return a reference: `&sensor_network::get_device_id`
  //  TODO: `get_device_id` should return a reference
  if (funcName === 'sensor_network::get_device_id') {
    code = '&' + code;
  }
  return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['widgets_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  var funcName = Blockly.Lisp.variableDB_.getName(block.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);  //  e.g. my_button
  funcName = funcName.split('__').join('::');  //  TODO: Convert sensor__func to sensor::func
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.Lisp.valueToCode(block, 'ARG' + i,
        Blockly.Lisp.ORDER_NONE) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ') ? ;\n';
  return code;
};

Blockly.Lisp['widgets_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  var condition = Blockly.Lisp.valueToCode(block, 'CONDITION',
      Blockly.Lisp.ORDER_NONE) || 'false';
  var code = 'if ' + condition + ' {\n';
  if (block.hasReturnValue_) {
    var value = Blockly.Lisp.valueToCode(block, 'VALUE',
        Blockly.Lisp.ORDER_NONE) || 'null';
    code += Blockly.Lisp.INDENT + 'return ' + value + ';\n';
  } else {
    code += Blockly.Lisp.INDENT + 'return;\n';
  }
  code += '}\n';
  return code;
};
