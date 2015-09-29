#oi.select — AngularJS directive of select element

**[Download 0.2.12](https://github.com/tamtakoe/oi.select/tree/master/dist)**

## Features

* multiselect
* API compatible with [Angular select](http://docs.angularjs.org/api/ng/directive/select)
* Angular 1.2+ without jQuery and other dependencies
* search options by substring (including the search query to the server)
* use [Bootstrap](http://getbootstrap.com) styles (but you can use own styles)
* 17 KB minified

## Demo

Do you want to see module in action? Visit [tamtakoe.github.io/oi.select](//tamtakoe.github.io/oi.select/) or try [playground](http://plnkr.co/edit/LnntLUdrAfz0DDlCGtGv?p=preview)


## Installation

You can download files through Bower:

```
npm install -g bower
bower install oi.select
```

or use local:

```
npm install
npm install -g bower
npm install -g gulp
bower install
```

run local:

```
gulp
open "http://localhost:3000"
```

make build and run tests:

```
gulp build
gulp test
```


Then you need to include into index.html:

```
select.min.css
select.min.js or select-tpls.min.js
```

When you are done downloading all the dependencies and project files the only remaining part is to add dependencies on the `oi.select` AngularJS module:

```javascript
angular.module('myModule', ['oi.select']);
```

Use `oi-select` directive:

```html
<oi-select
    oi-options="item.name for item in shopArr track by item.id"
    ng-model="bundle"
    multiple
    placeholder="Select"
    ></oi-select>
```

## Attributes
### oi-select directive
* `oi-options` — see: [ngOptions](http://docs.angularjs.org/api/ng/directive/ngOptions)
  * `oi-options="item for item in shopArrShort | limitTo: 3"` — filter input list
  * `oi-options="item for item in shopArrFn($query, $selectedAs)"` — generate input list (expects array/object or promise)
* `ng-model` — chosen item/items
* `ng-disabled` — specifies that a drop-down list should be disabled
* `multiple` — specifies that multiple options can be selected at once
* `multiple-limit` — maximum number of options that can be selected at once
* `readonly` — specifies that an input field is read-only
* `autofocus` — specifies that an input field should automatically get focus when the page loads
* `oi-select-options` — object with options. You can override them in `oiSelectProvider.options`
  * `debounce` — timeout of debounced input field (default: 500). Set only if `value` is function which return promise
  * `searchFilter` — filter name for items in search field
  * `dropdownFilter` — filter name for items in dropdown
  * `listFilter` — filter name for items order in dropdown. Use `none` to disable filtering
  * `editItem` — function which get `lastQuery`, `removedItem` and `getLabel(item)` and return string for input after element was removed (default: ''). `editItem = true` allows you to edit a deleted item. `editItem = 'correct'` same as `true` but does not edit the first time
  * `saveTrigger` — Trigger on which element is stored in the model. May be `enter`, `blur`, `space` and any characters devided by spaces (default: `enter`)
  * `cleanModel` — Clean model on click for single select.
  * `closeList` — close dropdown list by default after choosing or removing item (default: true)
  * `newItem` — Mode of adding new items from query (default: false). May be `autocomplete` (priority save matches), `prompt` (priority save new item)
  * `newItemModel` — New items model (default: model = query). `$query` value from model will be changed to query string.
  * `newItemFn` — function which get query and return new item object or promise. F.e. `'addItem($query)'`
  * `removeItemFn` — function which get removed item model and return any value or promise. If promise was rejected, item wouldn't removed. F.e. `'removeItem($item)'`

### oiSelect service
 * `options` — default options which we can override in `oiSelectProvider.options`
 * `version` — current version
