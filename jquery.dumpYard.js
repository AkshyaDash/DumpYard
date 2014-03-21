/*
 * DumpYard, jQuery plugin
 *
 * Copyright(c) 2014, Akshya Dash
 * 
 *
 * 2.0 Rewrite by Pradeep Kumar
 * 
 *
 * Form dump yard  allowing retrival of change history of DOM object
 * Licensed under the MIT License
 */
(function ($) {

    var toggleDumpYard = false;
    /**
    * Kind of the class for storing dom history
    * @param {domId} 
    */
    var DomHistory = function (domId) {

        this.domId = domId;
        // this.domLabel = TBD

        this.domValues = new Array();

        this.AddDomValue = function (timeStamp, domContent) {

            var domContentObj = new DomContent(timeStamp, domContent);
            this.domValues.push(domContentObj);

        };

    };

    var DomContent = function (timeStamp, domContent) {
        this.timeStamp = timeStamp;
        this.content = domContent;

    };
    
    // need to declare the methods as we need this in init method
    var InputDom = function (thisDom) {
        var currValue;
        this.id = thisDom.id;
        this.domType = $(thisDom).getType();
        
        if (this.domType == "text" || this.domType == "textarea") {
            currValue = $(thisDom).val();
        } else if (this.domType == "checkbox") {
            currValue = $(thisDom).attr('checked') ? 'Checked' : 'unchecked';
        } else if (this.domType == "file") {
            currValue = $(thisDom).val();
        } else if (this.domType == "radio") {
            currValue = $(thisDom).attr('checked') ? 'Checked' : 'unchecked';
        }
        else if (this.domType == "select") {
            currValue = $('#' + thisDom.id + ' option:selected').text();
        }else {
            return null;
        }


        this.value = currValue;
       
    };
    
    // need to declare the methods as we need this in init method
    var RestoreValue = function (thisDom) {
        
        var valToRestore = thisDom.previousElementSibling.innerHTML;
        var elemIdToRest = thisDom.parentNode.parentNode.parentNode.children.takeMe.title;
     
     
        var domType = $("#" + elemIdToRest).getType();

        if (domType == "text" || domType == "textarea") {
            $("#" + elemIdToRest).val(valToRestore);
          
        } else if (domType == "checkbox") {
            
            $("#" + elemIdToRest).prop('checked', (valToRestore == 'Checked' ? true : false));
           
        } else if (domType == "file") {
            alert("The operation is insecure");

        } else if (domType == "radio") {
            $("#" + elemIdToRest).prop('checked', (valToRestore == 'Checked' ? true : false));
        }
        else if (domType == "select") {
            $("#" + elemIdToRest + " option").each(function () {
                if ($(this).text() == valToRestore) {
                    $(this).attr('selected', 'selected');
                    return true;
                }
            });

       
           
        } else {
            return false;
        }


       
    };

    var localstorage = {
        set: function (key, value) {
            window.localStorage.setItem(key, JSON.stringify(value));
        },
        get: function (key) {
            try {
                return JSON.parse(window.localStorage.getItem(key));
            } catch (e) {
                return null;
            }
        },
        update: function (key, value) {
            localStorage.removeItem(key);
            window.localStorage.setItem(key, JSON.stringify(value));
        }

    };

    var methods = {

        /**
		* Kind of the constructor, called before any action
		* @param {Map} user options
		*/
        init: function (options) {
            var form = this;
            if (!form.data('jqv') || form.data('jqv') == null) {

                // attach the DUMPYARD BUTTON
                var divAdd = '<div><div class="right-tab" id="toggleDiv"></div><div id="divContent" style="display: none;vertical-align: bottom;"><ul></ul><span style=""><div  class="refreshStorage"/><div class="settingDump"/></span></div></div>';
                $("body").append(divAdd);
                options = methods._saveOptions(form, options);
                // bind all formError elements to close on click
                $(":input").on(options.eventTrigger, function () {

                    var domId;
                    var timeStamp;
                    var content;
                    var isThere = false;
                    var inputDom = null;
                    // if the dom is not in Drum Yard Mode
                    if (!toggleDumpYard) {
                        if (this.id) {
                            domId = this.id; //+ methods._escapeExpression(document.location.href);
                            // Set the input object details
                            inputDom = new InputDom(this);
                        } else {
                            return false;
                        }
                        // alert( $(this).getType());
                        if (inputDom != null) {
                            if ('localStorage' in window && window['localStorage'] !== null) {
                                try {
                                    if (window.localStorage.length != 0) {
                                        // get the dom history from storage
                                        var dochistory = localstorage.get(domId);
                                        if (dochistory != null) {
                                            isThere = true;
                                            timeStamp = methods.GetNow();
                                            content = inputDom.value;
                                            methods.AddDomValue(timeStamp, content, dochistory.domValues);
                                            // update the old value
                                            localstorage.update(domId, dochistory);
                                        }
                                    }
                                    if (!isThere) {
                                        var domHist = new DomHistory(domId);
                                        timeStamp = methods.GetNow();
                                        content = inputDom.value;
                                        domHist.AddDomValue(timeStamp, content);

                                        // create a new entry
                                        localstorage.set(domId, domHist);
                                    }

                                } catch (e) {
                                    if (e == QUOTA_EXCEEDED_ERR) {
                                        alert('Quota exceeded!');
                                    }
                                }
                            } else {
                                alert('Cannot store user preferences as your browser do not support local storage');
                            }
                        }
                    }
                });

                $(":input").on("click", function () {
                    // if the dom is on Drum Yard Mode
                    if (toggleDumpYard) {
                        var domId;
                        if (this.id) {
                            domId = this.id; //+ methods._escapeExpression(document.location.href);
                        } else {
                            domId = document.location.href;
                        }

                        if ('localStorage' in window && window['localStorage'] !== null) {
                            try {

                                if ($("#" + domId + "UL").length == 0) {

                                    if (window.localStorage.length != 0) {
                                        // get the dom history from storage for that dom
                                        var dochistory = localstorage.get(domId);
                                        if (dochistory != null) {

                                            //get the history data
                                            var histData = dochistory.domValues;
                                            $('#divContent ul:first li').removeClass('active');
                                            $('#divContent ul:first').append($("<li class='active'>"));
                                            if (histData.length > 0) {
                                                $('#divContent ul:first li:last').append("<h3 id='takeMe' title='" + domId + "'>" + domId + "<div  class='trashIt' /></h3>");
                                                $('#divContent ul:first li:last').append("<ul id= '" + domId + "UL' style='list-style: none'>");
                                            
                                                //fill the list with history data
                                                histData.forEach(function (item) {
                                                    if (item.timeStamp) {
                                                        var li = '<li> <span>' + item.timeStamp + ': </span><span>' + item.content + '</span> <div class="restoreIt"/></li>';

                                                        
                                                        $("#divContent ul#" + domId + "UL").append(li);
                                                    }
                                                });

                                                // List show/hide logic
                                                $("#divContent h3").on("click", function () {

                                                    $('#divContent ul:first li').removeClass('active');
                                                    $(this.parentNode).addClass('active');
                                                    //slide up all the link lists
                                                    //  $("#divContent ul:first ul").slideUp();
                                                    //slide down the link list below the h3 clicked - only if its closed
                                                    if (!$(this.parentNode).next().is(":visible")) {
                                                        $(this.parentNode).next().slideDown();
                                                    }
                                                });
                                                
                                                // remove record
                                                $(".trashIt").on("click", function () {
                                                    $(this).closest('li').remove();


                                                });
                                                $(".restoreIt").on("click", function () {

                                                    RestoreValue(this);
                                                });

                                            }


                                        }
                                    }

                                } else {
                                    $('#divContent ul:first li').removeClass('active');
                                    $($("#" + domId + "UL").parentsUntil()[0]).addClass('active');
                                }
                            } catch (e) {
                                if (e == QUOTA_EXCEEDED_ERR) {
                                    alert('Quota exceeded!');
                                }
                            }
                        } else {
                            alert('Cannot store user preferences as your browser do not support local storage');
                        }
                    }
                });

                //Toggle DumpYard 
                $("#toggleDiv").on("click", function () {

                    toggleDumpYard = !toggleDumpYard;
                    $('#divContent ul:first').empty();
                    $('#divContent').display = 'block';
                    $('#divContent').animate({
                        width: 'toggle'
                    }, "slow");

                });
                $("#refreshStorage").on("click", function () {

                    var conf = confirm("Do you want to clear all information permanently?");
                    if (conf) {
                        // clear the local storage
                        window.localStorage.clear();
                        
                        //remove the data being shown
                        $('#divContent ul:first').empty();
                    }
                });
                
            }
            return this;
        },

        AddDomValue: function (timeStamp, domContent, domHist) {

            var domContentObj = new DomContent(timeStamp, domContent);
            domHist.push(domContentObj);


        },


        GetDomContent: function (timeStamp, domHist) {
            var result = $.grep(domHist, function (item) {
                return item.timeStamp == timeStamp;
            });

            return result;
        },


        AddZero: function (num) {
            return (num >= 0 && num < 10) ? "0" + num : num + "";
        },


        GetNow: function () {
            var now = new Date();
            var strDateTime = [[methods.AddZero(now.getDate()), methods.AddZero(now.getMonth() + 1), now.getFullYear()].join("/"), [methods.AddZero(now.getHours()), methods.AddZero(now.getMinutes())].join(":"), now.getHours() >= 12 ? "PM" : "AM"].join("-");

            return strDateTime;
        },

        /**
		
		* Takes an optional params: a list of options
		* ie. jQuery("#formID1").setDumpYard('attach', {promptPosition : "centerRight"});
		*/
        attach: function (userOptions) {

            var form = this;
            var options;

            if (userOptions)
                options = methods._saveOptions(form, userOptions);
            else
                options = form.data('jqv');


            return this;
        },
        /**
		* Unregisters any bindings that may point to jQuery.setDumpYard
		*/
        detach: function () {

            var form = this;
            var options = form.data('jqv');

            // unbind fields
            form.find("[" + options.validateAttribute + "*=validate]").not("[type=checkbox]").off(options.validationEventTrigger, methods._onFieldEvent);
            form.find("[" + options.validateAttribute + "*=validate][type=checkbox],[class*=validate][type=radio]").off("click", methods._onFieldEvent);

            // unbind form.submit
            form.off("submit", methods._onSubmitEvent);
            form.removeData('jqv');

            form.off("click", "a[data-validation-engine-skip], a[class*='validate-skip'], button[data-validation-engine-skip], button[class*='validate-skip'], input[data-validation-engine-skip], input[class*='validate-skip']", methods._submitButtonClick);
            form.removeData('jqv_submitButton');

            if (options.autoPositionUpdate)
                $(window).off("resize", methods.updatePromptsPosition);

            return this;
        },


        /**
		* Closes form error prompts, CAN be invidual
		*/
        hide: function () {
            var form = $(this).closest('form, .validationEngineContainer');
            var options = form.data('jqv');
            var fadeDuration = (options && options.fadeDuration) ? options.fadeDuration : 0.3;
            var closingtag;

            if ($(this).is("form") || $(this).hasClass("validationEngineContainer")) {
                closingtag = "parentForm" + methods._getClassName($(this).attr("id"));
            } else {
                closingtag = methods._getClassName($(this).attr("id")) + "formError";
            }
            $('.' + closingtag).fadeTo(fadeDuration, 0.3, function () {
                $(this).parent('.formErrorOuter').remove();
                $(this).remove();
            });
            return this;
        },
        /**
        * Closes all error prompts on the page
        */
        hideAll: function () {

            var form = this;
            var options = form.data('jqv');
            var duration = options ? options.fadeDuration : 300;
            $('.formError').fadeTo(duration, 300, function () {
                $(this).parent('.formErrorOuter').remove();
                $(this).remove();
            });
            return this;
        },
        /**
		* Typically called when user exists a field using tab or a mouse click, triggers a field
		* validation
		*/
        _onFieldEvent: function (event) {
            var field = $(this);
            var form = field.closest('form, .validationEngineContainer');
            var options = form.data('jqv');
            options.eventTrigger = "field";
            // validate the current field
            window.setTimeout(function () {
                methods._validateField(field, options);
                if (options.InvalidFields.length == 0 && options.onFieldSuccess) {
                    options.onFieldSuccess();
                } else if (options.InvalidFields.length > 0 && options.onFieldFailure) {
                    options.onFieldFailure();
                }
            }, (event.data) ? event.data.delay : 0);

        },



     


        /**
		* Checks if valid date
		*
		* @param {string} date string
		* @return a bool based on determination of valid date
		*/
        _isDate: function (value) {
            var dateRegEx = new RegExp(/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$|^(?:(?:(?:0?[13578]|1[02])(\/|-)31)|(?:(?:0?[1,3-9]|1[0-2])(\/|-)(?:29|30)))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^(?:(?:0?[1-9]|1[0-2])(\/|-)(?:0?[1-9]|1\d|2[0-8]))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^(0?2(\/|-)29)(\/|-)(?:(?:0[48]00|[13579][26]00|[2468][048]00)|(?:\d\d)?(?:0[48]|[2468][048]|[13579][26]))$/);
            return dateRegEx.test(value);
        },
        /**
		* Checks if valid date time
		*
		* @param {string} date string
		* @return a bool based on determination of valid date time
		*/
        _isDateTime: function (value) {
            var dateTimeRegEx = new RegExp(/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])\s+(1[012]|0?[1-9]){1}:(0?[1-5]|[0-6][0-9]){1}:(0?[0-6]|[0-6][0-9]){1}\s+(am|pm|AM|PM){1}$|^(?:(?:(?:0?[13578]|1[02])(\/|-)31)|(?:(?:0?[1,3-9]|1[0-2])(\/|-)(?:29|30)))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^((1[012]|0?[1-9]){1}\/(0?[1-9]|[12][0-9]|3[01]){1}\/\d{2,4}\s+(1[012]|0?[1-9]){1}:(0?[1-5]|[0-6][0-9]){1}:(0?[0-6]|[0-6][0-9]){1}\s+(am|pm|AM|PM){1})$/);
            return dateTimeRegEx.test(value);
        },
        /**
		* Checks that it is a valid credit card number according to the
		* Luhn checksum algorithm.
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
        _creditCard: function (field, rules, i, options) {
            //spaces and dashes may be valid characters, but must be stripped to calculate the checksum.
            var valid = false, cardNumber = field.val().replace(/ +/g, '').replace(/-+/g, '');

            var numDigits = cardNumber.length;
            if (numDigits >= 14 && numDigits <= 16 && parseInt(cardNumber) > 0) {

                var sum = 0, i = numDigits - 1, pos = 1, digit, luhn = new String();
                do {
                    digit = parseInt(cardNumber.charAt(i));
                    luhn += (pos++ % 2 == 0) ? digit * 2 : digit;
                } while (--i >= 0)

                for (i = 0; i < luhn.length; i++) {
                    sum += parseInt(luhn.charAt(i));
                }
                valid = sum % 10 == 0;
            }
            if (!valid) return options.allrules.creditCard.alertText;
        },

        /**
		* date -> string
		*
		* @param {Object} date
		*/
        _dateToString: function (date) {
            return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        },
        /**
		* Parses an ISO date
		* @param {String} d
		*/
        _parseDate: function (d) {

            var dateParts = d.split("-");
            if (dateParts == d)
                dateParts = d.split("/");
            if (dateParts == d) {
                dateParts = d.split(".");
                return new Date(dateParts[2], (dateParts[1] - 1), dateParts[0]);
            }
            return new Date(dateParts[0], (dateParts[1] - 1), dateParts[2]);
        },

        /**
		  * Returns the escapade classname
		  *
		  * @param {selector}
		  *            className
		  */
        _escapeExpression: function (selector) {
            return selector.replace(/([#;&,\.\+\*\~':"\!\^$\[\]\(\)=>\|])/g, "\\$1");
        },
        /**
		 * returns true if we are in a RTLed document
		 *
		 * @param {jqObject} field
		 */
        isRTL: function (field) {
            var $document = $(document);
            var $body = $('body');
            var rtl =
				(field && field.hasClass('rtl')) ||
				(field && (field.attr('dir') || '').toLowerCase() === 'rtl') ||
				$document.hasClass('rtl') ||
				($document.attr('dir') || '').toLowerCase() === 'rtl' ||
				$body.hasClass('rtl') ||
				($body.attr('dir') || '').toLowerCase() === 'rtl';
            return Boolean(rtl);
        },

        /**
		* Saves the user options and variables in the form.data
		*
		* @param {jqObject}
		*            form - the form where the user option should be saved
		* @param {Map}
		*            options - the user options
		* @return the user options (extended from the defaults)
		*/
        _saveOptions: function (form, options) {

            //// is there a language localisation ?
            //if ($.validationEngineLanguage)
            //var allRules = $.validationEngineLanguage.allRules;
            //else
            //$.error("jQuery.validationEngine rules are not loaded, plz add localization files to the page");
            //// --- Internals DO NOT TOUCH or OVERLOAD ---
            //// validation rules and i18
            //$.validationEngine.defaults.allrules = allRules;

            var userOptions = $.extend(true, {}, $.setDumpYard.defaults, options);

            form.data('jqv', userOptions);
            return userOptions;
        },

        /**
        * Removes forbidden characters from class name
        * @param {String} className
        */
        _getClassName: function (className) {
            if (className)
                return className.replace(/:/g, "_").replace(/\./g, "_");
        },
        /**
		 * Escape special character for jQuery selector
		 * http://totaldev.com/content/escaping-characters-get-valid-jquery-id
		 * @param {String} selector
		 */
        _jqSelector: function (str) {
            return str.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
        },


        _submitButtonClick: function (event) {
            var button = $(this);
            var form = button.closest('form, .validationEngineContainer');
            form.data("jqv_submitButton", button.attr("id"));
        }
    };

    /**
    * Plugin entry point.
    * You may pass an action as a parameter or a list of options.
    * if none, the init and attach methods are being called.
    * Remember: if you pass options, the attached method is NOT called automatically
    *
    * @param {String}
    *            method (optional) action
    */
    $.fn.setDumpYard = function (method) {

        var form = $(this);
        if (!form[0]) return form;  // stop here if the form does not exist

        if (typeof (method) == 'string' && method.charAt(0) != '_' && methods[method]) {

            // make sure init is called once
            if (method != "showPrompt")
                methods.init.apply(form);

            return methods[method].apply(form, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method == 'object' || !method) {

            // default constructor with or without arguments
            methods.init.apply(form, arguments);
            return methods.attach.apply(form);
        } else {
            $.error('Method ' + method + ' does not exist in jQuery.setDumpYard');
        }


    };

    $.fn.getType = function () { return this[0].tagName == "INPUT" ? this[0].type.toLowerCase() : this[0].tagName.toLowerCase(); }


    // LEAK GLOBAL OPTIONS
    $.setDumpYard = {
        fieldIdCounter: 0, defaults: {

            // Name of the event triggering field value to be stored
            eventTrigger: "blur",
            // Automatically scroll viewport 
            scroll: true,

            // Opening box position, possible locations are: topLeft,
            // topRight, bottomLeft, centerRight, bottomRight, inline
            promptPosition: "topRight",

        }
    };
    $(function () { $.setDumpYard.defaults.promptPosition = methods.isRTL() ? 'topLeft' : "topRight" });
})(jQuery);


