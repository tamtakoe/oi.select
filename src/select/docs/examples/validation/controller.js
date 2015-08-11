angular.module('selectDemo')
    .controller('selectValidationController', function ($scope, ShopArr) {
        $scope.shopArr = ShopArr.query();
    });
