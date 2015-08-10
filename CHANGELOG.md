<a name="0.2.5"></a>
# 0.2.5

## Features

- **multiple-limit:** add `limited` class

- **oi-select-options:**
    - closeList (close dropdown list by default after choosing or removing item)
    - listFilter = "none" (add `filter('none', function() { return function(input) { return input; }})`)
    
## Bug Fixes

- **input:** fix focus/blur
- **default filters** correct work with search expression of several words

<a name="0.2.4"></a>
# 0.2.4

## Features

- **oi-select-options:**
    - editItem = "correct" (allows you to edit the value of the deleted item except the first time)

## Breaking Changes

- **oi-select-options:**
    - saveLastQuery rename to editItem

<a name="0.2.3"></a>
# 0.2.3

## Features

- **oi-select-options:**
    - saveLastQuery (default function for `true` value. Add example)
    - newItem = "prompt" (`cleanEmpty = true` by default)
    - newItem = "autocomplete" (`cleanEmpty = false` by default)

## Bug Fixes

- **dropdown:** stay item in the list if you use `saveLastQuery` in single mode
- **search:** fix cyclic recovering of query while removing
- **input:** correct work with backslash

<a name="0.2.2"></a>
# 0.2.2

## Bug Fixes

- **multiple:** fixed deletion of all items from the list

<a name="0.2.1"></a>
# 0.2.1

## Features

- **oi-select-options:**
    - cleanModel [depricated] clean model on blur (old behaviour)

## Bug Fixes

- **items:** use `trackBy` for labels if items are identified by IDs rather than by name
- **oi-options:** use correct scope for getters
- **select as** the order of chosen elements now equal the order of elements in the model

## Breaking Changes

- **notempty** remove `notempty` (this behavior is the default now)
- **classes** move `open`, `focused` and `loading` classes to `oi-select` element
- **oi-select-options:**
    - autocomplete (rename `autoselect` to `autocomplete`)

<a name="0.2.0"></a>
# 0.2.0

## Features

- **oi-select:** rename oi-multiselect to oi-select
- **oi-options:** rename `ng-options` to `oi-options` (compatible with angular 1.4.x)
- **disable when:** provide disabled expression for option
- **build** Grunt replaced on Gulp

## Bug Fixes

- **tabindex:** work with ngArea
- **input:** prevent default event on enter (prevents accidental form submission)
- **groupping** remove sort group indexes for angular 1.4.x

<a name="0.1.7"></a>
# 0.1.7

## Features

- **demo:** new demo page
- **events:** fire `focus` and `blur` event on multiselect element

## Bug Fixes

- **dropdown:** ignore private keys starts with `$` (f.e. $promise and $resolved added by ngResource)
- **input:** error where `position < 0`

<a name="0.1.6"></a>
# 0.1.6

## Features

- do not select the highlighted option on blur (native select behavior)

<a name="0.1.5"></a>
# 0.1.5

## Features

- select `as` support

- **oi-select-options:**
    - saveTrigger
    - newItem
    - newItemModel
    - newItemFn

<a name="0.1.4"></a>
# 0.1.4

## Bug Fixes

- **dropdown:** stay opened on click if query not empty
- **demo:** remove broken example

## Performance Improvements

- **oi-select-options:**
    - saveLastQuery

<a name="0.1.3"></a>
# 0.1.3

## Features

- **oi-select-options:**
    - saveLastQuery

- **styles**
    - add loading class
    - add arrow icon in all types of single select

<a name="0.1.2"></a>
# 0.1.2

## Features

- **oi-select-options:**
    - listFilter


<a name="0.1.1"></a>
# 0.1.1

## Features

- **autofocus**
- **oi-select-options:**
    - debounce
    - searchFilter
    - dropdownFilter


<a name="0.1.0"></a>
# 0.1.0

## Features

- **provide input filter**
- **provide input function**
- **disabled**
- **multiple and multiple-limit**
- **readonly**
- **notempty**

## Start

- **module**
- **documentation**
