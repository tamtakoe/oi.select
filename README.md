oi.multiselect — AngularJS directive of select element

==============

## Features

* API compatible with [Angular select](https://docs.angularjs.org/api/ng/directive/select)
* without jQuery and other dependencies
* search options by substring (including the search query to the server)
* use [Bootstrap](getbootstrap.com) styles (but you can use own styles)
* 14 KB minified

## Demo

Do you want to see module in action? Visit http://tamtakoe.github.io/oi.multiselect/!

## Installation

You can make build:

```npm install
npm install -g grunt-cli
grunt build
```

or download files through Bower:

```npm install -g bower
bower install oi.bootstrap
```

Then you need to include into index.html:

```multiselect.min.css
multiselect.min.js or multiselect-tpls.min.js
```

When you are done downloading all the dependencies and project files the only remaining part is to add dependencies on the `oi.multiselect` AngularJS module:

```javascript
angular.module('myModule', ['oi.multiselect']);
```