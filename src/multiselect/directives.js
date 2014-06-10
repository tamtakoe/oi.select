angular.module('oi.multiselect')
.directive('oiMultiselect', function($document, $q, $timeout, $parse, $interpolate, miltiselectUtils) {
    var NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/;

    return {
        restrict: 'AE',
        templateUrl: '/template/multiselect/template.html',
        require: 'ngModel',
        scope: {},
        compile: function (element, attrs) {
            var optionsExp = attrs.ngOptions,
                match;

            if (!(match = optionsExp.match(NG_OPTIONS_REGEXP))) {
                throw new Error("Expected expression in form of '_select_ (as _label_)? for (_key_,)?_value_ in _collection_'");
            }

            var displayName        = match[2] || match[1],
                valueName          = match[4] || match[6],
                groupByName        = match[3] || '',
                trackByName        = match[8] || displayName,
                valueMatches       = match[7].match(/([^\(\)\s\|\s]*)\s*(\(.*\))?\s*(\|?\s*.+)?/);

            var valuesName         = valueMatches[1],
                filteredValuesName = valuesName + (valueMatches[3] || ''),
                valuesFnName       = valuesName + (valueMatches[2] || '');

            var displayFn          = $parse(displayName),
                groupByFn          = $parse(groupByName),
                filteredValuesFn   = $parse(filteredValuesName),
                valuesFn           = $parse(valuesFnName),
                trackByFn          = $parse(trackByName);

            var locals             = {},
                asyncWaitTime      = Number(attrs.asyncTimeout) || 100,
                timeoutPromise;

            var multiple             = angular.isDefined(attrs.multiple),
                notempty             = angular.isDefined(attrs.notempty),
                multipleLimit        = Number(attrs.multipleLimit),
                placeholderFn        = $interpolate(attrs.placeholder || ''),
                keyUpDownWerePressed = false,
                matchesWereReset     = false;

            return function(scope, element, attrs, ctrl) {
                var inputElement = element.find('input'),
                    listElement  = angular.element(element[0].querySelector('.multiselect-dropdown')),
                    placeholder  = placeholderFn(scope);

                if (angular.isDefined(attrs.readonly)) {
                    inputElement.attr('readonly', true)
                }

                attrs.$observe('disabled', function(value) {
                    inputElement.prop('disabled', value);
                });

                scope.$parent.$watch(attrs.ngModel, function(value) {
                    adjustInput();

                    if (multiple) {
                        scope.output = value;
                    } else {
                        scope.output = value ? [value] : [];
                    }
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
                    if (miltiselectUtils.groupsIsEmpty(groups)) {
                        scope.isOpen = false;
                        $document.off('click', closeHandler);

                    } else if (!scope.isOpen && !attrs.disabled) {
                        scope.isOpen = true;
                        $document.on('click', closeHandler);
                        miltiselectUtils.copyWidth(element, listElement);
                    }
                });

                scope.setFocus = function(event) {
                    if (attrs.disabled) return;

                    if (angular.element(event.target).scope() === this) { //not click on add or remove buttons
                        if (scope.isOpen) {
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
                    if (!isNaN(multipleLimit) && scope.output.length >= multipleLimit) return;

                    var optionGroup = scope.groups[getGroupName(option)];

                    optionGroup.splice(optionGroup.indexOf(option), 1);

                    if (multiple) {
                        ctrl.$setViewValue(angular.isArray(ctrl.$modelValue) ? ctrl.$modelValue.concat(option) : [option]);
                        updateGroupPos();
                    } else {
                        ctrl.$setViewValue(option);
                        resetMatches();
                    }

                    if (miltiselectUtils.groupsIsEmpty(scope.groups)) {
                        scope.groups = {}; //it is necessary for groups watcher
                    }

                    scope.oldQuery = scope.oldQuery || scope.query;
                    scope.query = '';
                    scope.backspaceFocus = false;

                    adjustInput();
                };

                scope.removeItem = function removeItem(position) {
                    if (attrs.disabled) return;

                    if (multiple) {
                        ctrl.$modelValue.splice(position, 1);
                        ctrl.$setViewValue([].concat(ctrl.$modelValue));
                    } else if (!notempty) {
                        ctrl.$setViewValue(undefined);
                    }

                    scope.query = '';

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

                scope.keyParser = function keyParser(event) {
                    var top    = 0,
                        bottom = scope.order.length - 1;

                    switch (event.keyCode) {
                        case 38: /* up */
                            setOption(listElement, scope.selectorPosition === top ? bottom : scope.selectorPosition - 1);
                            keyUpDownWerePressed = true;
                            break;

                        case 40: /* down */
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
                        //case 9: /* tab */
                            if (!miltiselectUtils.groupsIsEmpty(scope.groups)) {
                                scope.addItem(scope.order[scope.selectorPosition]);
                                if (scope.selectorPosition === bottom) {
                                    setOption(listElement, 0);
                                }
                            }
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

                scope.getLabel = getLabel;

                if (multiple) {
                    // Override the standard $isEmpty because an empty array means the input is empty.
                    ctrl.$isEmpty = function(value) {
                        return !value || !value.length;
                    };
                }

                resetMatches();

                function closeHandler(event) {
                    if (event.target.ownerDocument.activeElement !== inputElement[0]) {
                        resetMatches();
                        scope.$digest();
                    }
                }

                function adjustInput() {
                    var currentPlaceholder = ctrl.$modelValue && ctrl.$modelValue.length ? '' : placeholder;
                    inputElement.attr('placeholder', currentPlaceholder);
                    // expand input box width based on content
                    scope.inputWidth = miltiselectUtils.measureString(scope.query || currentPlaceholder, inputElement) + 4;
                }

                function trackBy(item) {
                    locals = {};
                    locals[valueName] = item;
                    return trackByFn(scope, locals);
                }

                function filter(list) {
                    locals = {};
                    //'name.subname' -> {name: {subname: list}}'
                    valuesName.split('.').reduce(function(previousValue, currentItem, index, arr) {
                        return previousValue[currentItem] = index < arr.length - 1 ? {} : list;
                    }, locals);
                    return filteredValuesFn(scope.$parent, locals);
                }

                function getLabel(item) {
                    locals = {};
                    locals[valueName] = item;
                    return displayFn(scope, locals);
                }

                function getGroupName(option) {
                    locals = {};
                    locals[valueName] = option;
                    return groupByFn(scope, locals) || '';
                }

                function getMatches(query) {
                    var values = valuesFn(scope.$parent, {$query: query}),
                        waitTime = 0;

                    scope.selectorPosition = 0;

                    if (!query) {
                        scope.oldQuery = null;
                    }

                    //TODO: Use ngModelOptions.debounce from Angular 1.3 instead of timeout
                    if (timeoutPromise && angular.isFunction(values.then)) {
                        $timeout.cancel(timeoutPromise); //cancel previous timeout
                        waitTime = asyncWaitTime;
                    }

                    timeoutPromise = $timeout(function() {
                        scope.showLoader = true;
                        $q.when(values).then(function(values) {
                            scope.groups = group(filter(ascSort(values, query)));
                            updateGroupPos();
                        }).finally(function(){
                            scope.showLoader = false;
                        });
                    }, waitTime);
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
                    miltiselectUtils.scrollActiveOption(listElement[0], listElement.find('li')[position]);
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

                function ascSort(list, query) {
                    var i, output, output1 = [], output2 = [], output3 = [];

                    var input = angular.isArray(list) ? list : miltiselectUtils.objToArr(list);

                    if (query) {
                        for (i = 0; i < input.length; i++) {
                            if (getLabel(input[i]).match(new RegExp(query, "i"))) {
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

                    removeChoosenFromList(output);

                    return output;
                }

                function removeChoosenFromList(input) {
                    var i, j, chosen = [].concat(scope.output);

                    for (i = 0; i < input.length; i++) {
                        for (j = 0; j < chosen.length; j++) {
                            if (trackBy(input[i]) === trackBy(chosen[j])) {
                                input.splice(i, 1);
                                chosen.splice(j, 1);
                                i--;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
});