/**
 * Utilities for the framework
 */

/* global F */
F.util = (function(undefined){
	"use strict";

	// Thanks to Andrea Giammarchi
	var
		reEscape = /[&<>'"]/g,
		reUnescape = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g,
		escapeMap = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#x27;',
			'`': '&#x60;'
		},
		unescapeMap = {
			'&amp;': '&',
			'&lt;': '<',
			'&gt;': '>',
			'&quot;': '"',
			'&#x27;': "'",
			'&#x60;': '`' 
		},

		createEscaper = function(map) {
		    var escaper = function(match) {
		        return map[match];
		    };
		    // Regexes for identifying a key that needs to be escaped
		    var source = '(?:' + Object.keys(map).join('|') + ')';
		    var testRegexp = new RegExp(source);
		    var replaceRegexp = new RegExp(source, 'g');
		    return function(string) {
				string = string === null ? '' : '' + string;
		        return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
		    };
		},
		
		escape = createEscaper(escapeMap),
		unescape = createEscaper(unescapeMap)
	;

	// Simple JavaScript Templating
	// Paul Miller (http://paulmillr.com)
	// http://underscorejs.org
	// (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	// http://krasimirtsonev.com/blog/article/Javascript-template-engine-in-just-20-line
	// By default, Underscore uses ERB-style template delimiters, change the
	// following template settings to use alternative delimiters.
	var tmplSettings = {
		evaluate    : /<%([\s\S]+?)%>/g,
		interpolate : /<%=([\s\S]+?)%>/g,
		escape      : /<%-([\s\S]+?)%>/g
	};

	// When customizing `templateSettings`, if you don't want to define an
	// interpolation, evaluation or escaping regex, we need one that is
	// guaranteed not to match.
	var noMatch = /(.)^/;

	// Certain characters need to be escaped so that they can be put into a
	// string literal.
	var escapes = {
		"'":      "'",
		'\\':     '\\',
		'\r':     'r',
		'\n':     'n',
		'\t':     't',
		'\u2028': 'u2028',
		'\u2029': 'u2029'
	};

	var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

	// List of HTML entities for escaping.
	var htmlEntities = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;'
	};

	var entityRe = new RegExp('[&<>"\']', 'g');

	var escapeExpr = function(string) {
		if (string === null) return '';
		return ('' + string).replace(entityRe, function(match) {
			return htmlEntities[match];
		});
	};

	var counter = 0;

	// JavaScript micro-templating, similar to John Resig's implementation.
	// Underscore templating handles arbitrary delimiters, preserves whitespace,
	// and correctly escapes quotes within interpolated code.
	var tmpl = function(text, data) {
		var render;

		// Combine delimiters into one regular expression via alternation.
		var matcher = new RegExp([
		  (tmplSettings.escape || noMatch).source,
		  (tmplSettings.interpolate || noMatch).source,
		  (tmplSettings.evaluate || noMatch).source
		].join('|') + '|$', 'g');

		// Compile the template source, escaping string literals appropriately.
		var index = 0;
		var source = "__p+='";
		text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
		  source += text.slice(index, offset)
		    .replace(escaper, function(match) { return '\\' + escapes[match]; });

		  if (escape) {
		    source += "'+\n((__t=(" + escape + "))==null?'':escapeExpr(__t))+\n'";
		  }
		  if (interpolate) {
		    source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
		  }
		  if (evaluate) {
		    source += "';\n" + evaluate + "\n__p+='";
		  }
		  index = offset + match.length;
		  return match;
		});
		source += "';\n";

		// If a variable is not specified, place data values in local scope.
		if (!tmplSettings.variable) source = 'with(obj||{}){\n' + source + '}\n';

		source = "var __t,__p='',__j=Array.prototype.join," +
		  "print=function(){__p+=__j.call(arguments,'');};\n" +
		  source + "return __p;\n//# sourceURL=/microtemplates/source[" + counter++ + "]";

		try {
		  render = new Function(tmplSettings.variable || 'obj', 'escapeExpr', source);
		} catch (e) {
		  e.source = source;
		  throw e;
		}

		if (data) return render(data, escapeExpr);
		var template = function(data) {
		  return render.call(this, data, escapeExpr);
		};

		// Provide the compiled function source as a convenience for precompilation.
		template.source = 'function(' + (tmplSettings.variable || 'obj') + '){\n' + source + '\n}';

		return template;
	};
	tmpl.settings = tmplSettings;

	return {
		ready: function (fn) {
	   		if (document.readyState === 'complete' || document.readyState !== 'loading') {
		    	fn();
		  	} else {
		    	document.addEventListener('DOMContentLoaded', fn);
		  	}
		},
		escape 	: escape,
		unescape: unescape,
		replace : String.prototype.replace,

		/**
		 * Generetes a almost Global Unique Identifier (GUID)
		 * @return {[type]} [description]
		 */
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random))
					.toString(16);
			}

			return uuid;
		},

        template : tmpl,

		/*
		* memoize.js
		* by @philogb and @addyosmani
		* with further optimizations by @mathias
		* and @DmitryBaranovsk
		* perf tests: http://bit.ly/q3zpG3
		* Released under an MIT license.
		*/
		memoize: function(fn) {
			return function () {
				var args = Array.prototype.slice.call(arguments),
					hash = "",
					i = args.length,
					currentArg = null;
				while (i--) {
					currentArg = args[i];
					hash += (currentArg === Object(currentArg)) ?
                        JSON.stringify(currentArg) :
                        currentArg;
					fn.memoize || (fn.memoize = {});
				}
				return (hash in fn.memoize) ? fn.memoize[hash] :
				fn.memoize[hash] = fn.apply(this, args);
			};
		},

		/**
         * Sets a name/value pair which is stored in the browser and sent to the server
         * with every request. This is also known as a cookie. Be careful setting
         * cookies, because they can take up a lot of bandwidth, especially for Ajax
         * applications.
         *
         * @param {String}  name     cookie name
         * @param {String}  value    cookie value
         * @param {Date}    expire   expire date representing the number of milliseconds
         *                           since 1 January 1970 00:00:00 UTC.
         * @param {String}  path     path name
         * @param {String}  domain   domain name
         * @param {Boolean} secure   cookie may benefit all the documents and CGI programs
         *                           meet the requirements as to the path and domain
         *                           compatibility
         *     Possible values:
         *     true   may benefit
         *     false  can not benefit
         *
         * @return {String} Returns a cookie name.
         */
        setcookie: function(name, value, expire, path, domain, secure) {
            var ck = name + "=" + escape(value) + ";";
            if (expire) ck += "expires=" + new Date(expire +
                new Date().getTimezoneOffset() * 60).toGMTString() + ";";
            if (path)   ck += "path=" + path + ";";
            if (domain) ck += "domain=" + domain + ";";
            if (secure) ck += "secure";

            document.cookie = ck;
            return value;
        },

        /**
         * Gets the value of a stored name/value pair called a cookie.
         *
         * @param {String} name the name of the stored cookie.
         * @return {String} Returns a value of the cookie or the empty string if it isn't found
         */
        getcookie: function(name) {
          var aCookie = document.cookie.split("; ");
          for (var i = 0; i < aCookie.length; i++) {
              var aCrumb = aCookie[i].split("=");
              if (name == aCrumb[0])
                  return unescape(aCrumb[1]);
          }

          return "";
        },

        /**
         * Deletes a stored name/value pair called a cookie.
         *
         * @param {String} name     the name of the stored cookie
         * @param {String} domain   the name of the domain of stored cookie
         */
        delcookie: function (name, domain){
            document.cookie = name + "=blah; expires=Fri, 31 Dec 1999 23:59:59 GMT;" + (domain ? 'domain='+domain : '');
        }
	};
}());
