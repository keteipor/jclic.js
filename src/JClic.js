/**
 *  File    : JClic.js
 *  Created : 01/04/2015
 *  By      : Francesc Busquets <francesc@gmail.com>
 *
 *  JClic.js
 *  An HTML5 player of JClic activities
 *  https://projectestac.github.io/jclic.js
 *
 *  @source https://github.com/projectestac/jclic.js
 *
 *  @license EUPL-1.1
 *  @licstart
 *  (c) 2000-2016 Catalan Educational Telematic Network (XTEC)
 *
 *  Licensed under the EUPL, Version 1.1 or -as soon they will be approved by
 *  the European Commission- subsequent versions of the EUPL (the "Licence");
 *  You may not use this work except in compliance with the Licence.
 *
 *  You may obtain a copy of the Licence at:
 *  https://joinup.ec.europa.eu/software/page/eupl
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the Licence is distributed on an "AS IS" basis, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  Licence for the specific language governing permissions and limitations
 *  under the Licence.
 *  @licend
 */

// Declaration of JSDoc external objects:

/**
 * The HTMLElement interface represents any HTML element. Some elements directly implement this
 * interface, others implement it via an interface that inherits it.
 * @external HTMLElement
 * @see {@link https://developer.mozilla.org/ca/docs/Web/API/HTMLElement}
 */

/**
 * A jQuery object
 * @external jQuery
 * @see {@link http://api.jquery.com/jQuery/}
 */

/**
 * The jQuery XMLHttpRequest (jqXHR) object returned by `$.ajax()` as of jQuery 1.5 is a superset
 * of the browser's native [XMLHttpRequest](https://developer.mozilla.org/docs/XMLHttpRequest) object.
 * As of jQuery 1.5, jqXHR objects implement the {@link external:Promise} interface, giving them
 * all the properties, methods, and behavior of a Promise.
 * @external jqXHR
 * @see {@link https://api.jquery.com/jQuery.ajax/#jqXHR}
 */

/**
 * The CanvasRenderingContext2D interface provides the 2D rendering context for the drawing surface
 * of a &lt;canvas&gt; element.
 * @external CanvasRenderingContext2D
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D}
 */

/**
 * The HTMLImageElement interface provides special properties and methods (beyond the regular
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement HTMLElement} interface it
 * also has available to it by inheritance) for manipulating the layout and presentation of
 * &lt;img&gt; elements.
 * @external HTMLImageElement
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement}
 */

/**
 * The HTMLAudioElement interface provides access to the properties of &lt;audio&gt; elements, as
 * well as methods to manipulate them. It derives from the
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement HTMLMediaElement} interface.
 * @external HTMLAudioElement
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement}
 */

/**
 * The Intl.Collator object is a constructor for collators, objects that enable language sensitive
 * string comparison.
 * @external Collator
 * @see {@link https://developer.mozilla.org/ca/docs/Web/JavaScript/Reference/Global_Objects/Collator}
 */

/**
 * A JSZip object
 * @external JSZip
 * @see {@link https://stuk.github.io/jszip}
 */

/**
 * The MediaRecorder interface of the {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder_API MediaRecorder API}
 * provides functionality to easily capture media.
 * @external MediaRecorder
 * @see {@link https://developer.mozilla.org/ca/docs/Web/API/MediaRecorder}
 */

/**
 * An i18next object, used to translate literals
 * @external i18next
 * @see {@link http://i18next.com}
 */

/**
 * The Promise object is used for asynchronous computations. A Promise represents an operation
 * that hasn't completed yet, but is expected in the future.
 * @external Promise
 * @see {@link https://developer.mozilla.org/ca/docs/Web/JavaScript/Reference/Global_Objects/Promise}
 */

/* global module, exports:true, JClicDataProject, JClicDataOptions */

// Mock `define` when called from a JavaScript environment without native AMD support (like Node.js)
// For an example of how to call JClic.js in node.js, see:
// `/test/nodejs/listProjectContents.js`
if (typeof define === 'undefined') {
  define = function (deps, callback) {
    var argsArray = [];
    for (var p = 0; p < deps.length; p++)
      argsArray.push(require(deps[p]));
    return callback.apply(null, argsArray);
  };
}

// Initial empty definition of `JClicObject`. Will be filled with real data in `define`
var JClicObject = {};

