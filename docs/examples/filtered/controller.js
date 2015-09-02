angular.module('selectDemo')
    .controller('selectFilteredController', function ($scope, ShopArr, ShopArrShort) {

        $scope.shopArr = ShopArr.query();
        $scope.shopArrShort = ShopArrShort.query();

        $scope.bundle1 = ["slippers", "pants"];

        $scope.bundle2 = [{
            "id": 5,
            "name": "shirt",
            "category": "clothes"
        }];
    });
