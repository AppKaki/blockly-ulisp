/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Lisp for procedure blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Lisp.procedures');

goog.require('Blockly.Lisp');


Blockly.Lisp['procedures_defreturn'] = function(block) {
  // Define a procedure with a return value.
  var funcName = Blockly.Lisp.variableDB_.getName(block.getFieldValue('NAME'),
      Blockly.PROCEDURE_CATEGORY_NAME);
  var xfix1 = '';
  if (Blockly.Lisp.STATEMENT_PREFIX) {
    xfix1 += Blockly.Lisp.injectId(Blockly.Lisp.STATEMENT_PREFIX, block);
  }
  if (Blockly.Lisp.STATEMENT_SUFFIX) {
    xfix1 += Blockly.Lisp.injectId(Blockly.Lisp.STATEMENT_SUFFIX, block);
  }
  if (xfix1) {
    xfix1 = Blockly.Lisp.prefixLines(xfix1, Blockly.Lisp.INDENT);
  }
  var loopTrap = '';
  if (Blockly.Lisp.INFINITE_LOOP_TRAP) {
    loopTrap = Blockly.Lisp.prefixLines(
        Blockly.Lisp.injectId(Blockly.Lisp.INFINITE_LOOP_TRAP, block),
        Blockly.Lisp.INDENT);
  }
  var branch = Blockly.Lisp.statementToCode(block, 'STACK');
  var returnValue = Blockly.Lisp.valueToCode(block, 'RETURN',
      Blockly.Lisp.ORDER_NONE) || '';
  var xfix2 = '';
  if (branch && returnValue) {
    // After executing the function body, revisit this block for the return.
    xfix2 = xfix1;
  }
  if (returnValue) {
    returnValue = Blockly.Lisp.INDENT + 'return ' + returnValue + ';\n';
  }
  var returnType = returnValue ? 'dynamic' : 'void';
  var args = [];
  var variables = block.getVars();
  for (var i = 0; i < variables.length; i++) {
    args[i] = Blockly.Lisp.variableDB_.getName(variables[i],
        Blockly.VARIABLE_CATEGORY_NAME);
  }
  var code = returnType + ' ' + funcName + '(' + args.join(', ') + ') {\n' +
      xfix1 + loopTrap + branch + xfix2 + returnValue + '}';
  code = Blockly.Lisp.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  Blockly.Lisp.definitions_['%' + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.Lisp['procedures_defnoreturn'] = Blockly.Lisp['procedures_defreturn'];

Blockly.Lisp['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  var funcName = Blockly.Lisp.variableDB_.getName(block.getFieldValue('NAME'),
      Blockly.PROCEDURE_CATEGORY_NAME);
  var args = [];
  var variables = block.getVars();
  for (var i = 0; i < variables.length; i++) {
    args[i] = Blockly.Lisp.valueToCode(block, 'ARG' + i,
        Blockly.Lisp.ORDER_NONE) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  // Generated code is for a function call as a statement is the same as a
  // function call as a value, with the addition of line ending.
  var tuple = Blockly.Lisp['procedures_callreturn'](block);
  return tuple[0] + ';\n';
};

Blockly.Lisp['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  var condition = Blockly.Lisp.valueToCode(block, 'CONDITION',
      Blockly.Lisp.ORDER_NONE) || 'false';
  var code = 'if (' + condition + ') {\n';
  if (Blockly.Lisp.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the return is triggered.
    code += Blockly.Lisp.prefixLines(
        Blockly.Lisp.injectId(Blockly.Lisp.STATEMENT_SUFFIX, block),
        Blockly.Lisp.INDENT);
  }
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
