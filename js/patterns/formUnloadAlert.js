// Pattern which provide some basic form helpers:
// - prevent forms with changed values to be unloaded 
// This is going to replace 'Products/CMFPlone/skins/plone_ecmascript/formUnload.js'
// Bits of this come from 
// https://raw.github.com/mmonteleone/jquery.safetynet/master/jquery.safetynet.js
//
// Author: Simone Orsi
// Contact: simahawk@gmail.com
// Version: 1.0
//
// License:
//
// Copyright (C) 2013 Plone Foundation
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
  'js/patterns/base'
], function ($, Base, Parser) {
  "use strict";

  var FormUnloadAlert = Base.extend({
    name: "formunloadalert",
    _changed : false,       // Stores a listing of raised changes by their key
    _suppressed : false,     // whether or not warning should be suppressed
    defaults: {
      message :  "Discard changes? If you click OK, " +
                 "any changes you have made will be lost.",
      // events on which to check for changes
      changingEvents: 'change keyup paste',
      // fields on which to check for changes
      changingFields: 'input,select,textarea,fileupload'
    },
    init: function () {
      var self = this;
      // if this is not a form just return
      if (!self.$el.is('form')) { return; }

      $(self.options.changingFields, self.$el).on(
        self.options.changingEvents,
        function (evt) {
          self._changed = true;
        }
      );

      $(window).on('beforeunload', function(e){
        return self._handle_unload(self, e);
      });

      self.$el.on('submit', function(e){
        self._suppressed = true;
      });

    },
    _handle_unload : function (self, e) {
      if (self._suppressed) {
        self._suppressed = false;
        return undefined;
      }
      if (self._changed) {
        var msg = self.options.message;
        (e || window.event).returnValue = msg;
        return msg;
      }
    }
  });
  return FormUnloadAlert;

});
