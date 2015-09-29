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

        var counter = 15;
        var newItems = [];

        $scope.addItem = function(query) {
            var deferred = $q.defer();

            $timeout(function() {
                var id = counter++;
                var item = {
                    id: id,
                    name: query,
                    category: "shoes"
                };
                newItems.push(item);

                deferred.resolve(item);
            }, 500);

            return deferred.promise;
        };

        $scope.removeItem = function(item) {
            var deferred = $q.defer();

            $timeout(function() {
                deferred.resolve()
            }, 500);

            return deferred.promise;
        };

        function findOptions(query) {
            var deferred = $q.defer();

            $timeout(function() {
                $scope.shopArr.$promise
                    .then(deferred.resolve);
            }, 500);

            return deferred.promise;
        }

        function getOptionsById(selectedAs) {
            var deferred = $q.defer();

            $timeout(function() {
                $scope.shopArr.$promise
                    .then(function(data) {
                        deferred.resolve(data.concat(newItems))
                    });
            }, 500);

            return deferred.promise;
        }

        $scope.bundle = [4,2,3];
    });
