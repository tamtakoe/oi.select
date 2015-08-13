angular.module('selectDemo')
    .controller('selectCustomizationController', function ($scope, $q, $timeout, ShopArr) {

        $scope.shopArr = ShopArr.query();

        $scope.shopArrFn = function(query, querySelectAs) {
            return findOptions(query);
        };

        function findOptions(query) {
            var deferred = $q.defer();

            $timeout(function() {
                $scope.shopArr.$promise
                    .then(deferred.resolve);
            }, 1000);

            return deferred.promise;
        }

        $scope.bundle = [{
            "id": 9,
            "name": "jeans",
            "category": "clothes"
        },{
            "id": 10,
            "name": "cap"
        }];
    });
