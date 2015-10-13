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
                    editItem            = options.editItem,
                    editItemIsCorrected = editItem === 'correct';

                if (editItem === true || editItem === 'correct') {
                    editItem = 'oiSelectEditItem';
                }
                var editItemFn   = editItem ? $injector.get(editItem) : angular.noop,
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

                if (options.newItemFn) {
                    newItemFn = $parse(options.newItemFn);

                } else {
                    newItemFn = function(scope, locals) {
                        return (optionsFn(locals) || {}).newItemModel || locals.$query;
                    };
                }

                if (options.cleanModel && (!editItem || editItemIsCorrected)) {
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

                function valueChangedManually() { //case: clean model; prompt + editItem: 'correct'; initial value = defined/undefined
                    if (editItemIsCorrected) {
                        element.removeClass('cleanMode');
                    }
                    editItemIsCorrected = false;
                }

                scope.$parent.$watch(attrs.ngModel, function(value, oldValue) {
                    var output = value instanceof Array ? value : value ? [value]: [],
                        promise = $q.when(output);

                    modifyPlaceholder();

                    if (oldValue && value !== oldValue) {
                        valueChangedManually();
                    }

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

                    valueChangedManually();

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

                            if (multiple || !scope.backspaceFocus) {
                                scope.query = editItemFn(removedItem, lastQuery, getLabel, editItemIsCorrected) || '';
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

                                if (options.closeList && !options.cleanModel) { //case: prompt
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
