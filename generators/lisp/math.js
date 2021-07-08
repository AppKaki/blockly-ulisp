/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Lisp for math blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

goog.provide('Blockly.Lisp.math');

goog.require('Blockly.Lisp');


Blockly.Lisp.addReservedWords('Math');

Blockly.Lisp['math_number'] = function(block) {
  // Numeric value.
  var code = Number(block.getFieldValue('NUM'));
  var order;
  if (code == Infinity) {
    code = 'double.infinity';
    order = Blockly.Lisp.ORDER_UNARY_POSTFIX;
  } else if (code == -Infinity) {
    code = '-double.infinity';
    order = Blockly.Lisp.ORDER_UNARY_PREFIX;
  } else {
    // -4.abs() returns -4 in Lisp due to strange order of operation choices.
    // -4 is actually an operator and a number.  Reflect this in the order.
    order = code < 0 ?
        Blockly.Lisp.ORDER_UNARY_PREFIX : Blockly.Lisp.ORDER_ATOMIC;
  }
  return [code, order];
};

Blockly.Lisp['math_arithmetic'] = function(block) {
  // Basic arithmetic operators, and power.
  var OPERATORS = {
    'ADD': [' + ', Blockly.Lisp.ORDER_ADDITIVE],
    'MINUS': [' - ', Blockly.Lisp.ORDER_ADDITIVE],
    'MULTIPLY': [' * ', Blockly.Lisp.ORDER_MULTIPLICATIVE],
    'DIVIDE': [' / ', Blockly.Lisp.ORDER_MULTIPLICATIVE],
    'POWER': [null, Blockly.Lisp.ORDER_NONE]  // Handle power separately.
  };
  var tuple = OPERATORS[block.getFieldValue('OP')];
  var operator = tuple[0];
  var order = tuple[1];
  var argument0 = Blockly.Lisp.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.Lisp.valueToCode(block, 'B', order) || '0';
  var code;
  // Power in Lisp requires a special case since it has no operator.
  if (!operator) {
    Blockly.Lisp.definitions_['import_lisp_math'] =
        'import \'lisp:math\' as Math;';
    code = 'Math.pow(' + argument0 + ', ' + argument1 + ')';
    return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
  }
  code = argument0 + operator + argument1;
  return [code, order];
};

