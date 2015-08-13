angular.module('selectDemo')
    .controller('selectAutofocusController', function ($scope, ShopArr) {

        $scope.shopArr = ShopArr.query();

        $scope.bundle = null;
    });
