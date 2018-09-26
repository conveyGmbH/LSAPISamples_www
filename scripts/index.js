(function() {
    "use strict";

    var globalObject =
        typeof window !== 'undefined'
            ? window
            : typeof self !== 'undefined'
            ? self
            : typeof global !== 'undefined'
            ? global
            : {};

    function getuuid() {
        var chars = '0123456789abcdef'.split('');
        var uuid = [], rnd = Math.random, r;
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4'; // version 4

        for (var i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | rnd() * 16;

                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
            }
        }
        return uuid.join('');
    }

    function getControlValue(element, id) {
        if (element) {
            var input = element.querySelector("#" + id);
            if (input) {
                return input.value;
            }
        }
        return null;
    }

    function getErrorMsgFromResponse(errorResponse) {
        var errorMsg = "";
        if (errorResponse) {
            if (typeof errorResponse === "string") {
                errorMsg += errorResponse;
            } else if (typeof errorResponse === "number") {
                errorMsg += "Error Status: " + errorResponse;
            } else if (typeof errorResponse === "object") {
                if (errorResponse.status || errorResponse.code) {
                    errorMsg += "Error Status: ";
                    errorMsg += (errorResponse.status || errorResponse.code);
                    if (errorResponse.statusText || errorResponse.message) {
                        errorMsg += " " + (errorResponse.statusText || errorResponse.message);
                    }
                } else if (errorResponse.statusText || errorResponse.message) {
                    errorMsg += errorResponse.statusText || errorResponse.message;
                }
                if (!errorResponse.data && (errorResponse.responseText || errorResponse.response)) {
                    try {
                        errorResponse.data = JSON.parse(errorResponse.responseText || errorResponse.response);
                    } catch (exception) {
                        var div = document.createElement("div");
                        div.innerHTML = errorResponse.responseText || errorResponse.response;
                        errorResponse.data = {
                            error: {
                                message: {
                                    value: div.textContent
                                }
                            }
                        }
                    }
                }
                if (errorResponse.data) {
                    var data = errorResponse.data;
                    if (data.error) {
                        if (data.error.code) {
                            if (errorMsg.length > 0) {
                                errorMsg += "\r\n";
                            }
                            errorMsg += "Detailed Code: " + data.error.code;
                        }
                        if (data.error.message && data.error.message.value) {
                            if (errorMsg.length > 0) {
                                errorMsg += "\r\n";
                            }
                            errorMsg += data.error.message.value;
                        }
                    }
                    if (data.code || data.errno || data.hostname || data.syscall) {
                        errorMsg += "\r\nhostname: " +
                            data.hostname +
                            "\r\nsyscall: " +
                            data.syscall +
                            "\r\ncode: " +
                            data.code +
                            "\r\nerrno: " +
                            data.errno;
                    }
                }
            }
        }
        return errorMsg;
    }

    function showError(message) {
        var errorBox = document.querySelector(".error-box");
        if (errorBox) {
            errorBox.textContent = message;
        }
    }

    var employeeId = 0;
    var eventId = 0;

    function showResults(name, response) {
        if (response) {
            try {
                var resultBox = document.querySelector(".result-box");
                if (resultBox) {
                    var results = [];
                    if (response.responseText) {
                        var json = JSON.parse(response.responseText);
                        if (json.d) {
                            if (json.d.results) {
                                // array result set
                                results = json.d.results;
                            } else {
                                // single-row result
                                results.push(json.d);
                            }
                        }
                    }
                    var innerHtml = "<h3>" + name + "</h3>";
                    if (results.length > 0) {
                        // save out Ids from result
                        if (name === "LSA_Employee") {
                            employeeId = results[0].EmployeeID;
                            eventId = results[0].EventID;
                        }
                        innerHtml += "<table>";
                        for (var i = 0; i < results.length; i++) {
                            var row = results[i];
                            var col;
                            if (!i) {
                                innerHtml += "<thead><tr>";
                                for (col in row) {
                                    if (row.hasOwnProperty(col) && col.substr(0, 2) !== "__") {
                                        innerHtml += "<th>" + col + "</th>";
                                    }
                                }
                                innerHtml += "</tr></thead><tbody>";
                            }
                            innerHtml += "<tr>";
                            for (col in row) {
                                if (row.hasOwnProperty(col) && col.substr(0, 2) !== "__") {
                                    var value = row[col];
                                    if (typeof value === "string" && value.substr(0, 6) === "/Date(") {
                                        var ms = parseInt(value.substr(6, value.length - 8));
                                        var date = new Date(ms);
                                        value = date.toLocaleDateString() + " " + date.toLocaleTimeString();
                                    }
                                    innerHtml += "<td>" + value + "</td>";
                                }
                            }
                            innerHtml += "</tr>";
                        };
                        innerHtml += "</tbody></table>";
                    }
                    resultBox.innerHTML = innerHtml;
                    if (resultBox.style) {
                        resultBox.style.display = "block";
                    }
                }
            } catch (e) {
                showError("Error: exception occurred while parsing response! " + e.toString());
            }
        }
    }

    var viewnames = [
        "",
        "LSA_LanguageSpecExt",
        "LSA_LGNTINITLanguage",
        "LSA_LGNTINITCountry",
        "LSA_LGNTINITAddress",
        "LSA_LGNTINITUserPresence",
        "LSA_LGNTINITOptionType",
        "LSA_LOADEvent",
        "LSA_CREventOption",
        "LSA_Employee",
        "LSA_MandatoryFields",
        "LSA_UserInfo",
        "LSA_DOC1Employee",
        "LSA_Contact",
        ">> add new contact"
    ];

    function showScenarioSelect() {
        var loginBox = document.querySelector(".login-box");
        if (loginBox && loginBox.style) {
            loginBox.style.display = "none";
        }
        var logoffBox = document.querySelector(".logoff-box");
        if (logoffBox && logoffBox.style) {
            logoffBox.style.display = "block";
        }
        var selectBox = document.querySelector(".select-box");
        if (selectBox && logoffBox.style) {
            selectBox.style.display = "block";
        }
        var selectElement = selectBox.querySelector("#viewname");
        if (selectElement && selectElement.options) {
            if (!selectElement.options.length) {
                for (var i = 0; i < viewnames.length; i++) {
                    var option = document.createElement("option");
                    option.text = viewnames[i];
                    selectElement.options.add(option);
                }
            }
            selectElement.onchange = function(event) {
                if (selectElement.options.selectedIndex < selectElement.options.length - 1) {
                    var selectedOption = selectElement.options[selectElement.options.selectedIndex];
                    if (selectedOption.text) {
                        selectView(selectedOption.text);
                        hideNewContact();
                    }
                } else {
                    showNewContact();
                }
            }
        }
    }

    function hideScenarioSelect() {
        var loginBox = document.querySelector(".login-box");
        if (loginBox && loginBox.style) {
            loginBox.style.display = "block";
        }
        var logoffBox = document.querySelector(".logoff-box");
        if (logoffBox && logoffBox.style) {
            logoffBox.style.display = "none";
        }
        var resultBox = document.querySelector(".result-box");
        if (resultBox && resultBox.style) {
            resultBox.style.display = "none";
        }
        var selectBox = document.querySelector(".select-box");
        if (selectBox && selectBox.style) {
            selectBox.style.display = "none";
        }
    }

    function showNewContact() {
        var resultBox = document.querySelector(".result-box");
        if (resultBox && resultBox.style) {
            resultBox.style.display = "none";
        }
        var contactBox = document.querySelector(".contact-box");
        if (contactBox && contactBox.style) {
            var editBoxes = contactBox.querySelectorAll(".edit-box");
            for (var i = 0; i < editBoxes.length; i++) {
                editBoxes[i].value = "";
            }
            contactBox.style.display = "block";
        }
    }

    function hideNewContact() {
        var contactBox = document.querySelector(".contact-box");
        if (contactBox && contactBox.style) {
            contactBox.style.display = "none";
        }
    }

    function selectView(name) {
        var dataView = new OData.ViewData(name);

        var filterString = "";
        if (name.substr(0, 8) === "LSA_LGNT") {
            var langId = 1033;
            filterString = "LanguageSpecID%20eq%20" + langId;
        }
        return dataView.select(filterString).then(function(response) {
                //returns success
                showResults(name, response);
                return Promise.resolve(response);
            },
            function(errorResponse) {
                //returns error
                showError(getErrorMsgFromResponse(errorResponse));
                return Promise.reject(errorResponse);
            });
    }

    function insertView(name, newRecord) {
        var dataView = new OData.ViewData(name);

        return dataView.insert(newRecord).then(function(response) {
                //returns success
                showResults(name, response);
                return Promise.resolve(response);
            }, function(errorResponse) {
                //returns error
                showError(getErrorMsgFromResponse(errorResponse));
                return Promise.reject(errorResponse);
            });
    }

    var clickHandler = {
        login: function(event) {
            showError("");
            var parent = event.currentTarget && event.currentTarget.parentElement;
            var servername = getControlValue(parent, "servername");
            var apiname = getControlValue(parent, "apiname");
            var user = getControlValue(parent, "user");
            var password = getControlValue(parent, "password");
            if (servername && apiname && user && password) {

                // init odata login information
                OData.init(servername, apiname, user, password);

                // select from employee view
                selectView("LSA_Employee").then(function() {
                    showScenarioSelect();
                }, function() {
                    hideScenarioSelect();
                });
            }
        },
        logoff: function(event) {
            showError("");
            // reset odata login information
            OData.init(null, null, null, null);
            hideScenarioSelect();
        },
        insertContact: function(event) {
            showError("");
            // get new record
            var contactRecord = document.querySelector(".contact-record");
            if (contactRecord) {
                var elements = contactRecord.querySelectorAll(".edit-box");
                var newContactRecord = {
                    EmployeeID: employeeId,
                    EventID: eventId,
                    Incomplete: 1,
                    HostName: getuuid()
                };
                for (var i = 0; i < elements.length; i++) {
                    newContactRecord[elements[i].id] = elements[i].value;
                }
                insertView("LSA_Contact", newContactRecord).then(function() {
                    hideNewContact();
                    var selectBox = document.querySelector(".select-box");
                    if (selectBox) {
                        var selectElement = selectBox.querySelector("#viewname");
                        if (selectElement && selectElement.options) {
                            selectElement.options.selectedIndex = 0;
                        }
                    }
                });
            }
        },
        insertBarcode: function(event) {
            showError("");
            // get new record
            var contactRecord = document.querySelector(".barcode-record");
            if (contactRecord) {
                var contactId = 0;
                var newContactRecord = {
                    EmployeeID: employeeId,
                    EventID: eventId,
                    Incomplete: 1,
                    HostName: getuuid()
                };
                var contactView = new OData.ViewData("LSA_Contact");
                contactView.insert(newContactRecord).then(function(response) {
                    //returns success
                    try {
                        var json = response && JSON.parse(response.responseText);
                        if (json && json.d) {
                            var newBarcodeRecord = {
                                ContactID: json.d.ContactID
                            };
                            var elements = contactRecord.querySelectorAll(".edit-box");
                            for (var i = 0; i < elements.length; i++) {
                                newBarcodeRecord[elements[i].id] = elements[i].value;
                            }
                            var barcodeView = new OData.ViewData("LSA_ImportBarcodeScan");
                            return barcodeView.insert(newBarcodeRecord);
                        } else {
                            showError("Error: No data returned from insert contact!");
                            return null;
                        }
                    } catch (e) {
                        showError("Error: exception occurred while parsing response! " + e.toString());
                        return null;
                    }
                }).then(function(response) {
                    //returns success
                    try {
                        var json = response && JSON.parse(response.responseText);
                        if (json && json.d) {
                            var params = {
                                p_ContactID: json.d.ContactID,
                                p_TimeoutSec: 10
                            }
                            return OData.call("PRC_GetRecognizedContact", params);
                        } else {
                            showError("Error: No data returned from insert contact!");
                            return null;
                        }
                    } catch (e) {
                        showError("Error: exception occurred while parsing response! " + e.toString());
                        return null;
                    }
                }).then(function(response) {
                        //returns success
                        showResults(name, response);
                        hideNewContact();
                    },
                    function(errorResponse) {
                        //returns error
                        showError(getErrorMsgFromResponse(errorResponse));
                    });
            }
        },
        insertQrcode: function(event) {
            showError("");
            // get new record
            var contactRecord = document.querySelector(".qrcode-record");
            if (contactRecord) {
                var contactId = 0;
                var newContactRecord = {
                    EmployeeID: employeeId,
                    EventID: eventId,
                    Incomplete: 1,
                    HostName: getuuid()
                };
                var contactView = new OData.ViewData("LSA_Contact");
                contactView.insert(newContactRecord).then(function(response) {
                    //returns success
                    try {
                        var json = response && JSON.parse(response.responseText);
                        if (json && json.d) {
                            var newBarcodeRecord = {
                                ContactID: json.d.ContactID,
                                Button: "VCARD_TODO"
                            };
                            var elements = contactRecord.querySelectorAll(".edit-box");
                            for (var i = 0; i < elements.length; i++) {
                                newBarcodeRecord[elements[i].id] = elements[i].value;
                            }
                            var barcodeView = new OData.ViewData("LSA_ImportCardscan");
                            return barcodeView.insert(newBarcodeRecord);
                        } else {
                            showError("Error: No data returned from insert contact!");
                            return null;
                        }
                    } catch (e) {
                        showError("Error: exception occurred while parsing response! " + e.toString());
                        return null;
                    }
                }).then(function(response) {
                    //returns success
                    try {
                        var json = response && JSON.parse(response.responseText);
                        if (json && json.d) {
                            var params = {
                                p_ContactID: json.d.ContactID,
                                p_TimeoutSec: 10
                            }
                            return OData.call("PRC_GetRecognizedContact", params);
                        } else {
                            showError("Error: No data returned from insert contact!");
                            return null;
                        }
                    } catch (e) {
                        showError("Error: exception occurred while parsing response! " + e.toString());
                        return null;
                    }
                }).then(function(response) {
                        //returns success
                        showResults(name, response);
                        hideNewContact();
                    },
                    function(errorResponse) {
                        //returns error
                        showError(getErrorMsgFromResponse(errorResponse));
                    });
            }
        }
    };


    var ready = function() {
        var buttons = document.querySelectorAll("button.push-button");
        for (var i = 0; i < buttons.length; i++) {
            var name = buttons[i].id;
            buttons[i].onclick = clickHandler[name];
        }
    };
    globalObject.onload = setTimeout(ready, 0);

}());