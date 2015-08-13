angular.module('selectDemo')
    .controller('selectReadonlyController', function ($scope, ShopArrShort) {

        $scope.shopArrShort = ShopArrShort.query();

        $scope.bundle = ['T-shirt'];
    });
