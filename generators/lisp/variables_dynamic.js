/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Lisp for dynamic variable blocks.
 * @author fenichel@google.com (Rachel Fenichel)
 */
'use strict';

goog.provide('Blockly.Lisp.variablesDynamic');

goog.require('Blockly.Lisp');
goog.require('Blockly.Lisp.variables');


// Lisp is dynamically typed.
Blockly.Lisp['variables_get_dynamic'] = Blockly.Lisp['variables_get'];
Blockly.Lisp['variables_set_dynamic'] = Blockly.Lisp['variables_set'];
