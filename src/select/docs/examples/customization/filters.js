angular.module('selectDemo')
    .filter('mySearchFilter', ['$sce', function($sce) {
        return function(label) {

            var html = '<i>' + label + '</i>';

            return $sce.trustAsHtml(html);
        };
    }])

    .filter('myDropdownFilter', ['$sce', function($sce) {
        return function(label, query, option) {

            var html = '<kbd>#' + option.id + '</kbd> ' + label;

            return $sce.trustAsHtml(html);
        };
    }])

    .filter('myListFilter', function() {
        return function (list, query, getLabel) {
            return list;
        }
    })

    .factory('myEditItem', function() {
        return function(removedValue, lastQuery, getLabel) {
            return removedValue ? getLabel(removedValue) + ' :-)' : '';
        };
    });