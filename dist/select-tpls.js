angular.module('oi.select', []);
angular.module('oi.select')

.provider('oiSelect', function() {
    return {
        options: {
            debounce:       500,
            searchFilter:   'oiSelectCloseIcon',
            dropdownFilter: 'oiSelectHighlight',
            listFilter:     'oiSelectAscSort',
            editItem:       false,
            newItem:        false,
            closeList:      true,
            saveTrigger:    'enter'
        },
        version: {
            full: '0.2.13',
            major: 0,
            minor: 2,
            dot: 13
        },
        $get: function() {
            return {
                options: this.options,
                version: this.version
            };
        }
    };
})

.factory('oiSelectEditItem', function() {
    return function(removedItem, lastQuery, getLabel) {
        return getLabel(removedItem);
    };
})

.factory('oiUtils', ['$document', '$timeout', function($document, $timeout) {
    /**
     * Check to see if a DOM element is a descendant of another DOM element.
     *
     * @param {DOM element} container
     * @param {DOM element} contained
     * @param {string} class name of element in container
     * @returns {boolean}
     */
    function contains(container, contained, className) {
        var current = contained;

        while (current && current.ownerDocument && current.nodeType !== 11) {
            if (className) {
                if (current === container) {
                    return false;
                }
                if (current.classList.contains(className)) {
                    return true;
                }
            } else {
                if (current === container) {
                    return true;
                }
            }
            current = current.parentNode;
        }

        return false;
    }

    /**
     * Simulate focus/blur events of the inner input element to the outer element
     *
     * @param {element} outer element
     * @param {element} inner input element
     * @returns {function} deregistration function for listeners.
     */
    function bindFocusBlur(element, inputElement) {
        var isFocused, isMousedown, isBlur;

        $document[0].addEventListener('click', clickHandler, true);
        element[0].addEventListener('mousedown', mousedownHandler, true);
        element[0].addEventListener('blur', blurHandler, true);
        inputElement.on('focus', focusHandler);

        function blurHandler(event) {
            if (event && event.target.nodeName !== 'INPUT') return; //for IE

            isBlur = false;

            if (isMousedown) {
                isBlur = true;
                return;
            }

            $timeout(function () {
                element.triggerHandler('blur'); //conflict with current live cycle (case: multiple=none + tab)
            });
        }

        function focusHandler() {
            if (!isFocused) {
                isFocused = true;

                $timeout(function () {
                    element.triggerHandler('focus'); //conflict with current live cycle (case: multiple=none + tab)
                });
            }
        }

        function mousedownHandler() {
            isMousedown = true;
        }

        function clickHandler(event) {
            isMousedown = false;

            var activeElement = event.target;
            var isSelectElement = contains(element[0], activeElement);

            if (isBlur && !isSelectElement) {
                blurHandler();
            }

            if (isSelectElement && activeElement.nodeName !== 'INPUT') {
                $timeout(function () {
                    inputElement[0].focus();
                });
            }

            if (!isSelectElement && isFocused) {
                isFocused = false;
            }
        }

        return function () {
            $document[0].removeEventListener('click', clickHandler);
            element[0].removeEventListener('mousedown', mousedownHandler, true);
            element[0].removeEventListener('blur', blurHandler, true);
            inputElement.off('focus', focusHandler);
        }
    }

    /**
     * Sets the selected item in the dropdown menu
     * of available options.
     *
     * @param {object} list
     * @param {object} item
     */
    function scrollActiveOption(list, item) {
        var y, height_menu, height_item, scroll, scroll_top, scroll_bottom;

        if (item) {
            height_menu = list.offsetHeight;
            height_item = getWidthOrHeight(item, 'height', 'margin'); //outerHeight(true);
            scroll = list.scrollTop || 0;
            y = getOffset(item).top - getOffset(list).top + scroll;
            scroll_top = y;
            scroll_bottom = y - height_menu + height_item;

            //TODO Make animation
            if (y + height_item > height_menu + scroll) {
                list.scrollTop = scroll_bottom;
            } else if (y < scroll) {
                list.scrollTop = scroll_top;
            }
        }
    }

    // Used for matching numbers
    var core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
    var rnumnonpx = new RegExp("^(" + core_pnum + ")(?!px)[a-z%]+$", "i");

    function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles) {
        var i = extra === (isBorderBox ? 'border' : 'content') ?
                // If we already have the right measurement, avoid augmentation
                4 :
                // Otherwise initialize for horizontal or vertical properties
                name === 'width' ? 1 : 0,

            val = 0,
            cssExpand = ['Top', 'Right', 'Bottom', 'Left'];

        //TODO Use angular.element.css instead of getStyleValue after https://github.com/caitp/angular.js/commit/92bbb5e225253ebddd38ef5735d66ffef76b6a14 will be applied
        function getStyleValue(name) {
            return parseFloat(styles[name]);
        }

        for (; i < 4; i += 2) {
            // both box models exclude margin, so add it if we want it
            if (extra === 'margin') {
                val += getStyleValue(extra + cssExpand[i]);
            }

            if (isBorderBox) {
                // border-box includes padding, so remove it if we want content
                if (extra === 'content') {
                    val -= getStyleValue('padding' + cssExpand[i]);
                }

                // at this point, extra isn't border nor margin, so remove border
                if (extra !== 'margin') {
                    val -= getStyleValue('border' + cssExpand[i] + 'Width');
                }
            } else {
                val += getStyleValue('padding' + cssExpand[i]);

                // at this point, extra isn't content nor padding, so add border
                if (extra !== 'padding') {
                    val += getStyleValue('border' + cssExpand[i] + 'Width');
                }
            }
        }

        return val;
    }

    function getOffset(elem) {
        var docElem, win,
            box = elem.getBoundingClientRect(),
            doc = elem && elem.ownerDocument;

        if (!doc) {
            return;
        }

        docElem = doc.documentElement;
        win = getWindow(doc);

        return {
            top: box.top + win.pageYOffset - docElem.clientTop,
            left: box.left + win.pageXOffset - docElem.clientLeft
        };
    }

    function getWindow(elem) {
        return elem != null && elem === elem.window ? elem : elem.nodeType === 9 && elem.defaultView;
    }

    function getWidthOrHeight(elem, name, extra) {

        // Start with offset property, which is equivalent to the border-box value
        var valueIsBorderBox = true,
            val = name === 'width' ? elem.offsetWidth : elem.offsetHeight,
            styles = window.getComputedStyle(elem, null),

        //TODO Make isBorderBox after https://github.com/caitp/angular.js/commit/92bbb5e225253ebddd38ef5735d66ffef76b6a14 will be applied
            isBorderBox = false; //jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

        // some non-html elements return undefined for offsetWidth, so check for null/undefined
        // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
        // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
        if (val <= 0 || val == null) {
            // Fall back to computed then uncomputed css if necessary
            val = styles[name];

            if (val < 0 || val == null) {
                val = elem.style[name];
            }

            // Computed unit is not pixels. Stop here and return.
            if (rnumnonpx.test(val)) {
                return val;
            }

            // we need the check for style in case a browser which returns unreliable values
            // for getComputedStyle silently falls back to the reliable elem.style
            //valueIsBorderBox = isBorderBox && ( jQuery.support.boxSizingReliable || val === elem.style[ name ] );

            // Normalize "", auto, and prepare for extra
            val = parseFloat(val) || 0;
        }

        // use the active box-sizing model to add/subtract irrelevant styles
        return val + augmentWidthOrHeight(elem, name, extra || ( isBorderBox ? "border" : "content" ), valueIsBorderBox, styles);
    }

    function groupsIsEmpty(groups) {
        for (var k in groups) {
            if (groups.hasOwnProperty(k) && groups[k].length) {
                return false;
            }
        }
        return true;
    }

    function objToArr(obj) {
        var arr = [];

        angular.forEach(obj, function (value, key) {
            if (key.toString().charAt(0) !== '$') {
                arr.push(value);
            }
        });

        return arr;
    }

    //lodash _.intersection + filter + invert
    function intersection(xArr, yArr, xFilter, yFilter, invert) {
        var i, j, n, filteredX, filteredY, out = invert ? [].concat(xArr) : [];

        for (i = 0, n = xArr.length; i < xArr.length; i++) {
            filteredX = xFilter ? xFilter(xArr[i]) : xArr[i];

            for (j = 0; j < yArr.length; j++) {
                filteredY = yFilter ? yFilter(yArr[j]) : yArr[j];

                if (angular.equals(filteredX, filteredY, xArr, yArr, i, j)) {
                    invert ? out.splice(i + out.length - n, 1) : out.push(yArr[j]);
                    break;
                }
            }
        }
        return out;
    }

    function getValue(valueName, item, scope, getter) {
        var locals = {};

        //'name.subname' -> {name: {subname: list}}'
        valueName.split('.').reduce(function (previousValue, currentItem, index, arr) {
            return previousValue[currentItem] = index < arr.length - 1 ? {} : item;
        }, locals);

        return getter(scope, locals);
    }

    return {
        contains: contains,
        bindFocusBlur: bindFocusBlur,
        scrollActiveOption: scrollActiveOption,
        groupsIsEmpty: groupsIsEmpty,
        objToArr: objToArr,
        getValue: getValue,
        intersection: intersection
    }
}]);
angular.module('oi.select')