Blockly.Lisp['math_single'] = function(block) {
  // Math operators with single operand.
  var operator = block.getFieldValue('OP');
  var code;
  var arg;
  if (operator == 'NEG') {
    // Negation is a special case given its different operator precedence.
    arg = Blockly.Lisp.valueToCode(block, 'NUM',
        Blockly.Lisp.ORDER_UNARY_PREFIX) || '0';
    if (arg[0] == '-') {
      // --3 is not legal in Lisp.
      arg = ' ' + arg;
    }
    code = '-' + arg;
    return [code, Blockly.Lisp.ORDER_UNARY_PREFIX];
  }
  Blockly.Lisp.definitions_['import_lisp_math'] =
      'import \'lisp:math\' as Math;';
  if (operator == 'ABS' || operator.substring(0, 5) == 'ROUND') {
    arg = Blockly.Lisp.valueToCode(block, 'NUM',
        Blockly.Lisp.ORDER_UNARY_POSTFIX) || '0';
  } else if (operator == 'SIN' || operator == 'COS' || operator == 'TAN') {
    arg = Blockly.Lisp.valueToCode(block, 'NUM',
        Blockly.Lisp.ORDER_MULTIPLICATIVE) || '0';
  } else {
    arg = Blockly.Lisp.valueToCode(block, 'NUM',
        Blockly.Lisp.ORDER_NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = arg + '.abs()';
      break;
    case 'ROOT':
      code = 'Math.sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'Math.log(' + arg + ')';
      break;
    case 'EXP':
      code = 'Math.exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'Math.pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = arg + '.round()';
      break;
    case 'ROUNDUP':
      code = arg + '.ceil()';
      break;
    case 'ROUNDDOWN':
      code = arg + '.floor()';
      break;
    case 'SIN':
      code = 'Math.sin(' + arg + ' / 180 * Math.pi)';
      break;
    case 'COS':
      code = 'Math.cos(' + arg + ' / 180 * Math.pi)';
      break;
    case 'TAN':
      code = 'Math.tan(' + arg + ' / 180 * Math.pi)';
      break;
  }
  if (code) {
    return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'LOG10':
      code = 'Math.log(' + arg + ') / Math.log(10)';
      break;
    case 'ASIN':
      code = 'Math.asin(' + arg + ') / Math.pi * 180';
      break;
    case 'ACOS':
      code = 'Math.acos(' + arg + ') / Math.pi * 180';
      break;
    case 'ATAN':
      code = 'Math.atan(' + arg + ') / Math.pi * 180';
      break;
    default:
      throw Error('Unknown math operator: ' + operator);
  }
  return [code, Blockly.Lisp.ORDER_MULTIPLICATIVE];
};

Blockly.Lisp['math_constant'] = function(block) {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  var CONSTANTS = {
    'PI': ['Math.pi', Blockly.Lisp.ORDER_UNARY_POSTFIX],
    'E': ['Math.e', Blockly.Lisp.ORDER_UNARY_POSTFIX],
    'GOLDEN_RATIO':
        ['(1 + Math.sqrt(5)) / 2', Blockly.Lisp.ORDER_MULTIPLICATIVE],
    'SQRT2': ['Math.sqrt2', Blockly.Lisp.ORDER_UNARY_POSTFIX],
    'SQRT1_2': ['Math.sqrt1_2', Blockly.Lisp.ORDER_UNARY_POSTFIX],
    'INFINITY': ['double.infinity', Blockly.Lisp.ORDER_ATOMIC]
  };
  var constant = block.getFieldValue('CONSTANT');
  if (constant != 'INFINITY') {
    Blockly.Lisp.definitions_['import_lisp_math'] =
        'import \'lisp:math\' as Math;';
  }
  return CONSTANTS[constant];
};

Blockly.Lisp['math_number_property'] = function(block) {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  var number_to_check = Blockly.Lisp.valueToCode(block, 'NUMBER_TO_CHECK',
      Blockly.Lisp.ORDER_MULTIPLICATIVE);
  if (!number_to_check) {
    return ['false', Blockly.Lisp.ORDER_ATOMIC];
  }
  var dropdown_property = block.getFieldValue('PROPERTY');
  var code;
  if (dropdown_property == 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    Blockly.Lisp.definitions_['import_lisp_math'] =
        'import \'lisp:math\' as Math;';
    var functionName = Blockly.Lisp.provideFunction_(
        'math_isPrime',
        ['bool ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ + '(n) {',
         '  // https://en.wikipedia.org/wiki/Primality_test#Naive_methods',
         '  if (n == 2 || n == 3) {',
         '    return true;',
         '  }',
         '  // False if n is null, negative, is 1, or not whole.',
         '  // And false if n is divisible by 2 or 3.',
         '  if (n == null || n <= 1 || n % 1 != 0 || n % 2 == 0 ||' +
            ' n % 3 == 0) {',
         '    return false;',
         '  }',
         '  // Check all the numbers of form 6k +/- 1, up to sqrt(n).',
         '  for (var x = 6; x <= Math.sqrt(n) + 1; x += 6) {',
         '    if (n % (x - 1) == 0 || n % (x + 1) == 0) {',
         '      return false;',
         '    }',
         '  }',
         '  return true;',
         '}']);
    code = functionName + '(' + number_to_check + ')';
    return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
  }
  switch (dropdown_property) {
    case 'EVEN':
      code = number_to_check + ' % 2 == 0';
      break;
    case 'ODD':
      code = number_to_check + ' % 2 == 1';
      break;
    case 'WHOLE':
      code = number_to_check + ' % 1 == 0';
      break;
    case 'POSITIVE':
      code = number_to_check + ' > 0';
      break;
    case 'NEGATIVE':
      code = number_to_check + ' < 0';
      break;
    case 'DIVISIBLE_BY':
      var divisor = Blockly.Lisp.valueToCode(block, 'DIVISOR',
          Blockly.Lisp.ORDER_MULTIPLICATIVE);
      if (!divisor) {
        return ['false', Blockly.Lisp.ORDER_ATOMIC];
      }
      code = number_to_check + ' % ' + divisor + ' == 0';
      break;
  }
  return [code, Blockly.Lisp.ORDER_EQUALITY];
};

Blockly.Lisp['math_change'] = function(block) {
  // Add to a variable in place.
  var argument0 = Blockly.Lisp.valueToCode(block, 'DELTA',
      Blockly.Lisp.ORDER_ADDITIVE) || '0';
  var varName = Blockly.Lisp.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.VARIABLE_CATEGORY_NAME);
  return varName + ' = (' + varName + ' is num ? ' + varName + ' : 0) + ' +
      argument0 + ';\n';
};

// Rounding functions have a single operand.
Blockly.Lisp['math_round'] = Blockly.Lisp['math_single'];
// Trigonometry functions have a single operand.
Blockly.Lisp['math_trig'] = Blockly.Lisp['math_single'];

Blockly.Lisp['math_on_list'] = function(block) {
  // Math functions for lists.
  var func = block.getFieldValue('OP');
  var list = Blockly.Lisp.valueToCode(block, 'LIST',
      Blockly.Lisp.ORDER_NONE) || '[]';
  var code;
  switch (func) {
    case 'SUM':
      var functionName = Blockly.Lisp.provideFunction_(
          'math_sum',
          ['num ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
              '(List<num> myList) {',
           '  num sumVal = 0;',
           '  myList.forEach((num entry) {sumVal += entry;});',
           '  return sumVal;',
           '}']);
      code = functionName + '(' + list + ')';
      break;
    case 'MIN':
      Blockly.Lisp.definitions_['import_lisp_math'] =
          'import \'lisp:math\' as Math;';
      var functionName = Blockly.Lisp.provideFunction_(
          'math_min',
          ['num ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
              '(List<num> myList) {',
           '  if (myList.isEmpty) return null;',
           '  num minVal = myList[0];',
           '  myList.forEach((num entry) ' +
              '{minVal = Math.min(minVal, entry);});',
           '  return minVal;',
           '}']);
      code = functionName + '(' + list + ')';
      break;
    case 'MAX':
      Blockly.Lisp.definitions_['import_lisp_math'] =
          'import \'lisp:math\' as Math;';
      var functionName = Blockly.Lisp.provideFunction_(
          'math_max',
          ['num ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
              '(List<num> myList) {',
           '  if (myList.isEmpty) return null;',
           '  num maxVal = myList[0];',
           '  myList.forEach((num entry) ' +
              '{maxVal = Math.max(maxVal, entry);});',
           '  return maxVal;',
           '}']);
      code = functionName + '(' + list + ')';
      break;
    case 'AVERAGE':
      // This operation exclude null and values that are not int or float:
      //   math_mean([null,null,"aString",1,9]) == 5.0.
      var functionName = Blockly.Lisp.provideFunction_(
          'math_mean',
          ['num ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
              '(List myList) {',
           '  // First filter list for numbers only.',
           '  List localList = new List.from(myList);',
           '  localList.removeWhere((a) => a is! num);',
           '  if (localList.isEmpty) return null;',
           '  num sumVal = 0;',
           '  localList.forEach((var entry) {sumVal += entry;});',
           '  return sumVal / localList.length;',
           '}']);
      code = functionName + '(' + list + ')';
      break;
    case 'MEDIAN':
      var functionName = Blockly.Lisp.provideFunction_(
          'math_median',
          ['num ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
              '(List myList) {',
           '  // First filter list for numbers only, then sort, ' +
              'then return middle value',
           '  // or the average of two middle values if list has an ' +
              'even number of elements.',
           '  List localList = new List.from(myList);',
           '  localList.removeWhere((a) => a is! num);',
           '  if (localList.isEmpty) return null;',
           '  localList.sort((a, b) => (a - b));',
           '  int index = localList.length ~/ 2;',
           '  if (localList.length % 2 == 1) {',
           '    return localList[index];',
           '  } else {',
           '    return (localList[index - 1] + localList[index]) / 2;',
           '  }',
           '}']);
      code = functionName + '(' + list + ')';
      break;
    case 'MODE':
      Blockly.Lisp.definitions_['import_lisp_math'] =
          'import \'lisp:math\' as Math;';
      // As a list of numbers can contain more than one mode,
      // the returned result is provided as an array.
      // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1].
      var functionName = Blockly.Lisp.provideFunction_(
          'math_modes',
          ['List ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
              '(List values) {',
           '  List modes = [];',
           '  List counts = [];',
           '  int maxCount = 0;',
           '  for (int i = 0; i < values.length; i++) {',
           '    var value = values[i];',
           '    bool found = false;',
           '    int thisCount;',
           '    for (int j = 0; j < counts.length; j++) {',
           '      if (counts[j][0] == value) {',
           '        thisCount = ++counts[j][1];',
           '        found = true;',
           '        break;',
           '      }',
           '    }',
           '    if (!found) {',
           '      counts.add([value, 1]);',
           '      thisCount = 1;',
           '    }',
           '    maxCount = Math.max(thisCount, maxCount);',
           '  }',
           '  for (int j = 0; j < counts.length; j++) {',
           '    if (counts[j][1] == maxCount) {',
           '        modes.add(counts[j][0]);',
           '    }',
           '  }',
           '  return modes;',
           '}']);
      code = functionName + '(' + list + ')';
      break;
    case 'STD_DEV':
      Blockly.Lisp.definitions_['import_lisp_math'] =
          'import \'lisp:math\' as Math;';
      var functionName = Blockly.Lisp.provideFunction_(
          'math_standard_deviation',
          ['num ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
              '(List myList) {',
           '  // First filter list for numbers only.',
           '  List numbers = new List.from(myList);',
           '  numbers.removeWhere((a) => a is! num);',
           '  if (numbers.isEmpty) return null;',
           '  num n = numbers.length;',
           '  num sum = 0;',
           '  numbers.forEach((x) => sum += x);',
           '  num mean = sum / n;',
           '  num sumSquare = 0;',
           '  numbers.forEach((x) => sumSquare += ' +
              'Math.pow(x - mean, 2));',
           '  return Math.sqrt(sumSquare / n);',
           '}']);
      code = functionName + '(' + list + ')';
      break;
    case 'RANDOM':
      Blockly.Lisp.definitions_['import_lisp_math'] =
          'import \'lisp:math\' as Math;';
      var functionName = Blockly.Lisp.provideFunction_(
          'math_random_item',
          ['dynamic ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
              '(List myList) {',
           '  int x = new Math.Random().nextInt(myList.length);',
           '  return myList[x];',
           '}']);
      code = functionName + '(' + list + ')';
      break;
    default:
      throw Error('Unknown operator: ' + func);
  }
  return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['math_modulo'] = function(block) {
  // Remainder computation.
  var argument0 = Blockly.Lisp.valueToCode(block, 'DIVIDEND',
      Blockly.Lisp.ORDER_MULTIPLICATIVE) || '0';
  var argument1 = Blockly.Lisp.valueToCode(block, 'DIVISOR',
      Blockly.Lisp.ORDER_MULTIPLICATIVE) || '0';
  var code = argument0 + ' % ' + argument1;
  return [code, Blockly.Lisp.ORDER_MULTIPLICATIVE];
};

Blockly.Lisp['math_constrain'] = function(block) {
  // Constrain a number between two limits.
  Blockly.Lisp.definitions_['import_lisp_math'] =
      'import \'lisp:math\' as Math;';
  var argument0 = Blockly.Lisp.valueToCode(block, 'VALUE',
      Blockly.Lisp.ORDER_NONE) || '0';
  var argument1 = Blockly.Lisp.valueToCode(block, 'LOW',
      Blockly.Lisp.ORDER_NONE) || '0';
  var argument2 = Blockly.Lisp.valueToCode(block, 'HIGH',
      Blockly.Lisp.ORDER_NONE) || 'double.infinity';
  var code = 'Math.min(Math.max(' + argument0 + ', ' + argument1 + '), ' +
      argument2 + ')';
  return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['math_random_int'] = function(block) {
  // Random integer between [X] and [Y].
  Blockly.Lisp.definitions_['import_lisp_math'] =
      'import \'lisp:math\' as Math;';
  var argument0 = Blockly.Lisp.valueToCode(block, 'FROM',
      Blockly.Lisp.ORDER_NONE) || '0';
  var argument1 = Blockly.Lisp.valueToCode(block, 'TO',
      Blockly.Lisp.ORDER_NONE) || '0';
  var functionName = Blockly.Lisp.provideFunction_(
      'math_random_int',
      ['int ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ + '(num a, num b) {',
       '  if (a > b) {',
       '    // Swap a and b to ensure a is smaller.',
       '    num c = a;',
       '    a = b;',
       '    b = c;',
       '  }',
       '  return new Math.Random().nextInt(b - a + 1) + a;',
       '}']);
  var code = functionName + '(' + argument0 + ', ' + argument1 + ')';
  return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['math_random_float'] = function(block) {
  // Random fraction between 0 and 1.
  Blockly.Lisp.definitions_['import_lisp_math'] =
      'import \'lisp:math\' as Math;';
  return ['new Math.Random().nextDouble()', Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['math_atan2'] = function(block) {
  // Arctangent of point (X, Y) in degrees from -180 to 180.
  Blockly.Lisp.definitions_['import_lisp_math'] =
      'import \'lisp:math\' as Math;';
  var argument0 = Blockly.Lisp.valueToCode(block, 'X',
      Blockly.Lisp.ORDER_NONE) || '0';
  var argument1 = Blockly.Lisp.valueToCode(block, 'Y',
      Blockly.Lisp.ORDER_NONE) || '0';
  return ['Math.atan2(' + argument1 + ', ' + argument0 + ') / Math.pi * 180',
      Blockly.Lisp.ORDER_MULTIPLICATIVE];
};
