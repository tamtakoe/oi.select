angular.module('selectDemo')
    .controller('selectEditableoptionsController', function ($scope, $q, $timeout, ShopArrShort) {

        $scope.ShopArrShort = ShopArrShort.query();
        $scope.ShopArrShort1 = ShopArrShort.query();

        $scope.bundle = ["boots", "shoes"];
        $scope.bundle2 = "shoes";
    });
