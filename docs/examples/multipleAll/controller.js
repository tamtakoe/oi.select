angular.module('selectDemo')
    .controller('selectMultipleAllController', function ($scope, ShopArr) {

        $scope.shopArr = ShopArr.query();

        $scope.bundle = [];
    });
