angular.module('oi.multiselect')
.filter('multiselectHighlight', ['$sce', function($sce) {
    return function(text, query) {
        var html;
        if (query.length > 0 || angular.isNumber(query)) {
            text = text.toString();
            query = query.toString();
            html = text.replace(new RegExp(query, 'gi'), '<strong>$&</strong>');
        } else {
            html = text;
        }

        return $sce.trustAsHtml(html);
    };
}]);
