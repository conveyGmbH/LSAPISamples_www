(function () {
    "use strict";

    var globalObject =
        typeof window !== 'undefined' ? window :
        typeof self !== 'undefined' ? self :
        typeof global !== 'undefined' ? global :
        {};

    var odata = {
        _serverName: "lstest.convey.de",
        _apiName: "apitest",
        _user: "testuser",
        _password: "testpwd"
    };

    function init(serverName, apiName, user, password) {
        odata._serverName = serverName;
        odata._apiName = apiName;
        odata._user = user;
        odata._password = password;
    }
    odata.init = init;

    var viewData = function viewDataCtor(viewName) {
        this._viewName = viewName;

        this.select = function (filterString, orderByString) {
            var url = "https://" + odata._serverName +
                "/" + odata._apiName +
                "/" + this._viewName +
                "?$format=json";
            if (filterString && filterString.length > 0) {
                url += "&$filter=(" + filterString + ")";
            }
            if (orderByString) {
                url += "&$orderby=" + orderByString;
            }
            var options = {
                type: "GET",
                url: url,
                user: odata._user,
                password: odata._password,
                customRequestInitializer: function (req) {
                    if (typeof req.withCredentials !== "undefined") {
                        req.withCredentials = true;
                    }
                }
            };
            var ret = xhr(options);
            return ret;
        };

        this.selectById = function (id) {
            var url = "https://" + odata._serverName +
                "/" + odata._apiName +
                "/" + this._viewName +
                "(" + id + ")" +
                "?$format=json";
            var options = {
                type: "GET",
                url: url,
                user: odata._user,
                password: odata._password,
                customRequestInitializer: function (req) {
                    if (typeof req.withCredentials !== "undefined") {
                        req.withCredentials = true;
                    }
                }
            };
            var ret = xhr(options);
            return ret;
        };

        this.insert = function (newRecord, bWithId) {
            var url = "https://" + odata._serverName +
                "/" + odata._apiName +
                "/" + this._viewName +
                "?$format=json";
            var options = {
                type: "POST",
                url: url,
                data: JSON.stringify(newRecord),
                user: odata._user,
                password: odata._password,
                customRequestInitializer: function (req) {
                    if (typeof req.withCredentials !== "undefined") {
                        req.withCredentials = true;
                    }
                },
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            };
            var ret = xhr(options);
            return ret;
        };
    };

    odata.ViewData = viewData;
    odata.call = function(name, params) {
        var paramsString = "";
        for (var prop in params) {
            if (params.hasOwnProperty(prop)) {
                paramsString += prop + "=";
                if (typeof params[prop] === "string") {
                    paramsString += "'" + encodeURI(params[prop]) + "'";
                } else {
                    paramsString += params[prop];
                }
                paramsString += "&";
            }
        }
        var url = "https://" +
            odata._serverName +
            "/" +
            odata._apiName +
            "/" +
            name +
            "?" +
            paramsString +
            "$format=json";
        var options = {
            type: "GET",
            url: url,
            user: odata._user,
            password: odata._password,
            customRequestInitializer: function(req) {
                if (typeof req.withCredentials !== "undefined") {
                    req.withCredentials = true;
                }
            }
        };
        var ret = xhr(options);
        return ret;
    };

    globalObject["OData"] = odata;

}());
