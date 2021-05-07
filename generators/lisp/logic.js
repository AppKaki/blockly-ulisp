/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Lisp for logic blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

goog.provide('Blockly.Lisp.logic');

goog.require('Blockly.Lisp');


Blockly.Lisp['controls_if'] = function(block) {
  // If/elseif/else condition.
  var n = 0;
  var code = '', branchCode, conditionCode;
  if (Blockly.Lisp.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block.  Add manually.
    code += Blockly.Lisp.injectId(Blockly.Lisp.STATEMENT_PREFIX, block);
  }
  do {
    conditionCode = Blockly.Lisp.valueToCode(block, 'IF' + n,
        Blockly.Lisp.ORDER_NONE) || 'false';
    branchCode = Blockly.Lisp.statementToCode(block, 'DO' + n);
    if (Blockly.Lisp.STATEMENT_SUFFIX) {
      branchCode = Blockly.Lisp.prefixLines(
          Blockly.Lisp.injectId(Blockly.Lisp.STATEMENT_SUFFIX, block),
          Blockly.Lisp.INDENT) + branchCode;
    }
    code += (n > 0 ? 'else ' : '') +
        'if (' + conditionCode + ') {\n' + branchCode + '}';
    ++n;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE') || Blockly.Lisp.STATEMENT_SUFFIX) {
    branchCode = Blockly.Lisp.statementToCode(block, 'ELSE');
    if (Blockly.Lisp.STATEMENT_SUFFIX) {
      branchCode = Blockly.Lisp.prefixLines(
          Blockly.Lisp.injectId(Blockly.Lisp.STATEMENT_SUFFIX, block),
          Blockly.Lisp.INDENT) + branchCode;
    }
    code += ' else {\n' + branchCode + '}';
  }
  return code + '\n';
};

Blockly.Lisp['controls_ifelse'] = Blockly.Lisp['controls_if'];

Blockly.Lisp['logic_compare'] = function(block) {
  // Comparison operator.
  var OPERATORS = {
    'EQ': '==',
    'NEQ': '!=',
    'LT': '<',
    'LTE': '<=',
    'GT': '>',
    'GTE': '>='
  };
  var operator = OPERATORS[block.getFieldValue('OP')];
  var order = (operator == '==' || operator == '!=') ?
      Blockly.Lisp.ORDER_EQUALITY : Blockly.Lisp.ORDER_RELATIONAL;
  var argument0 = Blockly.Lisp.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.Lisp.valueToCode(block, 'B', order) || '0';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Lisp['logic_operation'] = function(block) {
  // Operations 'and', 'or'.
  var operator = (block.getFieldValue('OP') == 'AND') ? '&&' : '||';
  var order = (operator == '&&') ? Blockly.Lisp.ORDER_LOGICAL_AND :
      Blockly.Lisp.ORDER_LOGICAL_OR;
  var argument0 = Blockly.Lisp.valueToCode(block, 'A', order);
  var argument1 = Blockly.Lisp.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // If there are no arguments, then the return value is false.
    argument0 = 'false';
    argument1 = 'false';
  } else {
    // Single missing arguments have no effect on the return value.
    var defaultArgument = (operator == '&&') ? 'true' : 'false';
    if (!argument0) {
      argument0 = defaultArgument;
    }
    if (!argument1) {
      argument1 = defaultArgument;
    }
  }
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Lisp['logic_negate'] = function(block) {
  // Negation.
  var order = Blockly.Lisp.ORDER_UNARY_PREFIX;
  var argument0 = Blockly.Lisp.valueToCode(block, 'BOOL', order) || 'true';
  var code = '!' + argument0;
  return [code, order];
};

Blockly.Lisp['logic_boolean'] = function(block) {
  // Boolean values true and false.
  var code = (block.getFieldValue('BOOL') == 'TRUE') ? 'true' : 'false';
  return [code, Blockly.Lisp.ORDER_ATOMIC];
};

Blockly.Lisp['logic_null'] = function(block) {
  // Null data type.
  return ['null', Blockly.Lisp.ORDER_ATOMIC];
};

Blockly.Lisp['logic_ternary'] = function(block) {
  // Ternary operator.
  var value_if = Blockly.Lisp.valueToCode(block, 'IF',
      Blockly.Lisp.ORDER_CONDITIONAL) || 'false';
  var value_then = Blockly.Lisp.valueToCode(block, 'THEN',
      Blockly.Lisp.ORDER_CONDITIONAL) || 'null';
  var value_else = Blockly.Lisp.valueToCode(block, 'ELSE',
      Blockly.Lisp.ORDER_CONDITIONAL) || 'null';
  var code = value_if + ' ? ' + value_then + ' : ' + value_else;
  return [code, Blockly.Lisp.ORDER_CONDITIONAL];
};
