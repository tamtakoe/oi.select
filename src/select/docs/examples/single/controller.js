angular.module('selectDemo')
    .controller('selectSingleController', function ($scope, ShopObjShort) {

        $scope.shopObjShort = ShopObjShort.get();

        $scope.shopObjShort.$promise.then(function(data) {
            $scope.bundle = data[3];
        })
    });