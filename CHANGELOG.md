## 0.2.15
    
#### Features

- **oi-select-options:**
    - saveTrigger: added `tab` value
    
#### Breaking Changes

- **oi-select-options:**
    - saveTrigger has new default format: `enter tab blur`

## 0.2.14
    
#### Bug Fixes

- **oi-select-options:**
    - newItem = "prompt": fixed items saving
    
## 0.2.13

#### Features

- **oi-select:** is optional (useful for new item case)
- **multiple:** is observable
- **multiple-limit:** is observable
- **multiple-placeholder:** placeholder for multiple select if items were chosen
- **oi-select-options:**
    - saveTrigger provides `space` and any chars (`,`, `;` etc.)
    - removeItemFn removes item if promise was resolved
    - newItemFn allows validate new item. Returns `undefined` or rejqcted promise to prevent adding
    
#### Bug Fixes

- **oi-select-options:**
    - editItem: fixed restoring last deleted editable option in multiple mode
    - editItem = 'correct': restore item if model was not changed

#### Breaking Changes

- **oi-select-options:**
    - saveTrigger  has new format: `'blur space ; , /'`. Characters separated by spaces

## 0.2.12

#### Features

- **oi-select-options:**
    - cleanModel: changed behavior (clean model by click). It affected `newItem: 'prompt'`

#### Bug Fixes

- **dropdown** fixed dropdown opening in IE, open dropdown by pushing on letter keys (for single select)
- **oi-select-options:**
    - closeList: fixed

## 0.2.11

#### Bug Fixes

- **events** correct works in container with `tabindex`
- **dropdown** open/close by click on empty input; adapted for window resize
- **examples** correct works on mobile devices
- **disabled** fixed zero width if no chosen elements in disabled mode
    
## 0.2.10

#### Features

- **examples** added example of creating items

- **oi-select-options:**
    - listFilter: 'oiSelectAscSort' provide extra params for filtering by other fields

#### Bug Fixes

- **events** fixed unbind of event handlers after scope destroying
- **single** fixed click on border of oi.select and pressing of key down

#### Breaking Changes

- **oi-options**
    - `$querySelectAs` argument renamed to `$selectedAs`
    
- **oi-select-options:**
    - newItemFn has new format: `'addItem($query)'` instead of `addItem`


## 0.2.9

#### Features

- **examples** added translate and funny examples
- **tests** created test for some filters

#### Bug Fixes

- **dropdown** fixed a case where the list was closed before clicking on the item


## 0.2.8

#### Features

- **styles** use flexbox. Remove measurement input text logic

#### Bug Fixes

- **blur** fixed blur trigger in IE, FF, Opera
- **tests** fixed some tests
- **input** fixed text selection behaviour


## 0.2.7

#### Features

- **version** added version info in `oiSelect` service
- **tests** created test environment and added tests
- **structure** file structure refactoring

#### Bug Fixes

- **compatibility** correct work with `ngAria`


## 0.2.6

#### Bug Fixes

- **IE:** fixed disabled options and multiple limit in IE
- **dropdown** fixed bug when the list does not close immediately when you select item


## 0.2.5

#### Features

- **multiple-limit:** add `limited` class

- **oi-select-options:**
    - closeList (close dropdown list by default after choosing or removing item)
    - listFilter = "none" (add `filter('none', function() { return function(input) { return input; }})`)
    
#### Bug Fixes

- **input:** fix focus/blur
- **default filters** correct work with search expression of several words


## 0.2.4

#### Features

- **oi-select-options:**
    - editItem = "correct" (allows you to edit the value of the deleted item except the first time)

#### Breaking Changes

- **oi-select-options:**
    - saveLastQuery rename to editItem


## 0.2.3

#### Features

- **oi-select-options:**
    - saveLastQuery (default function for `true` value. Add example)
    - newItem = "prompt" (`cleanEmpty = true` by default)
    - newItem = "autocomplete" (`cleanEmpty = false` by default)

#### Bug Fixes

- **dropdown:** stay item in the list if you use `saveLastQuery` in single mode
- **search:** fix cyclic recovering of query while removing
- **input:** correct work with backslash


## 0.2.2

#### Bug Fixes

- **multiple:** fixed deletion of all items from the list


## 0.2.1

#### Features

- **oi-select-options:**
    - cleanModel [depricated] clean model on blur (old behaviour)

#### Bug Fixes

- **items:** use `trackBy` for labels if items are identified by IDs rather than by name
- **oi-options:** use correct scope for getters
- **select as** the order of chosen elements now equal the order of elements in the model

#### Breaking Changes

- **notempty** remove `notempty` (this behavior is the default now)
- **classes** move `open`, `focused` and `loading` classes to `oi-select` element
- **oi-select-options:**
    - autocomplete (rename `autoselect` to `autocomplete`)


## 0.2.0

#### Features

- **oi-select:** rename oi-multiselect to oi-select
- **oi-options:** rename `ng-options` to `oi-options` (compatible with angular 1.4.x)
- **disable when:** provide disabled expression for option
- **build** Grunt replaced on Gulp

#### Bug Fixes

- **tabindex:** work with ngArea
- **input:** prevent default event on enter (prevents accidental form submission)
- **groupping** remove sort group indexes for angular 1.4.x


## 0.1.7

#### Features

- **demo:** new demo page
- **events:** fire `focus` and `blur` event on multiselect element

#### Bug Fixes

- **dropdown:** ignore private keys starts with `$` (f.e. $promise and $resolved added by ngResource)
- **input:** error where `position < 0`


## 0.1.6

#### Features

- do not select the highlighted option on blur (native select behavior)


## 0.1.5

#### Features

- select `as` support

- **oi-select-options:**
    - saveTrigger
    - newItem
    - newItemModel
    - newItemFn


## 0.1.4

#### Bug Fixes

- **dropdown:** stay opened on click if query not empty
- **demo:** remove broken example

#### Performance Improvements

- **oi-select-options:**
    - saveLastQuery


## 0.1.3

#### Features

- **oi-select-options:**
    - saveLastQuery

- **styles**
    - add loading class
    - add arrow icon in all types of single select


## 0.1.2

#### Features

- **oi-select-options:**
    - listFilter



## 0.1.1

#### Features

- **autofocus**
- **oi-select-options:**
    - debounce
    - searchFilter
    - dropdownFilter


## 0.1.0

#### Features

- **provide input filter**
- **provide input function**
- **disabled**
- **multiple and multiple-limit**
- **readonly**
- **notempty**

#### Start

- **module**
- **documentation**
