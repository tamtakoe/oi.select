angular.module('selectDemo')
    .controller('selectValidationController', function ($scope, ShopArr) {
        $scope.shopArr = ShopArr.query();

        $scope.shopArr.$promise.then(function(data) {
            $scope.bundle2 = [data[5]];
        });

        $scope.addItem = function(query) {
            if (/[a-z]/.test(query)) {
                return;
            }

            return {name: query};
        };
    });