define([
  "jquery",
  "./JClicPlayer",
  "./project/JClicProject",
  "./AWT",
  "./Utils",
  "./Deps"
], function ($, JClicPlayer, JClicProject, AWT, Utils, deps) {

  /**
   * This is the main JClic method
   *
   * Executes on `document.ready()`.
   *
   * The method iterates over all `div` objects with `JClic` class and creates a {@link JClicPlayer}
   * within them. Each player loads the JClic project file specified in the `data-project` attribute of
   * the `div` tag.
   *
   * The `div` elements must preferabily be empty. Inner content may become overlapped by objects
   * created by the JClic player.
   *
   * This method exports the global variable `window.JClicObject`, useful when other scripts
   * need to make direct calls to the main components of JClic.
   *
   * The main members of the global variable `JClicObject` are:
   * - `JClicObject.JClicPlayer` (the {@link JClicPlayer} object)
   * - `JClicObject.JClicProject` (the {@link JClicProject} object)
   * - `JClicObject.AWT` (the {@link AWT} object)
   * - `JClicObject.Utils` (the {@link Utils} object)
   * - `JClicObject.$` (the JQuery object)
   * - `JClicObject.options` (the main options loaded at startup, usually the content of the global variable `JClicDataOptions`)
   * - `JClicObject.projectFiles` (used by JSONP to store the content of some files when inaccessible to the browser because CORS or other restrictions)
   * - `JClicObject.currentPlayers` (array with references to the players currently running)
   * - `JClicObject.loadProject` (a function that starts a JClicPlayer on a specific `div`)
   *
   * @module JClic
   * @exports JClicObject
   * @example
   * Creates a JClic div and loads "myproject.jclic" on it:
   * `<div class ="JClic" data-project="myproject.jclic"></div>`
   * @example
   * Creates a JClic div that loads "myproject.jclic" with additional parameters, passed as a
   * JSON string. Note that `data-options` should be delimited by apostrophes `'` because quotation
   * marks `"` are used for JSON keys and values:
   * `<div class ="JClic" data-project="myproject.jclic" data-options='{"fade":"400","lang":"es","reporter":"TCPReporter","user":"test01","path":"localhost:9090"}'></div>`
   *
   */

  JClicObject = {
    JClicPlayer: JClicPlayer,
    JClicProject: JClicProject,
    AWT: AWT,
    Utils: Utils,
    $: $,
    options: typeof JClicDataOptions === 'undefined' ? {} : JClicDataOptions,
    projectFiles: {},
    currentPlayers: [],
    /**
     *
     * Creates a new JClicPlayer hosted on the specified `div`, and loads an specific project on it.
     * @param {HTMLElement} div - The HTML element (usually a `<div/>`) that will be used as a main container of the player.
     * @param {string} projectName - The file name or URL of the JClic project to be loaded
     * @param {object=} options - An optional set of preferences
     * @returns {JClicPlayer}
     */
    loadProject: function (div, projectName, options) {

      options = Utils.init($.extend(Object.create(JClicObject.options), options || {}));
      
      var player = null;

      // Find if there is another player already running on 'div'
      for (var i = 0; i < JClicObject.currentPlayers.length; i++) {
        var pl = JClicObject.currentPlayers[i];
        if (pl && pl.$topDiv && pl.$topDiv[0] === div) {
          // Player found! Check if it has the same options
          Utils.log('debug', 'Existing JClicPlayer found in div. I will try to reuse it.');
          player = pl;
          for (var prop in options) {
            if (options.hasOwnProperty(prop)) {
              if (!player.options.hasOwnProperty(prop) || player.options[prop] !== options[prop]) {
                Utils.log('debug', 'Existing JClicPlayer has diferent options! Creating a new one from scratch.');
                player = null;
                break;
              }
            }
          }
          break;
        }
      }

      if (player)
        player.reset();
      else {
        Utils.log('debug', 'Creating a new instance of JClicPlayer');
        player = new JClicPlayer($(div).empty(), options);        
      }

      if (projectName)
        player.initReporter().then(function () {
          player.load(projectName);
        }).catch(function (err) {
          Utils.log('error', 'Unable to start reporting: %s.\n JClicPlayer will be removed.', err.toString());
          $(div).empty().removeAttr('style').append($('<h2/>').html(player.getMsg('ERROR'))).append($('<p/>').html(err));
          var i = JClicObject.currentPlayers.indexOf(player);
          if (i >= 0)
            JClicObject.currentPlayers.splice(i, 1);
          player = null;
        });

      if (player && options.savePlayersRef !== false && JClicObject.currentPlayers.indexOf(player) === -1)
        JClicObject.currentPlayers.push(player);

      return player;
    }
  };

  // Make JClicObject global and attach resize handler
  if (typeof window !== 'undefined') {
    window.JClicObject = JClicObject;

    var fnFit = function () {
      for (var i = 0; i < JClicObject.currentPlayers.length; i++) {
        var player = JClicObject.currentPlayers[i];
        if (player && player.skin)
          player.skin.fit();
      }
    };
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', fnFit);
    $(window).resize(fnFit);
  }

  // Execute on document ready
  $(function () {

    // If defined, load the global variable `JClicDataOptions`
    var options = typeof JClicDataOptions === 'undefined' ? {} : JClicDataOptions;
    JClicObject.options = options;

    if (!options.noInit) {
      // If defined, load the global variable `JClicDataProject` or `JClicObject.projectFile`
      var projectName =
          typeof JClicDataProject === 'string' ? JClicDataProject
          : typeof JClicObject.projectFile === 'string' ? JClicObject.projectFile
          : null;

      // Search DOM elements with class "JClic" (usually of type 'div') and iterate over them
      // initializing players
      $('.JClic').each(function () {
        var $div = $(this);

        var prj = $div.data('project');
        if (prj)
          projectName = prj;

        var opt = $div.data('options');
        if (opt)
          options = $.extend(Object.create(options), opt);

        JClicObject.loadProject(this, projectName, options);
      });
    }
  });
  return JClicObject;
});

// Export JClicObject as a result
if (typeof module !== "undefined") {
  exports = module.exports = JClicObject;
}
