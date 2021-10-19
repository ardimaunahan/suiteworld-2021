/**
  Copyright (c) 2015, 2021, Oracle and/or its affiliates.
  Licensed under The Universal Permissive License (UPL), Version 1.0
  as shown at https://oss.oracle.com/licenses/upl/

*/

'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function(configObj) {
    return new Promise((resolve, reject) => {
        console.log('Running before_serve hook.');
        // ojet custom connect and serve options
        // { connectOpts, serveOpts } = configObj;
        // const express = require('express');
        // const http = require('http');
        // pass back custom http
        // configObj['http'] = http;
        // pass back custom express app
        // configObj['express'] = express();
        // pass back custom options for http.createServer
        // const serverOptions = {...};
        // configObj['serverOptions'] = serverOptions;
        // pass back custom server
        // configObj['server'] = http.createServer(serverOptions, express());
        // const tinylr = require('tiny-lr');
        // pass back custom live reload server
        // configObj['liveReloadServer'] = tinylr({ port: PORT });
        // pass back a replacement set of middleware
        // configObj['middleware'] = [...];
        // pass back a set of middleware that goes before the default middleware
        // configObj['preMiddleware'] = [...];
        // pass back a set of middleware that goes after the default middleware
        // configObj['postMiddleware'] = [...];
        const jetVersion = 'v11.0.2';

        _disableAllLanguagesInOjTranslations();
        _disableAllLanguagesInLocaleElements();

        function _disableAllLanguagesInOjTranslations() {
            var sourceFile = path.join(__dirname, '../../override/ojtranslations.js');
            var targetFile = path.join(
                __dirname,
                '../../web/js/libs/oj/' + jetVersion + '/resources/nls/ojtranslations.js'
            );
            fs.copyFile(sourceFile, targetFile, function(err) {
                if (err) throw err;

                console.log('Overridden ojtranslations.js');
            });
        }

        function _disableAllLanguagesInLocaleElements() {
            var sourceFile = path.join(__dirname, '../../override/localeElements.js');
            var targetFile = path.join(
                __dirname,
                '../../web/js/libs/oj/' + jetVersion + '/resources/nls/localeElements.js'
            );
            fs.copyFile(sourceFile, targetFile, function(err) {
                if (err) throw err;

                console.log('Overridden localeElements.js');
            });
        }

        resolve(configObj);
    });
};
