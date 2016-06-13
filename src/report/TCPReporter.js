//  File    : TCPReporter.js  
//  Created : 08/06/2016  
//  By      : fbusquet  
//
//  JClic.js  
//  HTML5 player of [JClic](http://clic.xtec.cat) activities  
//  http://projectestac.github.io/jclic.js  
//  (c) 2000-2015 Catalan Educational Telematic Network (XTEC)  
//  This program is free software: you can redistribute it and/or modify it under the terms of
//  the GNU General Public License as published by the Free Software Foundation, version. This
//  program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
//  even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
//  General Public License for more details. You should have received a copy of the GNU General
//  Public License along with this program. If not, see [http://www.gnu.org/licenses/].  

/* global Promise, window */

define([
  "jquery",
  "./Reporter"
], function ($, Reporter) {

  /**
   * This special case of {@link Reporter} connects with an external service that provides the
   * [JClic Reports API](https://github.com/projectestac/jclic/wiki/JClic-Reports-developers-guide).
   * Connection parameters to the reports server (`path`, `service`, `userId`, `key`, `context`...)
   * are passed through the `options` element of {@link JClicPlayer} (acting as {@link PlayStation}).
   * @exports TCPReporter
   * @class
   * @extends Reporter
   * @param {PlayStation} ps - The {@link PlayStation} used to retrieve settings and localized messages
   */
  var TCPReporter = function (ps) {
    Reporter.call(this, ps);
    this.tasks = [];
    var thisReporter = this;
    // Warn user before leaving current page with unsaved data:
    $(window).on('beforeunload', function (event) {
      if (thisReporter.serviceUrl !== null &&
          (thisReporter.tasks.length > 0 || thisReporter.processingTasks)) {
        thisReporter.flushTasksPromise();
        var result = thisReporter.ps.getMsg('Please wait until the results of your activities are sent to the reports system');
        if (event)
          event.returnValue = result;
        return result;
      }
    });
  };

  TCPReporter.prototype = {
    constructor: TCPReporter,
    /**
     * Identifier of the current session, provided by the server
     * @type {string} */
    currentSessionId: '',
    /**
     * Last activity reported
     * @type {ActivityReg} */
    lastActivity: null,
    /**
     * Number of activities processed
     * @type {number} */
    actCount: 0,
    /**
     * Service URL of the JClic Reports server
     * @type {string} */
    serviceUrl: null,
    /**
     * Object used to store specific properties of the connected reports system
     * @type {object} */
    dbProperties: null,
    /**
     * List of {@link TCPReporter.ReportBean} objects pending to be processed
     * @type {TCPReporter.ReportBean[]} */
    tasks: null,
    /**
     * Waiting list of tasks, to be used while `tasks` is being processed
     * @type {TCPReporter.ReportBean[]} */
    waitingTasks: null,
    /**
     * Flag used to indicate if `transaction` is currently running
     * @type {boolean} */
    processingTasks: false,
    /**
     * Identifier of the background function obtained with a call to window.setInterval
     * @type {number} */
    timer: -1,
    /**
     * Time between calls to the background function, in milliseconds
     * @type {number} */
    timerLap: 5000,
    /**
     * Counter of unsuccessfull connection attempts with the report server
     * @type {number} */
    failCount: 0,
    /**
     * Maximum number of failed attempts allowed before disconnecting
     * @type {number} */
    maxFails: 5,
    /**
     * Default path of JClic Reports Server
     * @type {string} */
    DEFAULT_SERVER_PATH: 'localhost:9000',
    /**
     * Default name for the reports service
     * @type {string} */
    DEFAULT_SERVER_SERVICE: '/JClicReportService',
    /**
     * Default server protocol
     * @type {string} */
    DEFAULT_SERVER_PROTOCOL: 'http',
    /**
     * Default lap between calls to flushTasks, in seconds
     * @type {number} */
    DEFAULT_TIMER_LAP: 5,
    /**
     * 
     * Adds a new element to the list of report beans pending to be transmitted.
     * @param {TCPReporter.ReportBean} bean
     */
    addTask: function (bean) {
      if (this.processingTasks) {
        if (this.waitingTasks === null)
          this.waitingTasks = [bean];
        else
          this.waitingTasks.push(bean);
      } else
        this.tasks.push(bean);
    },
    /**
     * 
     * Transmits all report beans currently stored in `tasks` to the reports server
     * @returns {external:Promise}
     */
    flushTasksPromise: function () {
      if (this.processingTasks || this.currentSessionId === null ||
          this.tasks.length === 0 || this.serviceUrl === null)
        // The task list cannot be processed now. Pass and wait until the next timer cycle:
        return Promise.resolve(true);
      else {
        // Set up the `processingTasks` flag to avoid re-entrant processing
        this.processingTasks = true;
        var thisReporter = this;

        var reportBean = new TCPReporter.ReportBean('multiple');
        for (var i = 0; i < this.tasks.length; i++)
          reportBean.appendData(this.tasks[i].$bean);

        return new Promise(function (resolve, reject) {
          thisReporter.transaction(reportBean.$bean)
              .done(function (data, textStatus, jqXHR) {
                // TODO: Check returned message for possible errors on the server side
                thisReporter.tasks = [];
                if (thisReporter.waitingTasks) {
                  thisReporter.tasks.concat(thisReporter.waitingTasks);
                  thisReporter.waitingTasks = null;
                }
                // Reset the fail counter after a successufull attempt
                thisReporter.failCount = 0;
                resolve(true);
              })
              .fail(function (jqXHR, textStatus, errorThrown) {
                if (++thisReporter.failCount > thisReporter.maxFails)
                  thisReporter.stopReporting();
                console.log('ERROR reporting data: ' + textStatus);
                reject(false);
              })
              .always(function () {
                // Unset the flag
                thisReporter.processingTasks = false;
              });
        });
      }
    },
    /**
     * 
     * Initializes this report system with an optional set of parameters
     * @override
     * @param {Object} properties - Initial settings passed to the reporting system
     */
    init: function (properties) {
      Reporter.prototype.init.call(this, properties);
      this.initiated = false;

      var serverPath = properties.path ? properties.path : this.DEFAULT_SERVER_PATH;
      this.descriptionKey = "Reporting to remote server";
      this.descriptionDetail = serverPath;
      var serverService = properties.service ? properties.service : this.DEFAULT_SERVER_SERVICE;
      if (!serverService.startsWith('/'))
        serverService = '/' + serverService;
      var serverProtocol = properties.protocol ? properties.protocol : this.DEFAULT_SERVER_PROTOCOL;

      this.serviceUrl = serverProtocol + "://" + serverPath + serverService;

      if (this.userId === null)
        this.userId = this.promptUserId();

      if (this.userId) {
        var tl = properties.lap ? properties.lap : this.DEFAULT_TIMER_LAP;
        this.timerLap = Math.min(30, Math.max(1, parseInt(tl)));
        var thisReporter = this;
        this.timer = window.setInterval(
            function () {
              thisReporter.flushTasksPromise();
            }, this.timerLap * 1000);
        this.initiated = true;
      } else
        this.stopReporting();
    },
    /**
     * 
     * This method should be invoked when a new session starts
     * @override
     * @param {JClicProject|string} jcp - The {@link JClicProject} referenced by this session, or
     * just its name.
     */
    newSession: function (jcp) {
      Reporter.prototype.newSession.call(this, jcp);
      if (!this.serviceUrl)
        return;
      if (this.userId === null) {
        this.userId = this.promptUserId();
      }
      if (this.userId !== null) {
        // Session ID will be obtained when reporting first activity
        this.currentSessionId = null;
      }
    },
    /**
     * 
     * Creates a new session in the remote database and records its ID for future use
     * @param {boolean} forceNewSession - When `true`, a new session will always be created.
     * @returns {external:Promise} - A {@link external:Promise} that will be successfully resolved
     * only when `currentSessionId` have a valid value.
     */
    createDBSession: function (forceNewSession) {
      var thisReporter = this;

      if (this.currentSessionId !== null && !forceNewSession)
        // A valid session is available, so just return it
        return Promise.resolve(this.currentSessionId);
      else
        // A new session must be created:
        return new Promise(function (resolve, reject) {
          if (thisReporter.initiated && thisReporter.userId !== null && thisReporter.currentSession !== null) {

            thisReporter.flushTasksPromise().then(function () {
              thisReporter.currentSessionId = null;
              var bean = new TCPReporter.ReportBean('add session');

              bean.setParam('project', thisReporter.currentSession.projectName);
              bean.setParam('time', Number(thisReporter.currentSession.started));
              bean.setParam('code', thisReporter.currentSession.code);
              bean.setParam('user', thisReporter.userId);
              bean.setParam('key', thisReporter.sessionKey);
              bean.setParam('context', thisReporter.sessionContext);

              thisReporter.transaction(bean.$bean)
                  .done(function (data, textStatus, jqXHR) {
                    thisReporter.currentSessionId = $(data).find('param[name="session"]').attr('value');
                    resolve(thisReporter.currentSessionId);
                  })
                  .fail(function (jqXHR, textStatus, errorThrown) {
                    thisReporter.stopReporting();
                    console.log('ERROR reporting data: ' + textStatus);
                    reject(null);
                  });
            });
          } else
            reject('Unable to start a new DB session');
        });
    },
    /**
     * Closes this reporting system
     * @override
     */
    end: function () {
      Reporter.prototype.end.call(this);
      this.reportActivity();
      this.flushTasksPromise();
      this.stopReporting();
    },
    /**
     * 
     * Performs a transaction on the remote server
     * @param {external:jQuery} $xml - The XML element to be transmited, wrapped into a jQuery object
     * @returns {external:jqXHR} - The {@link external:jqXHR} obtained as a result of a call to `$.ajax`.
     * This object should be treated as a {@link external:Promise} or
     * JQuery [Deferred](https://api.jquery.com/category/deferred-object/) object.
     */
    transaction: function ($xml) {
      return this.serviceUrl === null ?
          null :
          $.ajax({
            method: 'POST',
            url: this.serviceUrl,
            data: '<?xml version="1.0" encoding="UTF-8"?>' +
                (new XMLSerializer()).serializeToString($xml.get(0)),
            contentType: 'text/xml',
            dataType: 'xml'
          });
    },
    /**
     * 
     * Stops the reporting system, usually as a result of repeated errors or because the player should
     * be shut down.
     */
    stopReporting: function () {
      if (this.serviceUrl !== null) {
        this.serviceUrl = null;
        this.descriptionDetail = this.descriptionDetail + ' (' + this.ps.getMsg('currently not connected') + ')';
      }
      if (this.timer >= 0) {
        window.clearInterval(this.timer);
        this.timer = -1;
      }
      this.initiated = false;
    },
    /**
     * 
     * Prepares a {@link TCPReporter.ReportBean} object with information related to the current
     * activity, and pushes it into the list of pending `tasks`, to be processed by the main `timer`.
     */
    reportActivity: function () {
      if (this.lastActivity) {
        if (!this.lastActivity.closed)
          this.lastActivity.closeActivity();
        var actCount = this.actCount++;
        var act = this.lastActivity;
        var thisReporter = this;
        this.createDBSession(false).then(function () {
          var bean = new TCPReporter.ReportBean('add activity');
          bean.setParam('session', thisReporter.currentSessionId);
          bean.setParam('num', actCount);
          bean.appendData(act.$getXML());
          thisReporter.addTask(bean);
        });
      }
      if (this.currentSession !== null &&
          this.currentSession.currentSequence !== null &&
          this.currentSession.currentSequence.currentActivity !== this.lastActivity) {
        this.lastActivity = this.currentSession.currentSequence.currentActivity;
      } else
        this.lastActivity = null;
    },
    /**
     * 
     * This method should be invoked when the user starts a new activity
     * @override
     * @param {Activity} act - The {@link Activity} that has just started
     */
    newActivity: function (act) {
      Reporter.prototype.newActivity.call(this, act);
      this.reportActivity();
    }
  };
  /**
   * 
   * This inner class encapsulates a chunk of information in XML format, ready to be
   * transmitted to the remote reports server.
   * @class
   * @param id {string} - The main identifier of this ReportBean. Current valid values are:
   * `get property`, `get_properties`, `add session`, `add activity`, `get groups`, `get users`,
   * `get user data`, `get group data`, `new group`, `new user` and `multiple`.
   * @param $data {external:jQuery}+ - Optional XML data to be added to this bean
   */
  TCPReporter.ReportBean = function (id, $data) {
    this.$bean = $('<bean id="' + id + '"/>');
    if ($data)
      this.appendData($data);
  };

  TCPReporter.ReportBean.prototype = {
    constructor: TCPReporter.ReportBean,
    /**
     * The main jQuery XML object managed by this ReportBean
     * @type {external:jQuery} */
    $bean: null,
    /**
     * 
     * Adds  an XML element to the bean
     * @param {external:jQuery} $data - The XML element to be added to this bean
     */
    appendData: function ($data) {
      if ($data) {
        this.$bean.append($data);
      }
    },
    /**
     * 
     * Adds an XML element of type `param` to this ReportBean
     * @param {string} name - The key name of the parameter
     * @param {string|number|boolean} value - The value of the parameter
     */
    setParam: function (name, value) {
      if (typeof value !== 'undefined' && value !== null)
        this.appendData($('<param/>', {name: name, value: value}));
    }
  };

  // TCPReporter extends Reporter
  TCPReporter.prototype = $.extend(Object.create(Reporter.prototype), TCPReporter.prototype);

  // Register class in Reporter
  Reporter.CLASSES['TCPReporter'] = TCPReporter;

  return TCPReporter;

});
