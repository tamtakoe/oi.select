var URL = 'src/select/docs/';

angular.module('selectDemo', ['oi.multiselect', 'ngResource', 'hljs'])

    .factory('ShopArr', function ($resource) {
        return $resource(URL + 'data/shopArr.json', {}, {
                query: {method: 'GET', cache: true, isArray: true}
            }
        );
    })

    .factory('ShopArrShort', function ($resource) {
        return $resource(URL + 'data/shopArrShort.json', {}, {
                query: {method: 'GET', cache: true, isArray: true}
            }
        );
    })

    .factory('ShopObj', function ($resource) {
        return $resource(URL + 'data/shopObj.json', {}, {
                get:   {method: 'GET', cache: true}
            }
        );
    })

    .factory('ShopObjShort', function ($resource) {
        return $resource(URL + 'data/shopObjShort.json', {}, {
                get:   {method: 'GET', cache: true}
            }
        );
    })

    .controller('selectDocsController', function ($scope, ShopArr, $timeout, $q, $location, $anchorScroll) {
        var menu = [
            {urlName: 'autofocus',     name: 'Autofocus'},
            {urlName: 'multiple',      name: 'Multiple'},
            {urlName: 'single',        name: 'Single'},
            {urlName: 'grouping',      name: 'Grouping'},
            {urlName: 'filtered',      name: 'Filtered'},
            {urlName: 'lazyloading',   name: 'Lazy loading'},
            {urlName: 'disabled',      name: 'Disabled'},
            {urlName: 'readonly',      name: 'Read only'},
            {urlName: 'notempty',      name: 'Not empty'},
            {urlName: 'multiplelimit', name: 'Multiple limit'},
            {urlName: 'autoselect',    name: 'Autoselect'},
            {urlName: 'prompt',        name: 'Prompt'},
            {urlName: 'selectas',      name: 'Select as'},
            {urlName: 'customization', name: 'Customization'},
            {urlName: 'all',           name: 'All'}
        ];

        $scope.demo = {};
        $scope.demo.menu = menu;

        $scope.$on('$locationChangeSuccess', function() {
            var hash = $location.hash() || 'autofocus';

            $scope.demo.name = hash;
            $scope.demo.viewUrl = URL + 'examples/' + hash + '/template.html';
        });
    });