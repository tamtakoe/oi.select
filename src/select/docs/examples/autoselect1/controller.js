angular.module('selectDemo')
    .controller('selectAutoselectController', function ($scope, ShopObj) {

        $scope.shopObj = ShopObj.get();

        $scope.shopObj.$promise.then(function(data) {
            $scope.bundle = data[5];
        });
    });
