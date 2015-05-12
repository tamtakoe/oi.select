angular.module('selectDemo')
    .controller('selectMultiplelimitController', function ($scope, ShopArrShort) {

        $scope.shopArrShort = ShopArrShort.query();

        $scope.bundle = ['slippers', 'shirt', 'pants'];
    });
