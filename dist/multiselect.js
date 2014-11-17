angular.module('oi.multiselect', []);
angular.module('oi.multiselect')

.provider('oiMultiselect', function() {
    return {
        options: {
            debounce: 500,
            searchFilter: 'oiMultiselectCloseIcon',
            dropdownFilter: 'oiMultiselectHighlight'
        },
        $get: function() {
            return {
                options: this.options
            };
        }
    };
})

.factory('oiUtils', ['$document', function($document) {
    /**
     * Measures the width of a string within a
     * parent element (in pixels).
     *
     * @param {string} str
     * @param {object} $parent
     * @returns {int}
     */
    function measureString(str, $parent) {
        var $mirror = angular.element('<mirror>').css({
            position: 'absolute',
            width: 'auto',
            padding: 0,
            whiteSpace: 'pre',
            visibility: 'hidden',
            'z-index': -99999
        }).text(str || '');

        transferStyles($parent, $mirror, 'letterSpacing fontSize fontFamily fontWeight textTransform'.split(' '));

        $document[0].body.appendChild($mirror[0]);

        var width = $mirror[0].offsetWidth;
        $mirror.remove();

        return width;
    }

    /**
     * Copies CSS properties from one element to another.
     *
     * @param {object} $from
     * @param {object} $to
     * @param {array} properties
     */
    function transferStyles($from, $to, properties) {
        var stylesTo = {},
            stylesFrom = getComputedStyle($from[0], '');

        for (var i = 0, n = properties.length; i < n; i++) {
            stylesTo[properties[i]] = stylesFrom[properties[i]];
        }

        $to.css(stylesTo);
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
            height_menu   = list.offsetHeight;
            height_item   = getWidthOrHeight(item, 'height', 'margin'); //outerHeight(true);
            scroll        = list.scrollTop || 0;
            y             = getOffset(item).top - getOffset(list).top + scroll;
            scroll_top    = y;
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
    var rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" );

    function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles) {
        var i = extra === (isBorderBox ? 'border' : 'content') ?
                // If we already have the right measurement, avoid augmentation
                4 :
                // Otherwise initialize for horizontal or vertical properties
                    name === 'width' ? 1 : 0,

            val = 0,
            cssExpand = ['Top','Right','Bottom','Left'];

        //TODO Use angular.element.css instead of getStyleValue after https://github.com/caitp/angular.js/commit/92bbb5e225253ebddd38ef5735d66ffef76b6a14 will be applied
        function getStyleValue(name) {
            return parseFloat(styles[name]);
        }

        for (; i < 4; i += 2) {
            // both box models exclude margin, so add it if we want it
            if (extra === 'margin') {
                val += getStyleValue(extra + cssExpand[i]);
            }

            if ( isBorderBox ) {
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

    function copyWidth(srcElement, dstElement) {
        dstElement.css('width', getWidthOrHeight(srcElement[0], 'width', 'margin') + 'px');
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

        angular.forEach(obj, function(value) {
            arr.push(value);
        });

        return arr;
    }

    return {
        copyWidth: copyWidth,
        measureString: measureString,
        scrollActiveOption: scrollActiveOption,
        groupsIsEmpty: groupsIsEmpty,
        objToArr: objToArr
    }
}]);
angular.module('oi.multiselect')
    
.directive('oiMultiselect', ['$document', '$q', '$timeout', '$parse', '$interpolate', '$filter', 'oiUtils', 'oiMultiselect', function($document, $q, $timeout, $parse, $interpolate, $filter, oiUtils, oiMultiselect) {
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

            var displayName        = match[2] || match[1],
                valueName          = match[4] || match[6],
                groupByName        = match[3] || '',
                trackByName        = match[8] || displayName,
                valueMatches       = match[7].match(VALUES_REGEXP);

            var valuesName         = valueMatches[1],
                filteredValuesName = valuesName + (valueMatches[3] || ''),
                valuesFnName       = valuesName + (valueMatches[2] || '');

            var displayFn          = $parse(displayName),
                groupByFn          = $parse(groupByName),
                filteredValuesFn   = $parse(filteredValuesName),
                valuesFn           = $parse(valuesFnName),
                trackByFn          = $parse(trackByName);

            var locals             = {},
                timeoutPromise;

            var multiple             = angular.isDefined(attrs.multiple),
                multipleLimit        = Number(attrs.multipleLimit),
                placeholderFn        = $interpolate(attrs.placeholder || ''),
                optionsFn            = $parse(attrs.oiMultiselectOptions),
                keyUpDownWerePressed = false,
                matchesWereReset     = false;

            return function(scope, element, attrs, ctrl) {
                var inputElement = element.find('input'),
                    listElement  = angular.element(element[0].querySelector('.multiselect-dropdown')),
                    placeholder  = placeholderFn(scope),
                    options      = angular.extend({}, oiMultiselect.options, optionsFn(scope));

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

                    if (oiUtils.groupsIsEmpty(scope.groups)) {
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

                    } else if (!angular.isDefined(attrs.notempty)) {
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
                            if (!oiUtils.groupsIsEmpty(scope.groups)) {
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
                        resetMatches();
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

                    if (timeoutPromise && angular.isFunction(values.then)) {
                        $timeout.cancel(timeoutPromise); //cancel previous timeout
                        waitTime = options.debounce;
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

                function ascSort(list, query) {
                    var i, output, output1 = [], output2 = [], output3 = [];

                    var input = angular.isArray(list) ? list : oiUtils.objToArr(list);

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
}]);
angular.module('oi.multiselect')

.filter('oiMultiselectCloseIcon', ['$sce', function($sce) {
    return function(label) {
        var closeIcon = '<span class="close multiselect-search-list-item_selection-remove">×</span>';

        return $sce.trustAsHtml(label + closeIcon);
    };
}])

.filter('oiMultiselectHighlight', ['$sce', function($sce) {
    return function(label, query, option) {

        var html;
        if (query.length > 0 || angular.isNumber(query)) {
            label = label.toString();
            query = query.toString();
            html = label.replace(new RegExp(query, 'gi'), '<strong>$&</strong>');
        } else {
            html = label;
        }

        return $sce.trustAsHtml(html);
    };
}]);
