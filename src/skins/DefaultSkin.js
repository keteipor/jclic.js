/**
 *  File    : skins/DefaultSkin.js
 *  Created : 12/05/2015
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
 *  (c) 2000-2018 Catalan Educational Telematic Network (XTEC)
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

/* global define */

define([
  "jquery",
  "screenfull",
  "../AWT",
  "./Skin",
  "../boxes/ActiveBox",
  "./Counter",
  "../Utils"
], function ($, screenfull, AWT, Skin, ActiveBox, Counter, Utils) {

  // In some cases, require.js does not return a valid value for screenfull. Check it:
  if (!screenfull)
    screenfull = window.screenfull

  /**
   * This is the default {@link Skin} used by JClic.js
   * @exports DefaultSkin
   * @class
   * @extends Skin
   */
  class DefaultSkin extends Skin {
    /**
     * DefaultSkin constructor
     * @param {PlayStation} ps - The PlayStation (currently a {@link JClicPlayer}) used to load and
     * realize the media objects needed tot build the Skin.
     * @param {string=} name - The skin class name
     * @param {object=} options - Optional parameter with additional options, used by subclasses
     * this skin. When `null` or `undefined`, a new one will be created.
     */
    constructor(ps, name = null, options = {}) {
      // DefaultSkin extends [Skin](Skin.html)
      super(ps, name, options)
      let msg = ''

      AWT.Font.loadGoogleFonts(this.cssFonts)

      // Create the main container for buttons, counters and message box
      this.$ctrlCnt = $('<div/>', { class: 'JClicCtrlCnt unselectableText', role: 'navigation' })
      this.$div.append(this.$ctrlCnt)

      // Add `prev` button
      msg = ps.getMsg('Previous activity')
      this.buttons.prev = $('<button/>', { class: 'JClicBtn', title: msg, 'aria-label': msg })
        .append($(Utils.getSvg(this.prevIcon, this.iconWidth, this.iconHeight, this.iconFill)))
        .on('click', evt => {
          if (this.ps)
            this.ps.actions.prev.processEvent(evt)
        })
      this.$ctrlCnt.append(this.buttons.prev)

      // Add message box
      this.msgBox = new ActiveBox()
      this.msgBox.role = 'message'
      this.$msgBoxDiv = $('<div/>', { class: 'JClicMsgBox' })
        .click(() => {
          this.msgBox.playMedia(ps)
          return false
        })
      this.$ctrlCnt.append(this.$msgBoxDiv)

      // Add `next` button
      msg = ps.getMsg('Next activity')
      this.buttons.next = $('<button/>', { class: 'JClicBtn', title: msg, 'aria-label': msg })
        .append($(Utils.getSvg(this.nextIcon, this.iconWidth, this.iconHeight, this.iconFill)))
        .on('click', evt => {
          if (this.ps)
            this.ps.actions.next.processEvent(evt)
        })
      this.$ctrlCnt.append(this.buttons.next)

      // Add counters
      if (false !== this.ps.options.counters && false !== options.counters) {
        // Create counters
        msg = ps.getMsg('Reports')
        const $countCnt = $('<button/>', { class: 'JClicCountCnt', 'aria-label': msg })
          .on('click', evt => {
            if (this.ps)
              this.ps.actions.reports.processEvent(evt)
          })
        $.each(Skin.prototype.counters, (name, _val) => {
          msg = ps.getMsg(name)
          this.counters[name] = new Counter(name, $('<div/>', { class: 'JClicCounter', title: msg, 'aria-label': msg })
            .css({
              'background-image': `url(${Utils.svgToURI(this[name + 'Icon'], this.counterIconWidth, this.counterIconHeight, this.counterIconFill)})`,
              color: this.counterIconFill
            })
            .html('000')
            .appendTo($countCnt))
        })
        this.$ctrlCnt.append($countCnt)
      }

      // Add info button
      if (true === this.ps.options.info || true === options.info) {
        msg = ps.getMsg('Information')
        this.buttons.info = $('<button/>', { class: 'JClicBtn', title: msg, 'aria-label': msg })
          .append($(Utils.getSvg(this.infoIcon, this.iconWidth, this.iconHeight, this.iconFill)))
          .on('click', evt => {
            if (this.ps)
              this.ps.actions.info.processEvent(evt)
          })
        this.$ctrlCnt.append(this.buttons.info)
      }

      // Add reports button
      if (true === this.ps.options.reportsBtn || true === options.reportsBtn) {
        msg = ps.getMsg('Reports')
        this.buttons.about = $('<button/>', { class: 'JClicBtn', title: msg, 'aria-label': msg })
          .append($(Utils.getSvg(this.reportsIcon, this.iconWidth, this.iconHeight, this.iconFill)))
          .on('click', evt => {
            if (this.ps)
              this.ps.actions.reports.processEvent(evt)
          })
        this.$ctrlCnt.append(this.buttons.about)
      }

      // Add `full screen` button
      if (screenfull && screenfull.enabled) {
        msg = ps.getMsg('Toggle full screen')
        this.buttons.fullscreen = $('<button/>', { class: 'JClicBtn', title: msg, 'aria-label': msg })
          .append($('<img/>', { src: Utils.svgToURI(this.fullScreenIcon, this.iconWidth, this.iconHeight, this.iconFill) }))
          .on('click', () => {
            this.setScreenFull(null)
          })
        this.$ctrlCnt.append(this.buttons.fullscreen)
      }

      // Add `close` button
      if (typeof this.ps.options.closeFn === 'function') {
        msg = ps.getMsg('Close')
        const closeFn = this.ps.options.closeFn
        this.buttons.close = $('<button/>', { class: 'JClicBtn', title: msg, 'aria-label': msg })
          .append($(Utils.getSvg(this.closeIcon, this.iconWidth, this.iconHeight, this.iconFill)))
          .on('click', () => {
            Utils.log('info', 'Closing the player')
            closeFn()
          })
        this.$ctrlCnt.append(this.buttons.close)
      }

      // Workaround for a bug in Edge and Explorer: SVG objects not implementing `blur` and `focus` methods
      // See: [https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8479637/]
      // This affects Polymer `iron-overlay-behavior`. See: [https://github.com/PolymerElements/iron-overlay-behavior/pull/211]
      let nilFunc = null
      $.each(this.buttons, (_key, value) => {
        if (value && (typeof value[0].focus !== 'function' || typeof value[0].blur !== 'function')) {
          if (nilFunc === null)
            nilFunc = () => Utils.log('error', '"blur" and "focus" not defined for SVG objects in Explorer/Edge')
          value[0].focus = value[0].blur = nilFunc
        }
      })
    }

    /**
     * Returns the CSS styles used by this skin. This method should be called only from
     * the `Skin` constructor, and overridded by subclasses if needed.
     * @param {string} media - A specific media size. Possible values are: 'default', 'half' and 'twoThirds'
     * @returns {string}
     */
    _getStyleSheets(media = 'default') {
      return `${super._getStyleSheets(media)}${media === 'default' ? this.mainCSS : media === 'half' ? this.mainCSSHalf : media === 'twoThirds' ? this.mainCSSTwoThirds : ''}`
    }

    /**
     * Main method used to build the content of the skin. Resizes and places internal objects.
     * @override
     */
    doLayout() {
      // Call method on ancestor
      super.doLayout()

      // Set the fullScreen icon
      if (this.buttons.fullscreen)
        this.buttons.fullscreen.find('img').get(-1).src = Utils.svgToURI(
          this[screenfull.isFullscreen ? 'fullScreenExitIcon' : 'fullScreenIcon'],
          this.iconWidth, this.iconHeight, this.iconFill)
    }

    /**
     * Gets the {@link ActiveBox} used to display the main messages of activities
     * @returns {ActiveBox}
     */
    getMsgBox() {
      return this.msgBox
    }

    /**
     * Enables or disables the `tabindex` attribute of the main buttons. Useful when a modal dialog
     * overlay is active, to avoid direct access to controls not related with the dialog.
     * @param {boolean} status - `true` to make main controls navigable, `false` otherwise
     */
    enableMainButtons(status) {
      this.$ctrlCnt.find('.JClicBtn,.JClicCountCnt').attr('tabindex', status ? '0' : '-1')
    }
  }

  Object.assign(DefaultSkin.prototype, {
    /**
     * Class name of this skin. It will be used as a base selector in the definition of all CSS styles.
     * @name DefaultSkin#skinId
     * @override
     * @type {string}
     */
    skinId: 'JClicDefaultSkin',
    /**
     * The HTML div where buttons, counters and message box are placed
     * @name DefaultSkin#$ctrlCnt
     * @type {external:jQuery} */
    $ctrlCnt: null,
    /**
     * Space (pixels) between the components of this {@link Skin}
     * @name DefaultSkin#margin
     * @type {number} */
    margin: 18,
    /**
     * Height of {@link DefaultSkin#msgBox}
     * @name DefaultSkin#msgBoxHeight
     * @type {number} */
    msgBoxHeight: 60,
    /**
     * Width of counters, in pixels
     * @name DefaultSkin#countersWidth
     * @type {number} */
    countersWidth: 60,
    /**
     * Height of counters, in pixels
     * @name DefaultSkin#countersHeight
     * @type {number} */
    countersHeight: 20,
    //
    //Buttons and other graphical resources used by this skin.
    //
    /**
     * Styles used in this skin
     * @name DefaultSkin#mainCSS
     * @type {string} */
    mainCSS: '\
.ID .JClicCtrlCnt {margin:0 9px 18px 9px; display:-webkit-flex; display:flex; -webkit-flex-direction:row; flex-direction:row; -webkit-align-items:center; align-items:center;}\
.ID .JClicCountCnt {display:-webkit-flex; display:flex; -webkit-flex-direction:column; flex-direction:column;}\
.ID .JClicMsgBox {height:60px; -webkit-flex-grow:1; flex-grow:1; background-color:lightblue;}\
.ID .JClicBtn {cursor:pointer; line-height:0;}\
.ID .JClicBtn:disabled {cursor:inherit; opacity:0.3;}\
.ID .JClicCounter {width:40px; height:20px; padding-left:20px; color:white; cursor:pointer; font-family:Roboto,Sans-serif; font-size:18px; text-align:center; background-repeat:no-repeat; background-position:left}',
    /**
     * Styles used in this skin, sized to half its regular size
     * @name DefaultSkin#mainCSSHalf
     * @type {string} */
    mainCSSHalf: '\
.ID .JClicPlayerCnt {margin:9px;}\
.ID .JClicCtrlCnt {margin:0 4px 9px 4px;}\
.ID .JClicCtrlCnt button svg,img {width:18px; height:18px;}\
.ID .JClicMsgBox {height:30px;}\
.ID .JClicCounter {width:20px; height:10px; margin-left:-15px; transform:scale(0.5);}',
    /**
     * Styles used in this skin, sized to two thirds of its regular size
     * @name DefaultSkin#mainCSSTwoThirds
     * @type {string} */
    mainCSSTwoThirds: '\
.ID .JClicPlayerCnt {margin:12px;}\
.ID .JClicCtrlCnt {margin: 0 6px 12px 6px;}\
.ID .JClicCtrlCnt button svg,img {width:24px; height:24px;}\
.ID .JClicMsgBox {height:40px;}\
.ID .JClicCounter {width:27px; height:13px; margin-left:-10px; transform:scale(0.666);}',
    /**
     * Fonts used in this skin
     * @name DefaultSkin#cssFonts
     * @type {string[]} */
    cssFonts: ['Roboto'],
    //
    // Default settings for icons (can be overridden in subclasses):
    /**
     * Icon width
     * @name DefaultSkin#iconWidth
     * @type {number} */
    iconWidth: 36,
    /**
     * Icon height
     * @name DefaultSkin#iconHeight
     * @type {number} */
    iconHeight: 36,
    /**
     * Fill color for icons
     * @name DefaultSkin#iconFill
     * @type {string} */
    iconFill: '#FFFFFF',
    //
    // SVG images for action buttons
    // Based on [Google Material design Icons](https://google.github.io/material-design-icons/)
    //
    /**
     * Icon for 'previous activity' button
     * @name DefaultSkin#prevIcon
     * @type {string} */
    prevIcon: '<svg fill="#FFFFFF" viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">\
<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>\
</svg>',
    /**
     * Icon for 'next activity' button
     * @name DefaultSkin#nextIcon
     * @type {string} */
    nextIcon: '<svg fill="#FFFFFF" viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">\
<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>\
</svg>',
    /**
     * Full screen on icon
     * @name DefaultSkin#fullScreenIcon
     * @type {string} */
    fullScreenIcon: '<svg fill="#FFFFFF" viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">\
<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>\
</svg>',
    /**
     * Full screen off icon
     * @name DefaultSkin#fullScreenExitIcon
     * @type {string} */
    fullScreenExitIcon: '<svg fill="#FFFFFF" viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">\
<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>\
</svg>',
    /**
     * Close button
     * @name DefaultSkin#closeIcon
     * @type {string} */
    closeIcon: '<svg fill="#FFFFFF" viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">\
<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>\
</svg>',
    /**
     * Info button
     * @name DefaultSkin#infoIcon
     * @type {string} */
    infoIcon: '<svg fill="#FFFFFF" viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">\
<path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>\
</svg>',
    /**
     * Reports button
     * @name DefaultSkin#reportsIcon
     * @type {string} */
    reportsIcon: '<svg fill="#FFFFFF" viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">\
<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>\
</svg>',
    //
    // Settings for counters:
    /**
     * Counter icon width
     * @name DefaultSkin#counterIconWidth
     * @type {number} */
    counterIconWidth: 18,
    /**
     * Counter icon height
     * @name DefaultSkin#counterIconHeight
     * @type {number} */
    counterIconHeight: 18,
    /**
     * Counter icon fill color
     * @name DefaultSkin#counterIconFill
     * @type {string} */
    counterIconFill: '#FFFFFF',
    // Counters:
    /**
     * Time icon
     * @name DefaultSkin#timeIcon
     * @type {string} */
    timeIcon: '<svg fill="#FFFFFF" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">\
<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>\
<path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>\
</svg>',
    /**
     * Score icon
     * @name DefaultSkin#scoreIcon
     * @type {string} */
    scoreIcon: '<svg fill="#FFFFFF" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">\
<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>\
</svg>',
    /**
     * Actions icon
     * @name DefaultSkin#actionsIcon
     * @type {string} */
    actionsIcon: '<svg fill="#FFFFFF" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">\
<path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>\
</svg>',
  })

  // Register this class in the list of available skins
  Skin.CLASSES['default'] = DefaultSkin

  return DefaultSkin
})
