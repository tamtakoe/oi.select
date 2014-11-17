angular.module('oi.multiselect')

.filter('oiMultiselectCloseIcon', ['$sce', function($sce) {
    return function(label) {
        var closeIcon = '<span class="close multiselect-search-list-item_selection-remove">×</span>';

        return $sce.trustAsHtml(label + closeIcon);
    };
}])

.filter('oiMultiselectHighlight', ['$sce', function($sce) {
    return function(label, query) {

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
