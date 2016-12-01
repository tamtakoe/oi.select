angular.module('oi.select')

    .directive('oiSelect', ['$document', '$q', '$timeout', '$parse', '$interpolate', '$injector', '$filter', '$animate', 'oiUtils', 'oiSelect', function ($document, $q, $timeout, $parse, $interpolate, $injector, $filter, $animate, oiUtils, oiSelect) {
        var NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?(?:\s+disable\s+when\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/;
        var VALUES_REGEXP = /([^\(\)\s\|\s]*)\s*(\(.*\))?\s*(\|?\s*.+)?/;

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

                $scope.require = attrs.require;
                console.log($scope.require);

                var selectAsName = / as /.test(match[0]) && match[1],    //item.modelValue
                    displayName = match[2] || match[1],                 //item.label
                    valueName = match[5] || match[7],                 //item (value)
                    keyName = match[6],                             //(key)
                    groupByName = match[3] || '',                       //item.groupName
                    disableWhenName = match[4] || '',                       //item.disableWhenName
                    trackByName = match[9] || displayName,              //item.id
                    valueMatches = match[8].match(VALUES_REGEXP),        //collection
                    valueTitle = valueName,
                    keyTitle = keyName;

                if (keyName) { //convert object data sources format to array data sources format
                    valueName = 'i';
                    selectAsName = valueName + '.' + (selectAsName || valueTitle);
                    trackByName = valueName + '.' + keyName;
                    displayName = valueName + '.' + displayName;
                    keyName = valueName + '.' + keyName;
                    groupByName = groupByName ? valueName + '.' + groupByName : undefined;
                    disableWhenName = disableWhenName ? valueName + '.' + disableWhenName : undefined;
                }

                var valuesName = valueMatches[1],                      //collection
                    filteredValuesName = valuesName + (valueMatches[3] || ''), //collection | filter
                    valuesFnName = valuesName + (valueMatches[2] || ''); //collection()

                var selectAsFn = selectAsName && $parse(selectAsName),
                    displayFn = $parse(displayName),
                    groupByFn = $parse(groupByName),
                    disableWhenFn = $parse(disableWhenName),
                    filteredValuesFn = $parse(filteredValuesName),
                    valuesFn = $parse(valuesFnName),
                    trackByFn = $parse(trackByName);

                var multiplePlaceholderFn = $interpolate(attrs.multiplePlaceholder || ''),
                    listPlaceholderFn = $interpolate(attrs.listPlaceholder || ''),
                    placeholderFn = $interpolate(attrs.placeholder || ''),
                    optionsFn = $parse(attrs.oiSelectOptions),
                    isOldAngular = angular.version.major <= 1 && angular.version.minor <= 3;

                var keyUpDownWerePressed,
                    matchesWereReset,
                    timeoutPromise,
                    lastQuery,
                    removedItem,
                    multiple,
                    multipleLimit,
                    newItemFn;

                return function (scope, element, attrs, ctrl) {
                    // Override the standard $isEmpty because an empty array means the input is empty.
                    ctrl.$isEmpty = function (value) {
                        return !exists(value)
                    };

                    var inputElement = element.find('input'),
                        listElement = angular.element(element[0].querySelector('.select-dropdown')),
                        placeholder = placeholderFn(scope),
                        multiplePlaceholder = multiplePlaceholderFn(scope),
                        listPlaceholder = listPlaceholderFn(scope),
                        elementOptions = optionsFn(scope.$parent) || {},
                        options = angular.extend({cleanModel: elementOptions.newItem === 'prompt'}, oiSelect.options, elementOptions),
                        editItem = options.editItem,
                        editItemIsCorrected = editItem === 'correct',
                        waitTime = 0;

                    if (editItem === true || editItem === 'correct') {
                        editItem = 'oiSelectEditItem';
                    }
                    var editItemFn = editItem ? $injector.get(editItem) : angular.noop,
                        removeItemFn = $parse(options.removeItemFn);

                    match = options.searchFilter.split(':');
                    var searchFilter = $filter(match[0]),
                        searchFilterOptionsFn = $parse(match[1]);

                    match = options.dropdownFilter.split(':');
                    var dropdownFilter = $filter(match[0]),
                        dropdownFilterOptionsFn = $parse(match[1]);

                    match = options.listFilter.split(':');
                    var listFilter = $filter(match[0]),
                        listFilterOptionsFn = $parse(match[1]);

                    match = options.groupFilter.split(':');
                    var groupFilter = $filter(match[0]),
                        groupFilterOptionsFn = $parse(match[1]);

                    if (options.newItemFn) {
                        newItemFn = $parse(options.newItemFn);

                    } else {
                        newItemFn = function (scope, locals) {
                            return (optionsFn(locals) || {}).newItemModel || locals.$query;
                        };
                    }

                    if (options.cleanModel && (!editItem || editItemIsCorrected)) {
                        element.addClass('cleanMode');
                    }

                    var unbindFocusBlur = oiUtils.bindFocusBlur(element, inputElement);

                    if (angular.isDefined(attrs.autofocus)) {
                        $timeout(function () {
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

                    if (options.maxlength) {
                        inputElement.attr('maxlength', options.maxlength);
                    }

                    attrs.$observe('disabled', function (value) {
                        inputElement.prop('disabled', value);

                        //hide empty string with input
                        if (multiple && ctrl.$modelValue && ctrl.$modelValue.length) {
                            scope.inputHide = value;
                        }
                    });

                    scope.$on('$destroy', unbindFocusBlur);

                    scope.$parent.$watch(attrs.multipleLimit, function (value) {
                        multipleLimit = Number(value) || Infinity;
                    });

                    scope.$parent.$watch(attrs.multiple, function (multipleValue) {
                        multiple = multipleValue === undefined ? angular.isDefined(attrs.multiple) : multipleValue;

                        element[multiple ? 'addClass' : 'removeClass']('multiple');
                    });

                    function valueChangedManually() { //case: clean model; prompt + editItem: 'correct'; initial value = defined/undefined
                        if (editItemIsCorrected) {
                            element.removeClass('cleanMode');
                        }
                        editItemIsCorrected = false;
                    }

                    scope.$parent.$watch(attrs.ngModel, function (value, oldValue) {
                        var output = compact(value),
                            promise = $q.when(output);

                        modifyPlaceholder();

                        if (exists(oldValue) && value !== oldValue) {
                            valueChangedManually();
                        }

                        if (!multiple) {
                            restoreInput();
                        }

                        if (selectAsFn && exists(value)) {
                            promise = getMatches(null, value)
                                .then(function (collection) {
                                    return oiUtils.intersection(output, collection, null, selectAs);
                                });
                            timeoutPromise = null; //`resetMatches` should not cancel the `promise`
                        }

                        if (multiple && attrs.disabled && !exists(value)) { //case: multiple, disabled=true + remove all items
                            scope.inputHide = false;
                        }

                        promise.then(function (collection) {
                            scope.output = collection;

                            if (collection.length !== output.length) {
                                scope.removeItem(collection.length); //if newItem was not created
                            }
                        });
                    });

                    scope.$watch('query', function (inputValue, oldValue) {
                        //terminated symbol
                        if (saveOn(inputValue.slice(0, -1), inputValue.slice(-1))) return;

                        //length less then minlength
                        if (String(inputValue).length < options.minlength) return;

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

                    scope.$watch('groups', function (groups) {
                        if (oiUtils.groupsIsEmpty(groups)) {
                            scope.isOpen = false;

                        } else if (!scope.isOpen && !attrs.disabled) {
                            scope.isOpen = true;
                            scope.isFocused = true;
                        }
                    });

                    scope.$watch('isFocused', function (isFocused) {
                        $animate[isFocused ? 'addClass' : 'removeClass'](element, 'focused', !isOldAngular && {
                                tempClasses: 'focused-animate'
                            });
                    });

                    scope.$watch('isOpen', function (isOpen) {
                        $animate[isOpen ? 'addClass' : 'removeClass'](element, 'open', !isOldAngular && {
                                tempClasses: 'open-animate'
                            });
                    });

                    scope.$watch('isEmptyList', function (isEmptyList) {
                        $animate[isEmptyList ? 'addClass' : 'removeClass'](element, 'emptyList', !isOldAngular && {
                                tempClasses: 'emptyList-animate'
                            });
                    });

                    scope.$watch('showLoader', function (isLoading) {
                        $animate[isLoading ? 'addClass' : 'removeClass'](element, 'loading', !isOldAngular && {
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

                        valueChangedManually();

                        scope.oldQuery = scope.oldQuery || scope.query;
                        scope.query = '';
                        scope.backspaceFocus = false;
                    };

                    scope.removeItem = function removeItem(position) {
                        if (attrs.disabled || multiple && position < 0) return;

                        removedItem = multiple ? ctrl.$modelValue[position] : ctrl.$modelValue;

                        $q.when(removeItemFn(scope.$parent, {$item: removedItem}))
                            .then(function () {
                                if (!multiple && !scope.inputHide) return;

                                if (multiple) {
                                    ctrl.$modelValue.splice(position, 1);
                                    ctrl.$setViewValue([].concat(ctrl.$modelValue));

                                } else {
                                    cleanInput();

                                    if (options.cleanModel) {
                                        ctrl.$setViewValue(undefined);
                                    }
                                }

                                if (multiple || !scope.backspaceFocus) {
                                    scope.query = editItemFn(removedItem, lastQuery, getLabel, editItemIsCorrected, element) || '';
                                }

                                if (multiple && options.closeList) {
                                    resetMatches({query: true});
                                }
                            })
                    };

                    scope.setSelection = function (index) {
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
                        var top = 0,
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

                            case 9: /* tab */
                                saveOn('tab');
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

                    scope.getSearchLabel = function (item) {
                        var label = getLabel(item);

                        return searchFilter(label, scope.oldQuery || scope.query, item, searchFilterOptionsFn(scope.$parent), element);
                    };

                    scope.getDropdownLabel = function (item) {
                        var label = getLabel(item);

                        return dropdownFilter(label, scope.oldQuery || scope.query, item, dropdownFilterOptionsFn(scope.$parent), element);
                    };

                    scope.getGroupLabel = function (group, items) {
                        return groupFilter(group, scope.oldQuery || scope.query, items, groupFilterOptionsFn(scope.$parent), element);
                    };

                    scope.getDisableWhen = getDisableWhen;


                    resetMatches();

                    element[0].addEventListener('click', click, true); //triggered before add or delete item event
                    scope.$on('$destroy', function () {
                        element[0].removeEventListener('click', click, true);
                    });
                    element.on('focus', focus);
                    element.on('blur', blur);

                    function blinkClass(name, delay) {
                        delay = delay || 150;

                        element.addClass(name);

                        $timeout(function () {
                            element.removeClass(name);
                        }, delay);
                    }

                    function cleanInput() {
                        scope.listItemHide = true;
                        scope.inputHide = false;
                    }

                    function restoreInput() {
                        var modelExists = exists(ctrl.$modelValue);
                        scope.listItemHide = !modelExists;
                        scope.inputHide = modelExists;
                    }

                    function click(event) {
                        //query length less then minlength
                        if (scope.query.length < options.minlength) return;

                        //option is disabled
                        if (oiUtils.contains(element[0], event.target, 'disabled')) return;

                        //limit is reached
                        if (scope.output.length >= multipleLimit && oiUtils.contains(element[0], event.target, 'select-dropdown')) return;

                        if (scope.inputHide) {
                            scope.removeItem(0); //because click on border (not on chosen item) doesn't remove chosen element
                        }

                        if (scope.isOpen && options.closeList && (event.target.nodeName !== 'INPUT' || !scope.query.length)) { //do not reset if you are editing the query
                            resetMatches({query: options.editItem && !editItemIsCorrected});
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

                    function saveOn(query, triggerName) {
                        if (!triggerName) {
                            triggerName = query;
                            query = scope.query;
                        }

                        var isTriggered = options.saveTrigger.split(' ').indexOf(triggerName) + 1,
                            isNewItem = options.newItem && query,
                            selectedOrder = triggerName !== 'blur' ? scope.order[scope.selectorPosition] : null, //do not save selected element in dropdown list on blur
                            itemPromise;

                        if (isTriggered && (isNewItem || selectedOrder && !getDisableWhen(selectedOrder))) {
                            scope.showLoader = true;
                            itemPromise = $q.when(selectedOrder || newItemFn(scope.$parent, {$query: query}));

                            itemPromise
                                .then(function (data) {
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
                                .catch(function () {
                                    blinkClass('invalid-item');
                                    scope.showLoader = false;
                                });

                            return true;
                        }
                    }

                    function modifyPlaceholder() {
                        var currentPlaceholder = multiple && exists(ctrl.$modelValue) ? multiplePlaceholder : placeholder;
                        inputElement.attr('placeholder', currentPlaceholder);
                    }

                    function trackBy(item) {
                        return oiUtils.getValue(valueName, item, scope.$parent, trackByFn);
                    }

                    function selectAs(item) {
                        return oiUtils.getValue(valueName, item, scope.$parent, selectAsFn);
                    }

                    function getLabel(item) {
                        return oiUtils.getValue(valueName, item, scope.$parent, displayFn);
                    }

                    function getDisableWhen(item) {
                        return scope.isEmptyList || oiUtils.getValue(valueName, item, scope.$parent, disableWhenFn);
                    }

                    function getGroupName(option) {
                        return oiUtils.getValue(valueName, option, scope.$parent, groupByFn) || '';
                    }

                    function filter(list) {
                        return oiUtils.getValue(valuesName, list, scope.$parent, filteredValuesFn);
                    }

                    function compact(value) {
                        value = value instanceof Array ? value : value ? [value] : [];

                        return value.filter(function (item) {
                            return item !== undefined && (item instanceof Array && item.length || selectAsFn || getLabel(item));
                        });
                    }

                    function exists(value) {
                        return !!compact(value).length;
                    }

                    function getMatches(query, selectedAs) {
                        scope.isEmptyList = false;

                        if (timeoutPromise && waitTime) {
                            $timeout.cancel(timeoutPromise); //cancel previous timeout
                        }

                        timeoutPromise = $timeout(function () {
                            var values = valuesFn(scope.$parent, {$query: query, $selectedAs: selectedAs}) || '';

                            scope.selectorPosition = options.newItem === 'prompt' ? false : 0;

                            if (!query && !selectedAs) {
                                scope.oldQuery = null;
                            }

                            if (values.$promise && !values.$resolved || angular.isFunction(values.then)) {
                                waitTime = options.debounce;
                            }

                            scope.showLoader = true;

                            return $q.when(values.$promise || values)
                                .then(function (values) {

                                    scope.groups = {};

                                    if (values && keyName) {
                                        //convert object data sources format to array data sources format
                                        var arr = [];

                                        angular.forEach(values, function (value, key) {
                                            if (key.toString().charAt(0) !== '$') {
                                                var item = {};

                                                item[keyTitle] = key;
                                                item[valueTitle] = value;
                                                arr.push(item);
                                            }
                                        });

                                        values = arr;
                                    }

                                    if (values && !selectedAs) {
                                        var outputValues = multiple ? scope.output : [];
                                        var filteredList = listFilter(values, query, getLabel, listFilterOptionsFn(scope.$parent), element);
                                        var withoutIntersection = oiUtils.intersection(filteredList, outputValues, trackBy, trackBy, true);
                                        var filteredOutput = filter(withoutIntersection);

                                        //add element with placeholder to empty list
                                        if (!filteredOutput.length) {
                                            scope.isEmptyList = true;

                                            if (listPlaceholder) {
                                                var context = {};

                                                displayFn.assign(context, listPlaceholder);
                                                filteredOutput = [context[valueName]]
                                            }
                                        }

                                        scope.groups = group(filteredOutput);
                                    }
                                    updateGroupPos();

                                    return values;
                                })
                                .finally(function () {
                                    scope.showLoader = false;

                                    if (options.closeList && !options.cleanModel) { //case: prompt
                                        $timeout(function () {
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

                        if (isOldAngular) {
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
                        scope.isOpen = false;
                        waitTime = 0;

                        if (!options.query) {
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
                        var optionGroups = {'': []},
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
