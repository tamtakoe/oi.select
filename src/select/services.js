angular.module('oi.select')

.provider('oiSelect', function() {
    return {
        options: {
            debounce:       500,
            searchFilter:   'oiSelectCloseIcon',
            dropdownFilter: 'oiSelectHighlight',
            listFilter:     'oiSelectAscSort',
            saveLastQuery:  null,
            newItem:        false,
            saveTrigger:    'enter, backslash'
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

        angular.forEach(obj, function(value, key) {
            if (key.toString().charAt(0) !== '$') {
                arr.push(value);
            }
        });

        return arr;
    }

    //lodash _.isEqual
    function  (x, y) {
        if ( x === y ) return true;
        if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
        if ( x.constructor !== y.constructor ) return false;

        for ( var p in x ) {
            if ( ! x.hasOwnProperty( p ) ) continue;
            if ( ! y.hasOwnProperty( p ) ) return false;
            if ( x[ p ] === y[ p ] ) continue;
            if ( typeof( x[ p ] ) !== "object" ) return false;
            if ( ! objectEquals( x[ p ],  y[ p ] ) ) return false;
        }

        for ( p in y ) {
            if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
        }
        return true;
    }

    //lodash _.intersection + filter + callback + invert
    function intersection(xArr, yArr, callback, xFilter, yFilter, invert) {
        var i, j, n, filteredX, filteredY, out = invert ? [].concat(xArr) : [];

        callback = callback || function(xValue, yValue) {
            return xValue === yValue;
        };

        for (i = 0, n = xArr.length; i < xArr.length; i++) {
            filteredX = xFilter ? xFilter(xArr[i]) : xArr[i];

            for (j = 0; j < yArr.length; j++) {
                filteredY = yFilter ? yFilter(yArr[j]) : yArr[j];

                if (callback(filteredX, filteredY, xArr, yArr, i, j)) {
                    invert ? out.splice(i + out.length - n, 1) : out.push(xArr[i]);
                    break;
                }
            }
        }
        return out;
    }

    function getValue(valueName, item, scope, getter) {
        var locals = {};

        //'name.subname' -> {name: {subname: list}}'
        valueName.split('.').reduce(function(previousValue, currentItem, index, arr) {
            return previousValue[currentItem] = index < arr.length - 1 ? {} : item;
        }, locals);

        return getter(scope, locals);
    }

    return {
        copyWidth:          copyWidth,
        measureString:      measureString,
        scrollActiveOption: scrollActiveOption,
        groupsIsEmpty:      groupsIsEmpty,
        objToArr:           objToArr,
        getValue:           getValue,
        isEqual:            isEqual,
        intersection:       intersection
    }
}]);