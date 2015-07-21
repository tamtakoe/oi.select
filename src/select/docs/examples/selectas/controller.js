angular.module('selectDemo')
    .controller('selectSelectasController', function ($scope, $q, $timeout, ShopArr) {

        $scope.shopArr = ShopArr.query();

        $scope.shopArrFn = function(query, querySelectAs) {
            if (querySelectAs) {
                return getOptionsById(querySelectAs);

            } else {
                return findOptions(query);
            }
        };

        $scope.addItem = function(query) {
            var deferred = $q.defer();

            $timeout(function() {
                deferred.resolve(newItem);
            }, 1000);

            return deferred.promise;
        };

        var newItem = {
            id: 0,
            name: "SavedItem",
            category: "shoes"
        };

        function findOptions(query) {
            var deferred = $q.defer();

            $timeout(function() {
                $scope.shopArr.$promise
                    .then(deferred.resolve);
            }, 1000);

            return deferred.promise;
        }

        function getOptionsById(querySelectAs) {
            var deferred = $q.defer();

            $timeout(function() {
                $scope.shopArr.$promise
                    .then(function(data) {
                        deferred.resolve(data.concat(newItem))
                    });
            }, 1000);

            return deferred.promise;
        }

        $scope.bundle = [4,2,3];
    });
