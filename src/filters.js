angular.module('oi.select')

.filter('oiSelectCloseIcon', ['$sce', function($sce) {
    return function(label) {
        var closeIcon = '<span class="close select-search-list-item_selection-remove">×</span>';

        return $sce.trustAsHtml(label + closeIcon);
    };
}])

.filter('oiSelectHighlight', ['$sce', function($sce) {
    return function(label, query) {
        var html;

        if (query.length > 0 || angular.isNumber(query)) {
            label = label.toString();
            query = query.toString().replace(/\s+.*/, '').replace(/\\/g, '\\\\');

            html = label.replace(new RegExp(query, 'gi'), '<strong>$&</strong>');
        } else {
            html = label;
        }

        return $sce.trustAsHtml(html);
    };
}])

.filter('oiSelectAscSort', function() {
    function ascSort(input, query, getLabel, options) {
        var i, j, isFound, output, output1 = [], output2 = [], output3 = [];

        if (query) {
            query = String(query).replace(/\s+.*/, '').replace(/\\/g, '\\\\');

            for (i = 0, isFound = false; i < input.length; i++) {
                isFound = getLabel(input[i]).match(new RegExp(query, "i"));

                if (!isFound && options) {
                    for (j = 0; j < options.length; j++) {
                        if (isFound) break;

                        isFound = String(input[i][options[j]]).match(new RegExp(query, "i"));
                    }
                }

                if (isFound) {
                    output1.push(input[i]);
                }
            }
            for (i = 0; i < output1.length; i++) {
                if (getLabel(output1[i]).match(new RegExp('^' + query, "i"))) {
                    output2.push(output1[i]);
                } else {
                    output3.push(output1[i]);
                }
            }
            output = output2.concat(output3);
        } else {
            output = [].concat(input);
        }

        return output;
    }

    return ascSort;
})

.filter('none', function() {
    return function(input) {
        return input;
    };
});