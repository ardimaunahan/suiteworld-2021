/**
  Copyright (c) 2015, 2021, Oracle and/or its affiliates.
  Licensed under The Universal Permissive License (UPL), Version 1.0
  as shown at https://oss.oracle.com/licenses/upl/

*/

'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function (configObj) {
    return new Promise((resolve, reject) => {
        console.log('Running before_release_build hook.');

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
