angular.module('selectDemo')
    .controller('selectDisabledController', function ($scope, ShopArrShort) {

        $scope.shopArrShort = ShopArrShort.query();

        $scope.bundle = ["slippers", "shirt", "pants"];
    });
