angular.module('selectDemo')
    .controller('selectMultipleController', function ($scope, ShopArr, ShopObjShort) {
        
        $scope.shopArr = ShopArr.query();
        $scope.shopObjShort = ShopObjShort.get();

        $scope.bundle = ["1"];
        $scope.bundle2 = [{
            "id": 5,
            "name": "shirt",
            "category": "clothes"
        },{
            "id": 2,
            "name": "shoes",
            "category": "shoes"
        }];
        $scope.bundle3 = [];
    });
