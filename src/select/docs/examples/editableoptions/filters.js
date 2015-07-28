angular.module('selectDemo')
    .factory('mySaveLastQuery', function() {
        return function(removedValue, lastQuery) {
            return removedValue.name;
        };
    });