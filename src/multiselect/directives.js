angular.module('oi.multiselect')
    
.directive('oiMultiselect', ['$document', '$q', '$timeout', '$parse', '$interpolate', '$injector', '$filter', 'oiUtils', 'oiMultiselect', function($document, $q, $timeout, $parse, $interpolate, $injector, $filter, oiUtils, oiMultiselect) {
    var NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/,
        VALUES_REGEXP     = /([^\(\)\s\|\s]*)\s*(\(.*\))?\s*(\|?\s*.+)?/;

    return {
        restrict: 'AE',
        templateUrl: 'template/multiselect/template.html',
        require: 'ngModel',
        scope: {},
        compile: function (element, attrs) {
            var optionsExp = attrs.ngOptions,
                match;

            if (!(match = optionsExp.match(NG_OPTIONS_REGEXP))) {
                throw new Error("Expected expression in form of '_select_ (as _label_)? for (_key_,)?_value_ in _collection_'");
            }

            var selectAsName         = / as /.test(match[0]) && match[1],    //item.modelValue
                displayName          = match[2] || match[1],                 //item.label
                valueName            = match[4] || match[6],                 //item
                groupByName          = match[3] || '',                       //item.groupName
                trackByName          = match[8] || displayName,              //item.id
                valueMatches         = match[7].match(VALUES_REGEXP);        //collection

            var valuesName           = valueMatches[1],                      //collection
                filteredValuesName   = valuesName + (valueMatches[3] || ''), //collection | filter
                valuesFnName         = valuesName + (valueMatches[2] || ''); //collection()

            var selectAsFn           = selectAsName && $parse(selectAsName),
                displayFn            = $parse(displayName),
                groupByFn            = $parse(groupByName),
                filteredValuesFn     = $parse(filteredValuesName),
                valuesFn             = $parse(valuesFnName),
                trackByFn            = $parse(trackByName);

            var multiple             = angular.isDefined(attrs.multiple),
                multipleLimit        = Number(attrs.multipleLimit),
                placeholderFn        = $interpolate(attrs.placeholder || ''),
                keyUpDownWerePressed = false,
                matchesWereReset     = false,
                optionsFn            = $parse(attrs.oiMultiselectOptions);

            var timeoutPromise,
                lastQuery;

            return function(scope, element, attrs, ctrl) {
                var inputElement = element.find('input'),
                    listElement  = angular.element(element[0].querySelector('.multiselect-dropdown')),
                    placeholder  = placeholderFn(scope),
                    options      = angular.extend({}, oiMultiselect.options, optionsFn(scope.$parent)),
                    lastQueryFn  = options.saveLastQuery ? $injector.get(options.saveLastQuery) : function() {return ''};

                options.newItemModelFn = function (query) {
                    return (optionsFn({$query: query}) || {}).newItemModel || query;
                };

                if (angular.isDefined(attrs.autofocus)) {
                    $timeout(function() {
                        inputElement[0].focus();
                    });
                }

                if (angular.isDefined(attrs.readonly)) {
                    inputElement.attr('readonly', true)
                }

                attrs.$observe('disabled', function(value) {
                    inputElement.prop('disabled', value);
                });

                scope.$parent.$watch(attrs.ngModel, function(value) {
                    adjustInput();

                    var output = value instanceof Array ? value : value ? [value]: [],
                        promise = $q.when(output);

                    if (selectAsFn && value) {
                        promise = getMatches(null, value)
                            .then(function(collection) {
                                return oiUtils.intersection(collection, output, oiUtils.isEqual, selectAs);
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
                    adjustInput();

                    //We don't get matches if nothing added into matches list
                    if (inputValue !== oldValue && (!scope.oldQuery || inputValue) && !matchesWereReset) {
                        listElement[0].scrollTop = 0;

                        if (inputValue) {
                            getMatches(inputValue);
                            scope.oldQuery = null;
                        } else {
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
                        oiUtils.copyWidth(element, listElement);

                        if (!scope.isFocused) {
                            $document.on('click', blurHandler);
                            scope.isFocused = true;
                        }
                    }
                });

                scope.setFocus = function(event) {
                    if (attrs.disabled) return;

                    if (angular.element(event.target).scope() === this) { //not click on add or remove buttons
                        if (scope.isOpen && !scope.query) {
                            resetMatches()
                        } else {
                            getMatches(scope.query)
                        }
                    }
                    scope.backspaceFocus = false;

                    if (event.target.nodeName !== 'INPUT') {
                        inputElement[0].focus();
                    }
                };

                scope.addItem = function addItem(option) {
                    lastQuery = scope.query;

                    //duplicate
                    if (oiUtils.intersection(scope.output, [option], null, getLabel, getLabel).length) return;

                    //limit is reached
                    if (!isNaN(multipleLimit) && scope.output.length >= multipleLimit) return;

                    var optionGroup = scope.groups[getGroupName(option)];
                    var modelOption = selectAsFn ? selectAs(option) : option;

                    optionGroup.splice(optionGroup.indexOf(option), 1);

                    if (multiple) {
                        ctrl.$setViewValue(angular.isArray(ctrl.$modelValue) ? ctrl.$modelValue.concat(modelOption) : [modelOption]);
                        updateGroupPos();
                    } else {
                        ctrl.$setViewValue(modelOption);
                        resetMatches();
                    }

                    if (oiUtils.groupsIsEmpty(scope.groups)) {
                        scope.groups = {}; //it is necessary for groups watcher
                    }

                    scope.oldQuery = scope.oldQuery || scope.query;
                    scope.query = '';
                    scope.backspaceFocus = false;

                    adjustInput();
                };

                scope.removeItem = function removeItem(position) {
                    var removedValue;

                    if (attrs.disabled) return;

                    if (multiple) {
                        removedValue = ctrl.$modelValue[position];
                        ctrl.$modelValue.splice(position, 1);
                        ctrl.$setViewValue([].concat(ctrl.$modelValue));

                    } else if (!angular.isDefined(attrs.notempty)) {
                        removedValue = ctrl.$modelValue;
                        ctrl.$setViewValue(undefined);
                    }

                    scope.query = lastQueryFn(removedValue, lastQuery);

                    if (scope.isOpen || scope.oldQuery || !multiple) {
                        getMatches(scope.oldQuery); //stay old list
                    }

                    adjustInput();
                };

                scope.setSelection = function(index) {
                    if (!keyUpDownWerePressed && scope.selectorPosition !== index) {
                        setOption(listElement, index);
                    } else {
                        keyUpDownWerePressed = false;
                    }
                };

                function saveOn(triggerName) {
                    var isTriggered    = (new RegExp(triggerName)).test(options.saveTrigger),
                        isNewItem      = options.newItem && scope.query,
                        isSelectedItem = angular.isNumber(scope.selectorPosition),
                        selectedOrder  = scope.order[scope.selectorPosition],
                        newItemFn      = options.newItemFn || options.newItemModelFn,
                        itemPromise    = $q.reject();

                    if (isTriggered && (isNewItem || isSelectedItem && selectedOrder)) {
                        scope.showLoader = true;
                        itemPromise = $q.when(triggerName !== 'blur' && selectedOrder || scope.query && newItemFn(scope.query));
                    }

                    itemPromise
                        .then(scope.addItem)
                        .finally(function() {
                            var bottom = scope.order.length - 1;

                            if (scope.selectorPosition === bottom) {
                                setOption(listElement, 0); //TODO optimise when list will be closed
                            }
                            options.newItemFn && !isSelectedItem || $timeout(angular.noop); //TODO $applyAsync work since Angular 1.3
                            resetMatches();
                        });
                }

                scope.keyParser = function keyParser(event) {
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
                            break;

                        case 37: /* left */
                        case 39: /* right */
                            break;

                        case 13: /* enter */
                            saveOn('enter');
                            break;
                        case 9: /* tab */
                            saveOn('tab');
                            break;
                        case 220: /* slash */
                            saveOn('slash');
                            event.preventDefault(); //backslash interpreted as a regexp
                            break;

                        case 27: /* esc */
                            resetMatches();
                            break;

                        case 8: /* backspace */
                            if (!scope.query.length) {
                                if (scope.backspaceFocus && scope.output) {
                                    scope.removeItem(scope.output.length - 1);
                                    if (!scope.output.length) {
                                        getMatches();
                                        break;
                                    }
                                }
                                scope.backspaceFocus = !scope.backspaceFocus;
                                break;
                            }
                        default: /* any key */
                            scope.backspaceFocus = false;
                            return false; //preventDefaults
                    }
                };

                scope.getSearchLabel = function(option) {
                    var label = getLabel(option);

                    if (options.searchFilter) {
                        label = $filter(options.searchFilter)(label, scope.oldQuery || scope.query, option)
                    }
                    return label;
                };

                scope.getDropdownLabel = function(option) {
                    var label = getLabel(option);

                    if (options.dropdownFilter) {
                        label = $filter(options.dropdownFilter)(label, scope.oldQuery || scope.query, option)
                    }
                    return label;
                };

                if (multiple) {
                    // Override the standard $isEmpty because an empty array means the input is empty.
                    ctrl.$isEmpty = function(value) {
                        return !value || !value.length;
                    };
                }

                resetMatches();

                function blurHandler(event) {
                    if (event.target.ownerDocument.activeElement !== inputElement[0]) {
                        saveOn('blur');
                        $document.off('click', blurHandler);
                        scope.isFocused = false;
                        scope.$digest();
                    }
                }

                function adjustInput() {
                    var currentPlaceholder = ctrl.$modelValue && ctrl.$modelValue.length ? '' : placeholder;
                    inputElement.attr('placeholder', currentPlaceholder);
                    // expand input box width based on content
                    scope.inputWidth = oiUtils.measureString(scope.query || currentPlaceholder, inputElement) + 4;
                }

                function trackBy(item) {
                    return oiUtils.getValue(valueName, item, scope, trackByFn);
                }

                function selectAs(item) {
                    return oiUtils.getValue(valueName, item, scope, selectAsFn);
                }

                function getLabel(item) {
                    return oiUtils.getValue(valueName, item, scope, displayFn);
                }

                function getGroupName(option) {
                    return oiUtils.getValue(valueName, option, scope, groupByFn) || '';
                }

                function filter(list) {
                    return oiUtils.getValue(valuesName, list, scope.$parent, filteredValuesFn);
                }

                function getMatches(query, querySelectAs) {
                    var values = valuesFn(scope.$parent, {$query: query, $querySelectAs: querySelectAs}),
                        waitTime = 0;

                    scope.selectorPosition = options.newItem === 'prompt' ? false : 0;

                    if (!query && !querySelectAs) {
                        scope.oldQuery = null;
                    }

                    if (timeoutPromise && angular.isFunction(values.then)) {
                        $timeout.cancel(timeoutPromise); //cancel previous timeout
                        waitTime = options.debounce;
                    }

                    timeoutPromise = $timeout(function() {
                        scope.showLoader = true;

                        return $q.when(values)
                            .then(function(values) {
                                if (!querySelectAs) {
                                    var filteredList   = $filter(options.listFilter)(toArr(values), query, getLabel);
                                    var withoutOverlap = oiUtils.intersection(filteredList, scope.output, oiUtils.isEqual, trackBy, trackBy, true);
                                    var filteredOutput = filter(withoutOverlap);

                                    scope.groups = group(filteredOutput);

                                    updateGroupPos();
                                }
                                return values;
                            })
                            .finally(function(){
                                scope.showLoader = false;
                            });
                    }, waitTime);

                    return timeoutPromise;
                }

                function toArr(list) {
                    var input = angular.isArray(list) ? list : oiUtils.objToArr(list);

                    return [].concat(input);
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
                    collectionKeys.sort();

                    for (i = 0; i < collectionKeys.length; i++) {
                        key = collectionKeys[i];
                        value = scope.groups[key];

                        scope.order = scope.order.concat(value);
                        scope.groupPos[key] = groupCount;
                        groupCount += value.length
                    }
                }

                function resetMatches() {
                    scope.oldQuery = null;
                    scope.backspaceFocus = false; // clears focus on any chosen item for del
                    scope.query = '';
                    scope.groups = {};
                    scope.order = [];
                    scope.showLoader = false;
                    scope.isOpen   = false;

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