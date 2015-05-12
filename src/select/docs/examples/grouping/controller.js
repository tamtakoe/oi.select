angular.module('selectDemo')
    .controller('selectGroupingController', function ($scope, ShopObj) {

        $scope.shopObj = ShopObj.get();

        $scope.shopObj.$promise.then(function(data) {
            $scope.bundle = data[5];
        })
    });
