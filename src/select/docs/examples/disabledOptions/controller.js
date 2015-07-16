angular.module('selectDemo')
    .controller('selectDisabledoptionsController', function ($scope, ShopArr) {

        $scope.shopArr = ShopArr.query();

        $scope.bundle = [];
    });
