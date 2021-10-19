/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
define([
    'knockout',
    'ojs/ojknockout'
], function(ko) {
    class ViewModel {}

    class View {
        render() {
            ko.applyBindings(new ViewModel(), document.getElementById('main-div'));
        }
    }

    return View;
});
