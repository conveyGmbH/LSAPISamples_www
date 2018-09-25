// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. 
(function () {
    "use strict";

    var globalObject =
        typeof window !== 'undefined' ? window :
        typeof self !== 'undefined' ? self :
        typeof global !== 'undefined' ? global :
        {};


    function schedule(f, arg, delay) {
        globalObject.setTimeout(function xhrCallback() {
            f(arg);
        }, delay);
    }

    function noop() {
    }

    var schemeRegex = /^(\w+)\:\/\//;

    var xhr = function (options) {
        /// <signature helpKeyword="xhr">
        /// <summary locid="xhr">
        /// Wraps calls to XMLHttpRequest in a promise.
        /// </summary>
        /// <param name="options" type="Object" locid="xhr_p:options">
        /// The options that are applied to the XMLHttpRequest object. They are: type,
        /// url, user, password, headers, responseType, data, and customRequestInitializer.
        /// </param>
        /// <returns type="Promise" locid="xhr_returnValue">
        /// A promise that returns the XMLHttpRequest object when it completes.
        /// </returns>
        /// </signature>
        var req;
        return new Promise(function (c, e, p) {
            /// <returns value="c(new XMLHttpRequest())" locid="xhr.constructor._returnValue" />
            var delay = 0;
            req = new globalObject.XMLHttpRequest();

            var isLocalRequest = false;
            var schemeMatch = schemeRegex.exec(options.url.toLowerCase());
            if (schemeMatch) {
                if (schemeMatch[1] === 'file') {
                    isLocalRequest = true;
                }
            } else if (globalObject.location.protocol === 'file:') {
                isLocalRequest = true;
            }

            req.onreadystatechange = function () {
                if (req._canceled) {
                    req.onreadystatechange = noop;
                    return;
                }
                if (req.readyState === 4) {
                    if ((req.status >= 200 && req.status < 300) || (isLocalRequest && req.status === 0)) {
                        schedule(c, req, delay);
                    } else {
                        schedule(e, req, delay);
                    }
                    req.onreadystatechange = noop;
                } else if (p && typeof p === "function") {
                    schedule(p, req, delay);
                }
            };

            req.open(
                options.type || "GET",
                options.url,
                // Promise based XHR does not support sync.
                //
                true,
                options.user,
                options.password
            );
            req.responseType = options.responseType || "";

                Object.keys(options.headers || {}).forEach(function (k) {
                    req.setRequestHeader(k, options.headers[k]);
                });

                if (options.customRequestInitializer) {
                    options.customRequestInitializer(req);
                }

                if (options.data === undefined) {
                    req.send();
                } else {
                    req.send(options.data);
                }
            },
            function () {
                req.onreadystatechange = noop;
                req._canceled = true;
                req.abort();
            }
        );
    }

    globalObject.xhr = xhr;

}());
