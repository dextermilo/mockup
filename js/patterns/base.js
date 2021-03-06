// Patterns 
//
// Author: Rok Garbas
// Contact: rok@garbas.si
// Version: 1.0
// Depends: jquery.js
//
// Description: 
//
// License:
//
// Copyright (C) 2010 Plone Foundation
//
// This program is free software; you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free
// Software Foundation; either version 2 of the License.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
// more details.
//
// You should have received a copy of the GNU General Public License along with
// this program; if not, write to the Free Software Foundation, Inc., 51
// Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
//

/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true,
  newcap:true, noarg:true, noempty:true, nonew:true, plusplus:true,
  undef:true, strict:true, trailing:true, browser:true, evil:true */
/*global define:false */

define([
  'jquery',
  'jam/Patterns/src/registry',
  'jam/Patterns/src/core/logger'
], function($, registry, logger, undefined) {
  "use strict";

  function getName(name) {
    return name.replace(/\.(\w)/g, function(match, letter) { return letter.toUpperCase(); });
  }

  function getOptions($el, prefix, options) {
    options = options || {};

    // get options from parent element first, stop if element tag name is 'body'
    if ($el.size() !== 0 && !$.nodeName($el[0], 'body')) {
      options = getOptions($el.parent(), prefix, options);
    }

    // collect all options from element
    if($el.length) {
      $.each($el[0].attributes, function(index, attr) {
        if (attr.name.substr(0, ('data-pat-'+prefix).length) === 'data-pat-'+prefix) {
          var name = attr.name.substr(('data-pat-'+prefix).length+1),
              value = attr.value.replace(/^\s+|\s+$/g, '');  // trim
          if (value.substring(0, 1) === '{' || value.substring(0, 1) === '[') {
            value = JSON.parse(value);
          } else if (value === 'true') {
            value = true;
          } else if (value === 'false') {
            value = false;
          }
          if (name === '') {
            options = value;
          } else {
            var names = name.split('-'),
                names_options = options;
            $.each(names, function(i, name) {
              name = getName(name);
              if (names.length > i + 1) {
                if (!names_options[name]) {
                  names_options[name] = {};
                }
                names_options = names_options[name];
              } else {
                names_options[name] = value;
              }
            });
          }
        }
      });
    }

    return options;
  }

  // Base Pattern
  var Base = function($el, options) {
    this.log = logger.getLogger(this.name);
    this.$el = $el;
    if (this.parser) {
      this.options = $.extend(true, {},
          this.parser.parse($el, this.defaults || {}, this.multipleOptions || false),
          options || {});
    } else {
      this.options = $.extend(true, {},
          this.defaults || {},
          getOptions($el, this.name),
          options || {});
    }
    this.init();
    this.trigger('init');
  };
  Base.prototype = {
    constructor: Base,
    on: function(eventName, eventCallback) {
      this.$el.on(eventName + '.' + this.name + '.patterns', eventCallback);
    },
    trigger: function(eventName) {
      this.$el.trigger(eventName + '.' + this.name + '.patterns', [ this ]);
    }
  };
  Base.extend = function(NewPattern) {
    var Base = this, Constructor;

    if (NewPattern && NewPattern.hasOwnProperty('constructor')) {
      Constructor = NewPattern.constructor;
    } else {
      Constructor = function() { Base.apply(this, arguments); };
    }

    var Surrogate = function() { this.constructor = Constructor; };
    Surrogate.prototype = Base.prototype;
    Constructor.prototype = new Surrogate();
    Constructor.extend = Base.extend;

    $.extend(true, Constructor.prototype, NewPattern);

    Constructor.__super__ = Base.prototype;

    if (Constructor.prototype.jqueryPlugin === undefined) {
      Constructor.prototype.jqueryPlugin = "pattern" +
          Constructor.prototype.name.charAt(0).toUpperCase() +
          Constructor.prototype.name.slice(1);
    }
    if (Constructor.prototype.jqueryPlugin) {
      $.fn[Constructor.prototype.jqueryPlugin] = function(method, options) {
        $(this).each(function() {
          var $el = $(this),
              pattern = $el.data('pattern-' + Constructor.prototype.name);
          if (typeof method === "object") {
            options = method;
            method = undefined;
          }
          if (!pattern || typeof(pattern) === 'string') {
            pattern = new Constructor($el, options);
            $el.data('pattern-' + Constructor.prototype.name, pattern);
          } else if (method && pattern && pattern[method]) {
            // TODO: now allow method starts with "_"
            pattern[method].apply(pattern, [options]);
          }

        });
        return this;
      };
    }

    registry.register({
      name: Constructor.prototype.name,
      trigger: '.pat-' + Constructor.prototype.name,
      jquery_plugin: false,
      init: function($all) {
        return $all.each(function(i) {
          var $el = $(this),
              data = $el.data('pattern-' + Constructor.prototype.name + '-' + i);
          if (!data) {
            $el.data('pattern-' + Constructor.prototype.name + '-' + i, new Constructor($el));
          }
        });
      }
    });

    return Constructor;
  };

  return Base;
});
