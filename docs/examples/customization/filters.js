angular.module('selectDemo')
    .filter('mySearchFilter', ['$sce', function($sce) {
        return function(label, query, option, element) {

            var html = '<i>' + label + '</i>';

            return $sce.trustAsHtml(html);
        };
    }])

    .filter('myDropdownFilter', ['$sce', function($sce) {
        return function(label, query, option, element) {

            var html = '<kbd>#' + option.id + '</kbd> ' + label;

            return $sce.trustAsHtml(html);
        };
    }])

    .filter('myListFilter', function() {
        return function (list, query, getLabel, options, element) {
            return list;
        }
    })

    .factory('myEditItem', function() {
        return function(removedValue, lastQuery, getLabel, editItemIsCorrected, element) {
            return removedValue ? getLabel(removedValue) + ' :-)' : '';
        };
    })

    .filter('myGroupFilter', function($sce) {
        return function(label, query, items, options, element) {

            element[query ? 'addClass' : 'removeClass']('show');

            function toggle(element){
                angular.element(element).parent().parent().find('li').toggleClass('show');
                var iconElement = angular.element(element).find('span');
                iconElement.html(iconElement.html() === '&plus;' ? '&minus;' : '&plus;');
            }

            var html = '<div class="group-header" onclick="(' + toggle.toString() + ')(this)"><span class="group-header-plus">&plus;</span> ' + label + '</div>';

            return $sce.trustAsHtml(html);
        };
    });