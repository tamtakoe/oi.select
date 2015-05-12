angular.module('selectDemo')
    .controller('selectNotemptyController', function ($scope, ShopArr) {

        $scope.shopArr = ShopArr.query();

        $scope.bundle = undefined;
    });
