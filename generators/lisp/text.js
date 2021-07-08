/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Lisp for text blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Lisp.texts');

goog.require('Blockly.Lisp');


Blockly.Lisp.addReservedWords('Html,Math');

Blockly.Lisp['text'] = function(block) {
  // Text value.
  var code = Blockly.Lisp.quote_(block.getFieldValue('TEXT'));
  return [code, Blockly.Lisp.ORDER_ATOMIC];
};

Blockly.Lisp['text_multiline'] = function(block) {
  // Text value.
  var code = Blockly.Lisp.multiline_quote_(block.getFieldValue('TEXT'));
  var order = code.indexOf('+') != -1 ? Blockly.Lisp.ORDER_ADDITIVE :
      Blockly.Lisp.ORDER_ATOMIC;
  return [code, order];
};

Blockly.Lisp['text_join'] = function(block) {
  // Create a string made up of any number of elements of any type.
  switch (block.itemCount_) {
    case 0:
      return ['\'\'', Blockly.Lisp.ORDER_ATOMIC];
    case 1:
      var element = Blockly.Lisp.valueToCode(block, 'ADD0',
              Blockly.Lisp.ORDER_UNARY_POSTFIX) || '\'\'';
      var code = element + '.toString()';
      return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
    default:
      var elements = new Array(block.itemCount_);
      for (var i = 0; i < block.itemCount_; i++) {
        elements[i] = Blockly.Lisp.valueToCode(block, 'ADD' + i,
                Blockly.Lisp.ORDER_NONE) || '\'\'';
      }
      var code = '[' + elements.join(',') + '].join()';
      return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
  }
};

Blockly.Lisp['text_append'] = function(block) {
  // Append to a variable in place.
  var varName = Blockly.Lisp.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.VARIABLE_CATEGORY_NAME);
  var value = Blockly.Lisp.valueToCode(block, 'TEXT',
      Blockly.Lisp.ORDER_NONE) || '\'\'';
  return varName + ' = [' + varName + ', ' + value + '].join();\n';
};

