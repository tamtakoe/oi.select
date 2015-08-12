angular.module('selectDemo')
    .controller('selectFilteredController', function ($scope, ShopArrShort) {

        $scope.shopArrShort = ShopArrShort.query();

        $scope.bundle = ["slippers", "pants"];
    });