.directive('oiSelect', ['$document', '$q', '$timeout', '$parse', '$interpolate', '$injector', '$filter', '$animate', 'oiUtils', 'oiSelect', function($document, $q, $timeout, $parse, $interpolate, $injector, $filter, $animate, oiUtils, oiSelect) {
    var NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?(?:\s+disable\s+when\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/;
    var VALUES_REGEXP     = /([^\(\)\s\|\s]*)\s*(\(.*\))?\s*(\|?\s*.+)?/;

    return {
        restrict: 'AE',
        templateUrl: 'src/template.html',
        require: 'ngModel',
        scope: {},
        compile: function (element, attrs) {
            var optionsExp = attrs.oiOptions,
                match = optionsExp ? optionsExp.match(NG_OPTIONS_REGEXP) : ['', 'i', '', '', '', 'i', '', '', ''];

            if (!match) {
                throw new Error("Expected expression in form of '_select_ (as _label_)? for (_key_,)?_value_ in _collection_'");
            }

            var selectAsName          = / as /.test(match[0]) && match[1],    //item.modelValue
                displayName           = match[2] || match[1],                 //item.label
                valueName             = match[5] || match[7],                 //item
                groupByName           = match[3] || '',                       //item.groupName
                disableWhenName       = match[4] || '',                       //item.disableWhenName
                trackByName           = match[9] || displayName,              //item.id
                valueMatches          = match[8].match(VALUES_REGEXP);        //collection

            var valuesName            = valueMatches[1],                      //collection
                filteredValuesName    = valuesName + (valueMatches[3] || ''), //collection | filter
                valuesFnName          = valuesName + (valueMatches[2] || ''); //collection()

            var selectAsFn            = selectAsName && $parse(selectAsName),
                displayFn             = $parse(displayName),
                groupByFn             = $parse(groupByName),
                disableWhenFn         = $parse(disableWhenName),
                filteredValuesFn      = $parse(filteredValuesName),
                valuesFn              = $parse(valuesFnName),
                trackByFn             = $parse(trackByName);

            var multiplePlaceholderFn = $interpolate(attrs.multiplePlaceholder || ''),
                placeholderFn         = $interpolate(attrs.placeholder || ''),
                optionsFn             = $parse(attrs.oiSelectOptions),
                keyUpDownWerePressed  = false,
                matchesWereReset      = false;

            var timeoutPromise,
                lastQuery,
                removedItem,
                multiple,
                multipleLimit,
                newItemFn;

            return function(scope, element, attrs, ctrl) {
                var inputElement        = element.find('input'),
                    listElement         = angular.element(element[0].querySelector('.select-dropdown')),
                    placeholder         = placeholderFn(scope),
                    multiplePlaceholder = multiplePlaceholderFn(scope),
                    elementOptions      = optionsFn(scope.$parent) || {},
                    options             = angular.extend({cleanModel: elementOptions.newItem === 'prompt'}, oiSelect.options, elementOptions),
                    editItem            = options.editItem === true || options.editItem === 'correct' ? 'oiSelectEditItem' : options.editItem,
                    editItemCorrect     = options.editItem === 'correct',
                    editItemFn          = editItem ? $injector.get(editItem) : function() {return ''},
                    removeItemFn        = $parse(options.removeItemFn);

                match = options.searchFilter.split(':');
                var searchFilter = $filter(match[0]),
                    searchFilterOptionsFn = $parse(match[1]);

                match = options.dropdownFilter.split(':');
                var dropdownFilter = $filter(match[0]),
                    dropdownFilterOptionsFn = $parse(match[1]);

                match = options.listFilter.split(':');
                var listFilter = $filter(match[0]),
                    listFilterOptionsFn = $parse(match[1]);

                if (options.newItemFn) {
                    newItemFn = $parse(options.newItemFn);

                } else {
                    newItemFn = function(scope, locals) {
                        return (optionsFn(locals) || {}).newItemModel || locals.$query;
                    };
                }

                if (options.cleanModel && (!editItem || editItemCorrect)) {
                    element.addClass('cleanMode');
                }

                var unbindFocusBlur = oiUtils.bindFocusBlur(element, inputElement);

                if (angular.isDefined(attrs.autofocus)) {
                    $timeout(function() {
                        inputElement[0].focus();
                    });
                }

                if (angular.isDefined(attrs.readonly)) {
                    inputElement.attr('readonly', true)
                }

                if (angular.isDefined(attrs.tabindex)) {
                    inputElement.attr('tabindex', attrs.tabindex);
                    element[0].removeAttribute('tabindex');
                }

                attrs.$observe('disabled', function(value) {
                    inputElement.prop('disabled', value);

                    //hide empty string with input
                    if (multiple && ctrl.$modelValue && ctrl.$modelValue.length) {
                        scope.inputHide = value;
                    }
                });

                scope.$on('$destroy', unbindFocusBlur);

                scope.$parent.$watch(attrs.multipleLimit, function(value) {
                     multipleLimit = Number(value) || Infinity;
                });

                scope.$parent.$watch(attrs.multiple, function(multipleValue) {
                    multiple = multipleValue === undefined ? angular.isDefined(attrs.multiple) : multipleValue;

                    if (multiple) {
                        element.addClass('multiple');
                        // Override the standard $isEmpty because an empty array means the input is empty.
                        ctrl.$isEmpty = function(value) {
                            return !value || !value.length;
                        };
                    } else {
                        element.removeClass('multiple');
                    }
                });

                scope.$parent.$watch(attrs.ngModel, function(value) {
                    var output = value instanceof Array ? value : value ? [value]: [],
                        promise = $q.when(output);

                    modifyPlaceholder();

                    if (!multiple) {
                        restoreInput();
                    }

                    if (selectAsFn && value) {
                        promise = getMatches(null, value)
                            .then(function(collection) {
                                return oiUtils.intersection(output, collection, null, selectAs);
                            });
                        timeoutPromise = null; //`resetMatches` should not cancel the `promise`
                    }

                    promise.then(function(collection) {
                        scope.output = collection;

                        if (collection.length !== output.length) {
                            scope.removeItem(collection.length); //if newItem was not created
                        }
                    });
                });

                scope.$watch('query', function(inputValue, oldValue) {
                    if (saveOn(inputValue.slice(0, -1), inputValue.slice(-1))) {
                        return;
                    }

                    //We don't get matches if nothing added into matches list
                    if (inputValue !== oldValue && (!scope.oldQuery || inputValue) && !matchesWereReset) {
                        listElement[0].scrollTop = 0;

                        if (inputValue) {
                            getMatches(inputValue);
                            scope.oldQuery = null;
                        } else if (multiple) {
                            resetMatches();
                            matchesWereReset = true;
                        }
                    }
                    matchesWereReset = false;
                });

                scope.$watch('groups', function(groups) {
                    if (oiUtils.groupsIsEmpty(groups)) {
                        scope.isOpen = false;

                    } else if (!scope.isOpen && !attrs.disabled) {
                        scope.isOpen = true;
                        scope.isFocused = true;
                    }
                });

                scope.$watch('isFocused', function(isFocused) {
                    $animate[isFocused ? 'addClass' : 'removeClass'](element, 'focused', {
                        tempClasses: 'focused-animate'
                    });
                });

                scope.$watch('isOpen', function(isOpen) {
                    $animate[isOpen ? 'addClass' : 'removeClass'](element, 'open', {
                        tempClasses: 'open-animate'
                    });
                });

                scope.$watch('showLoader', function(isLoading) {
                    $animate[isLoading ? 'addClass' : 'removeClass'](element, 'loading', {
                        tempClasses: 'loading-animate'
                    });
                });

                scope.addItem = function addItem(option) {
                    lastQuery = scope.query;

                    //duplicate
                    if (multiple && oiUtils.intersection(scope.output, [option], trackBy, trackBy).length) return;

                    //limit is reached
                    if (scope.output.length >= multipleLimit) {
                        blinkClass('limited');

                        return;
                    }

                    var optionGroup = scope.groups[getGroupName(option)] = scope.groups[getGroupName(option)] || [];
                    var modelOption = selectAsFn ? selectAs(option) : option;

                    optionGroup.splice(optionGroup.indexOf(option), 1);

                    if (multiple) {
                        ctrl.$setViewValue(angular.isArray(ctrl.$modelValue) ? ctrl.$modelValue.concat(modelOption) : [modelOption]);
                        
                    } else {
                        ctrl.$setViewValue(modelOption);
                        restoreInput();
                    }

                    if (oiUtils.groupsIsEmpty(scope.groups)) {
                        scope.groups = {}; //it is necessary for groups watcher
                    }

                    if (!multiple && !options.closeList) {
                        resetMatches({query: true});
                    }

                    scope.oldQuery = scope.oldQuery || scope.query;
                    scope.query = '';
                    scope.backspaceFocus = false;
                };

                scope.removeItem = function removeItem(position) {
                    if (attrs.disabled || multiple && position < 0) return;

                    $q.when(removeItemFn(scope.$parent, {$item: removedItem}))
                        .then(function() {
                            if (!multiple && !scope.inputHide) return;

                            if (multiple) {
                                removedItem = ctrl.$modelValue[position];
                                ctrl.$modelValue.splice(position, 1);
                                ctrl.$setViewValue([].concat(ctrl.$modelValue));

                            } else  {
                                removedItem = ctrl.$modelValue;
                                cleanInput();

                                if (options.cleanModel) {
                                    ctrl.$setViewValue(undefined);
                                }
                            }

                            if (!editItemCorrect && (multiple || !scope.backspaceFocus)) {
                                scope.query = editItemFn(removedItem, lastQuery, getLabel);
                            }

                            if (editItem) {
                                editItemCorrect = false;
                                element.removeClass('cleanMode');
                            }

                            if (multiple && options.closeList) {
                                resetMatches({query: true});
                            }
                        })
                };

                scope.setSelection = function(index) {
                    if (!keyUpDownWerePressed && scope.selectorPosition !== index) {
                        setOption(listElement, index);
                    } else {
                        keyUpDownWerePressed = false;
                    }
                };

                scope.keyUp = function keyUp(event) { //scope.query is actual
                    switch (event.keyCode) {
                        case 8: /* backspace */
                            if (!scope.query.length && (!multiple || !scope.output.length)) {
                                resetMatches();
                            }
                    }
                };

                scope.keyDown = function keyDown(event) {
                    var top    = 0,
                        bottom = scope.order.length - 1;

                    switch (event.keyCode) {
                        case 38: /* up */
                            scope.selectorPosition = angular.isNumber(scope.selectorPosition) ? scope.selectorPosition : top;
                            setOption(listElement, scope.selectorPosition === top ? bottom : scope.selectorPosition - 1);
                            keyUpDownWerePressed = true;
                            break;

                        case 40: /* down */
                            scope.selectorPosition = angular.isNumber(scope.selectorPosition) ? scope.selectorPosition : top - 1;
                            setOption(listElement, scope.selectorPosition === bottom ? top : scope.selectorPosition + 1);
                            keyUpDownWerePressed = true;
                            if (!scope.query.length && !scope.isOpen) {
                                getMatches();
                            }
                            if (scope.inputHide) {
                                cleanInput();
                            }

                            break;

                        case 37: /* left */
                        case 39: /* right */
                            break;

                        case 13: /* enter */
                            saveOn('enter');
                            event.preventDefault(); // Prevent the event from bubbling up as it might otherwise cause a form submission
                            break;

                        case 32: /* space */
                            saveOn('space');
                            break;

                        case 27: /* esc */
                            if (!multiple) {
                                restoreInput();

                                if (options.cleanModel) {
                                    ctrl.$setViewValue(removedItem);
                                }
                            }
                            resetMatches();
                            break;

                        case 8: /* backspace */
                            if (!scope.query.length) {
                                if (!multiple || editItem) {
                                    scope.backspaceFocus = true;
                                }
                                if (scope.backspaceFocus && scope.output && (!multiple || scope.output.length)) { //prevent restoring last deleted option
                                    scope.removeItem(scope.output.length - 1);

                                    if (editItem) {
                                        event.preventDefault();
                                    }
                                    break;
                                }
                                scope.backspaceFocus = !scope.backspaceFocus;
                                break;
                            }
                        default: /* any key */
                            if (scope.inputHide) {
                                cleanInput();
                            }
                            scope.backspaceFocus = false;
                            return false; //preventDefaults
                    }
                };

                scope.getSearchLabel = function(item) {
                    var label = getLabel(item);

                    return searchFilter(label, scope.oldQuery || scope.query, item, searchFilterOptionsFn(scope.$parent));
                };

                scope.getDropdownLabel = function(item) {
                    var label = getLabel(item);

                    return dropdownFilter(label, scope.oldQuery || scope.query, item, dropdownFilterOptionsFn(scope.$parent));
                };

                scope.getDisableWhen = getDisableWhen;




                resetMatches();

                element[0].addEventListener('click', click, true); //triggered before add or delete item event
                element.on('focus', focus);
                element.on('blur', blur);

                function blinkClass(name, delay) {
                    delay = delay || 150;

                    element.addClass(name);

                    $timeout(function() {
                        element.removeClass(name);
                    }, delay);
                }

                function cleanInput() {
                    scope.listItemHide = true;
                    scope.inputHide = false;
                }

                function restoreInput() {
                    scope.listItemHide = !ctrl.$modelValue;
                    scope.inputHide = !!ctrl.$modelValue;
                }


                function click(event) {
                    //option is disabled
                    if (oiUtils.contains(element[0], event.target, 'disabled')) return;

                    //limit is reached
                    if (scope.output.length >= multipleLimit && oiUtils.contains(element[0], event.target, 'select-dropdown')) return;

                    if (scope.inputHide) {
                        scope.removeItem(0); //because click on border (not on chosen item) doesn't remove chosen element
                    }

                    if (scope.isOpen && options.closeList && (event.target.nodeName !== 'INPUT' || !scope.query.length)) { //do not reset if you are editing the query
                        resetMatches({query: options.editItem && !editItemCorrect});
                        scope.$evalAsync();
                    } else {
                        getMatches(scope.query);
                    }
                }

                function focus(event) {
                    if (scope.isFocused) return;

                    scope.isFocused = true;

                    if (attrs.disabled) return;

                    scope.backspaceFocus = false;
                }


                function blur(event) {
                    scope.isFocused = false;

                    if (!multiple) {
                        restoreInput();
                    }

                    if (!saveOn('blur')) {
                        resetMatches();
                    }
                    scope.$evalAsync();
                }

                function isTriggeredOn(triggerName) {
                    return options.saveTrigger.split(' ').indexOf(triggerName) + 1
                }

                function saveOn(query, triggerName) {
                    if (!triggerName) {
                        triggerName = query;
                        query = scope.query;
                    }

                    var isTriggered    = isTriggeredOn(triggerName), //(new RegExp(triggerName)).test(options.saveTrigger),
                        isNewItem      = options.newItem && query,
                        selectedOrder  = scope.order[scope.selectorPosition],
                        itemPromise;

                    if (isTriggered && (isNewItem || selectedOrder)) {
                        scope.showLoader = true;
                        itemPromise = $q.when(selectedOrder || newItemFn(scope.$parent, {$query: query}));

                        itemPromise
                            .then(function(data) {
                                if (data === undefined) {
                                   return $q.reject();
                                }

                                scope.addItem(data);

                                var bottom = scope.order.length - 1;

                                if (scope.selectorPosition === bottom) {
                                    setOption(listElement, 0); //TODO optimise when list will be closed
                                }
                                options.newItemFn && !selectedOrder || $timeout(angular.noop); //TODO $applyAsync work since Angular 1.3
                                resetMatches();
                            })
                            .catch(function() {
                                blinkClass('invalid-item');
                                scope.showLoader = false;
                            });

                        return true;
                    }
                }

                function modifyPlaceholder() {
                    var currentPlaceholder = multiple && ctrl.$modelValue && ctrl.$modelValue.length ? multiplePlaceholder : placeholder;
                    inputElement.attr('placeholder', currentPlaceholder);
                }

                function trackBy(item) {
                    return oiUtils.getValue(valueName, item, scope.$parent, trackByFn);
                }

                function selectAs(item) {
                    return oiUtils.getValue(valueName, item, scope.$parent, selectAsFn);
                }

                function getLabel(item) {
                    return String(oiUtils.getValue(valueName, item, scope.$parent, displayFn));
                }

                function getDisableWhen(item) {
                    return oiUtils.getValue(valueName, item, scope.$parent, disableWhenFn);
                }

                function getGroupName(option) {
                    return oiUtils.getValue(valueName, option, scope.$parent, groupByFn) || '';
                }

                function filter(list) {
                    return oiUtils.getValue(valuesName, list, scope.$parent, filteredValuesFn);
                }

                function getMatches(query, selectedAs) {
                    var values = valuesFn(scope.$parent, {$query: query, $selectedAs: selectedAs}) || '',
                        waitTime = 0;

                    scope.selectorPosition = options.newItem === 'prompt' ? false : 0;

                    if (!query && !selectedAs) {
                        scope.oldQuery = null;
                    }

                    if (timeoutPromise && (values.$promise && !values.$resolved || angular.isFunction(values.then))) {
                        $timeout.cancel(timeoutPromise); //cancel previous timeout
                        waitTime = options.debounce;
                    }

                    timeoutPromise = $timeout(function() {
                        scope.showLoader = true;

                        return $q.when(values.$promise || values)
                            .then(function(values) {
                                if (!values) {
                                    scope.groups = {};
                                    updateGroupPos();
                                    return;
                                }

                                if (!selectedAs) {
                                    var outputValues = multiple ? scope.output : [];
                                    var filteredList   = listFilter(oiUtils.objToArr(values), query, getLabel, listFilterOptionsFn(scope.$parent));
                                    var withoutIntersection = oiUtils.intersection(filteredList, outputValues, trackBy, trackBy, true);
                                    var filteredOutput = filter(withoutIntersection);

                                    scope.groups = group(filteredOutput);
                                    updateGroupPos();
                                }
                                return values;
                            })
                            .finally(function(){
                                scope.showLoader = false;

                                if (options.closeList) {
                                    $timeout(function() {
                                        setOption(listElement, 0);
                                    });
                                }
                            });
                    }, waitTime);

                    return timeoutPromise;
                }

                function updateGroupPos() {
                    var i, key, value, collectionKeys = [], groupCount = 0;

                    scope.order = [];
                    scope.groupPos = {};

                    for (key in scope.groups) {
                        if (scope.groups.hasOwnProperty(key) && key.charAt(0) != '$') {
                            collectionKeys.push(key);
                        }
                    }

                    if (angular.version.major <= 1 && angular.version.minor <= 3) {
                        collectionKeys.sort(); //TODO: Think of a way which does not depend on the order in which Angular displays objects by ngRepeat
                    }

                    for (i = 0; i < collectionKeys.length; i++) {
                        key = collectionKeys[i];
                        value = scope.groups[key];

                        scope.order = scope.order.concat(value);
                        scope.groupPos[key] = groupCount;
                        groupCount += value.length
                    }
                }

                function resetMatches(options) {
                    options = options || {};

                    scope.oldQuery = null;
                    scope.backspaceFocus = false; // clears focus on any chosen item for del
                    scope.groups = {};
                    scope.order = [];
                    scope.showLoader = false;
                    scope.isOpen   = false;

                    if (!options.query)   {
                        scope.query = '';
                    }

                    if (timeoutPromise) {
                        $timeout.cancel(timeoutPromise);//cancel previous timeout
                    }
                }

                function setOption(listElement, position) {
                    scope.selectorPosition = position;
                    oiUtils.scrollActiveOption(listElement[0], listElement.find('li')[position]);
                }

                function group(input) {
                    var optionGroups = {'':[]},
                        optionGroupName,
                        optionGroup;

                    for (var i = 0; i < input.length; i++) {
                        optionGroupName = getGroupName(input[i]);

                        if (!(optionGroup = optionGroups[optionGroupName])) {
                            optionGroup = optionGroups[optionGroupName] = [];
                        }
                        optionGroup.push(input[i]);
                    }

                    return optionGroups;
                }
            }
        }
    }
}]);

angular.module('oi.select')

.filter('oiSelectCloseIcon', ['$sce', function($sce) {
    return function(label) {
        var closeIcon = '<span class="close select-search-list-item_selection-remove">×</span>';

        return $sce.trustAsHtml(label + closeIcon);
    };
}])

.filter('oiSelectHighlight', ['$sce', function($sce) {
    return function(label, query) {
        var html;

        if (query.length > 0 || angular.isNumber(query)) {
            label = label.toString();
            query = query.toString().replace(/\s+.*/, '').replace(/\\/g, '\\\\');

            html = label.replace(new RegExp(query, 'gi'), '<strong>$&</strong>');
        } else {
            html = label;
        }

        return $sce.trustAsHtml(html);
    };
}])

.filter('oiSelectAscSort', function() {
    function ascSort(input, query, getLabel, options) {
        var i, j, isFound, output, output1 = [], output2 = [], output3 = [];

        if (query) {
            query = String(query).replace(/\s+.*/, '').replace(/\\/g, '\\\\');

            for (i = 0, isFound = false; i < input.length; i++) {
                isFound = getLabel(input[i]).match(new RegExp(query, "i"));

                if (!isFound && options) {
                    for (j = 0; j < options.length; j++) {
                        if (isFound) break;

                        isFound = String(input[i][options[j]]).match(new RegExp(query, "i"));
                    }
                }

                if (isFound) {
                    output1.push(input[i]);
                }
            }
            for (i = 0; i < output1.length; i++) {
                if (getLabel(output1[i]).match(new RegExp('^' + query, "i"))) {
                    output2.push(output1[i]);
                } else {
                    output3.push(output1[i]);
                }
            }
            output = output2.concat(output3);
        } else {
            output = [].concat(input);
        }

        return output;
    }

    return ascSort;
})

.filter('none', function() {
    return function(input) {
        return input;
    };
});
angular.module("oi.select").run(["$templateCache", function($templateCache) {$templateCache.put("src/template.html","<div class=select-search><ul class=select-search-list><li class=\"btn btn-default btn-xs select-search-list-item select-search-list-item_selection\" ng-hide=listItemHide ng-repeat=\"item in output track by $index\" ng-class=\"{focused: backspaceFocus && $last}\" ng-click=removeItem($index) ng-bind-html=getSearchLabel(item)></li><li class=\"select-search-list-item select-search-list-item_input\" ng-class=\"{\'select-search-list-item_hide\': inputHide}\"><input autocomplete=off ng-model=query ng-keyup=keyUp($event) ng-keydown=keyDown($event)></li><li class=\"select-search-list-item select-search-list-item_loader\" ng-show=showLoader></li></ul></div><div class=select-dropdown ng-show=isOpen><ul ng-if=isOpen class=select-dropdown-optgroup ng-repeat=\"(group, options) in groups\"><div class=select-dropdown-optgroup-header ng-if=\"group && options.length\" ng-bind=group></div><li class=select-dropdown-optgroup-option ng-init=\"isDisabled = getDisableWhen(option)\" ng-repeat=\"option in options\" ng-class=\"{\'active\': selectorPosition === groupPos[group] + $index, \'disabled\': isDisabled}\" ng-click=\"isDisabled || addItem(option)\" ng-mouseenter=\"setSelection(groupPos[group] + $index)\" ng-bind-html=getDropdownLabel(option)></li></ul></div>");}]);