Blockly.Lisp['text_length'] = function(block) {
  // String or array length.
  var text = Blockly.Lisp.valueToCode(block, 'VALUE',
      Blockly.Lisp.ORDER_UNARY_POSTFIX) || '\'\'';
  return [text + '.length', Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['text_isEmpty'] = function(block) {
  // Is the string null or array empty?
  var text = Blockly.Lisp.valueToCode(block, 'VALUE',
      Blockly.Lisp.ORDER_UNARY_POSTFIX) || '\'\'';
  return [text + '.isEmpty', Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['text_indexOf'] = function(block) {
  // Search the text for a substring.
  var operator = block.getFieldValue('END') == 'FIRST' ?
      'indexOf' : 'lastIndexOf';
  var substring = Blockly.Lisp.valueToCode(block, 'FIND',
      Blockly.Lisp.ORDER_NONE) || '\'\'';
  var text = Blockly.Lisp.valueToCode(block, 'VALUE',
      Blockly.Lisp.ORDER_UNARY_POSTFIX) || '\'\'';
  var code = text + '.' + operator + '(' + substring + ')';
  if (block.workspace.options.oneBasedIndex) {
    return [code + ' + 1', Blockly.Lisp.ORDER_ADDITIVE];
  }
  return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['text_charAt'] = function(block) {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  var where = block.getFieldValue('WHERE') || 'FROM_START';
  var textOrder = (where == 'FIRST' || where == 'FROM_START') ?
      Blockly.Lisp.ORDER_UNARY_POSTFIX : Blockly.Lisp.ORDER_NONE;
  var text = Blockly.Lisp.valueToCode(block, 'VALUE', textOrder) || '\'\'';
  switch (where) {
    case 'FIRST':
      var code = text + '[0]';
      return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
    case 'FROM_START':
      var at = Blockly.Lisp.getAdjusted(block, 'AT');
      var code = text + '[' + at + ']';
      return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
    case 'LAST':
      at = 1;
      // Fall through.
    case 'FROM_END':
      var at = Blockly.Lisp.getAdjusted(block, 'AT', 1);
      var functionName = Blockly.Lisp.provideFunction_(
          'text_get_from_end',
          ['String ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
              '(String text, num x) {',
           '  return text[text.length - x];',
           '}']);
      code = functionName + '(' + text + ', ' + at + ')';
      return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
    case 'RANDOM':
      Blockly.Lisp.definitions_['import_lisp_math'] =
          'import \'lisp:math\' as Math;';
      var functionName = Blockly.Lisp.provideFunction_(
          'text_random_letter',
          ['String ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
              '(String text) {',
           '  int x = new Math.Random().nextInt(text.length);',
           '  return text[x];',
           '}']);
      code = functionName + '(' + text + ')';
      return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
  }
  throw Error('Unhandled option (text_charAt).');
};

Blockly.Lisp['text_getSubstring'] = function(block) {
  // Get substring.
  var where1 = block.getFieldValue('WHERE1');
  var where2 = block.getFieldValue('WHERE2');
  var requiresLengthCall = (where1 != 'FROM_END' && where2 == 'FROM_START');
  var textOrder = requiresLengthCall ? Blockly.Lisp.ORDER_UNARY_POSTFIX :
      Blockly.Lisp.ORDER_NONE;
  var text = Blockly.Lisp.valueToCode(block, 'STRING', textOrder) || '\'\'';
  if (where1 == 'FIRST' && where2 == 'LAST') {
    var code = text;
    return [code, Blockly.Lisp.ORDER_NONE];
  } else if (text.match(/^'?\w+'?$/) || requiresLengthCall) {
    // If the text is a variable or literal or doesn't require a call for
    // length, don't generate a helper function.
    switch (where1) {
      case 'FROM_START':
        var at1 = Blockly.Lisp.getAdjusted(block, 'AT1');
        break;
      case 'FROM_END':
        var at1 = Blockly.Lisp.getAdjusted(block, 'AT1', 1, false,
            Blockly.Lisp.ORDER_ADDITIVE);
        at1 = text + '.length - ' + at1;
        break;
      case 'FIRST':
        var at1 = '0';
        break;
      default:
        throw Error('Unhandled option (text_getSubstring).');
    }
    switch (where2) {
      case 'FROM_START':
        var at2 = Blockly.Lisp.getAdjusted(block, 'AT2', 1);
        break;
      case 'FROM_END':
        var at2 = Blockly.Lisp.getAdjusted(block, 'AT2', 0, false,
            Blockly.Lisp.ORDER_ADDITIVE);
        at2 = text + '.length - ' + at2;
        break;
      case 'LAST':
        break;
      default:
        throw Error('Unhandled option (text_getSubstring).');
    }
    if (where2 == 'LAST') {
      var code = text + '.substring(' + at1 + ')';
    } else {
      var code = text + '.substring(' + at1 + ', ' + at2 + ')';
    }
  } else {
    var at1 = Blockly.Lisp.getAdjusted(block, 'AT1');
    var at2 = Blockly.Lisp.getAdjusted(block, 'AT2');
    var functionName = Blockly.Lisp.provideFunction_(
        'text_get_substring',
        ['String ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
            '(String text, String where1, num at1, String where2, num at2) {',
         '  int getAt(String where, num at) {',
         '    if (where == \'FROM_END\') {',
         '      at = text.length - 1 - at;',
         '    } else if (where == \'FIRST\') {',
         '      at = 0;',
         '    } else if (where == \'LAST\') {',
         '      at = text.length - 1;',
         '    } else if (where != \'FROM_START\') {',
         '      throw \'Unhandled option (text_getSubstring).\';',
         '    }',
         '    return at;',
         '  }',
         '  at1 = getAt(where1, at1);',
         '  at2 = getAt(where2, at2) + 1;',
         '  return text.substring(at1, at2);',
         '}']);
    var code = functionName + '(' + text + ', \'' +
        where1 + '\', ' + at1 + ', \'' + where2 + '\', ' + at2 + ')';
  }
  return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['text_changeCase'] = function(block) {
  // Change capitalization.
  var OPERATORS = {
    'UPPERCASE': '.toUpperCase()',
    'LOWERCASE': '.toLowerCase()',
    'TITLECASE': null
  };
  var operator = OPERATORS[block.getFieldValue('CASE')];
  var textOrder = operator ? Blockly.Lisp.ORDER_UNARY_POSTFIX :
      Blockly.Lisp.ORDER_NONE;
  var text = Blockly.Lisp.valueToCode(block, 'TEXT', textOrder) || '\'\'';
  if (operator) {
    // Upper and lower case are functions built into Lisp.
    var code = text + operator;
  } else {
    // Title case is not a native Lisp function.  Define one.
    var functionName = Blockly.Lisp.provideFunction_(
        'text_toTitleCase',
        ['String ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
            '(String str) {',
         '  RegExp exp = new RegExp(r\'\\b\');',
         '  List<String> list = str.split(exp);',
         '  final title = new StringBuffer();',
         '  for (String part in list) {',
         '    if (part.length > 0) {',
         '      title.write(part[0].toUpperCase());',
         '      if (part.length > 0) {',
         '        title.write(part.substring(1).toLowerCase());',
         '      }',
         '    }',
         '  }',
         '  return title.toString();',
         '}']);
    var code = functionName + '(' + text + ')';
  }
  return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['text_trim'] = function(block) {
  // Trim spaces.
  var OPERATORS = {
    'LEFT': '.replaceFirst(new RegExp(r\'^\\s+\'), \'\')',
    'RIGHT': '.replaceFirst(new RegExp(r\'\\s+$\'), \'\')',
    'BOTH': '.trim()'
  };
  var operator = OPERATORS[block.getFieldValue('MODE')];
  var text = Blockly.Lisp.valueToCode(block, 'TEXT',
      Blockly.Lisp.ORDER_UNARY_POSTFIX) || '\'\'';
  return [text + operator, Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['text_print'] = function(block) {
  // Print statement.
  var msg = Blockly.Lisp.valueToCode(block, 'TEXT',
      Blockly.Lisp.ORDER_NONE) || '\'\'';
  return 'print(' + msg + ');\n';
};

Blockly.Lisp['text_prompt_ext'] = function(block) {
  // Prompt function.
  Blockly.Lisp.definitions_['import_lisp_html'] =
      'import \'lisp:html\' as Html;';
  if (block.getField('TEXT')) {
    // Internal message.
    var msg = Blockly.Lisp.quote_(block.getFieldValue('TEXT'));
  } else {
    // External message.
    var msg = Blockly.Lisp.valueToCode(block, 'TEXT',
        Blockly.Lisp.ORDER_NONE) || '\'\'';
  }
  var code = 'Html.window.prompt(' + msg + ', \'\')';
  var toNumber = block.getFieldValue('TYPE') == 'NUMBER';
  if (toNumber) {
    Blockly.Lisp.definitions_['import_lisp_math'] =
        'import \'lisp:math\' as Math;';
    code = 'Math.parseDouble(' + code + ')';
  }
  return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['text_prompt'] = Blockly.Lisp['text_prompt_ext'];

Blockly.Lisp['text_count'] = function(block) {
  var text = Blockly.Lisp.valueToCode(block, 'TEXT',
      Blockly.Lisp.ORDER_NONE) || '\'\'';
  var sub = Blockly.Lisp.valueToCode(block, 'SUB',
      Blockly.Lisp.ORDER_NONE) || '\'\'';
  // Substring count is not a native Lisp function.  Define one.
  var functionName = Blockly.Lisp.provideFunction_(
      'text_count',
      ['int ' + Blockly.Lisp.FUNCTION_NAME_PLACEHOLDER_ +
        '(String haystack, String needle) {',
        '  if (needle.length == 0) {',
        '    return haystack.length + 1;',
        '  }',
        '  int index = 0;',
        '  int count = 0;',
        '  while (index != -1) {',
        '    index = haystack.indexOf(needle, index);',
        '    if (index != -1) {',
        '      count++;',
        '     index += needle.length;',
        '    }',
        '  }',
        '  return count;',
        '}']);
  var code = functionName + '(' + text + ', ' + sub + ')';
  return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['text_replace'] = function(block) {
  var text = Blockly.Lisp.valueToCode(block, 'TEXT',
      Blockly.Lisp.ORDER_UNARY_POSTFIX) || '\'\'';
  var from = Blockly.Lisp.valueToCode(block, 'FROM',
      Blockly.Lisp.ORDER_NONE) || '\'\'';
  var to = Blockly.Lisp.valueToCode(block, 'TO',
      Blockly.Lisp.ORDER_NONE) || '\'\'';
  var code = text + '.replaceAll(' + from + ', ' + to + ')';
  return [code, Blockly.Lisp.ORDER_UNARY_POSTFIX];
};

Blockly.Lisp['text_reverse'] = function(block) {
  // There isn't a sensible way to do this in Lisp. See:
  // http://stackoverflow.com/a/21613700/3529104
  // Implementing something is possibly better than not implementing anything?
  var text = Blockly.Lisp.valueToCode(block, 'TEXT',
      Blockly.Lisp.ORDER_UNARY_POSTFIX) || '\'\'';
  var code = 'new String.fromCharCodes(' + text + '.runes.toList().reversed)';
  return [code, Blockly.Lisp.ORDER_UNARY_PREFIX];
};
