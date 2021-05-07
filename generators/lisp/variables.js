/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Lisp for variable blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Lisp.variables');

goog.require('Blockly.Lisp');


Blockly.Lisp['variables_get'] = function(block) {
  // Variable getter.
  var code = Blockly.Lisp.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.VARIABLE_CATEGORY_NAME);
  return [code, Blockly.Lisp.ORDER_ATOMIC];
};

Blockly.Lisp['variables_set'] = function(block) {
  // Variable setter.
  var argument0 = Blockly.Lisp.valueToCode(block, 'VALUE',
      Blockly.Lisp.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Lisp.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.VARIABLE_CATEGORY_NAME);
  return varName + ' = ' + argument0 + ';\n';
};
