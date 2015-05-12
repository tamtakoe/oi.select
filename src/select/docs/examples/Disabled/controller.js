angular.module('selectDemo')
.controller('selectDizabledController', function ($scope, ShopArrShort) {

    $scope.shopArrShort = ShopArrShort.query();

    $scope.bundle = ["slippers", "shirt", "pants"];
});
