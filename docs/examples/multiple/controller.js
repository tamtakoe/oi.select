angular.module('selectDemo')
    .controller('selectMultipleController', function ($scope, ShopArr) {

        $scope.shopArr = ShopArr.query();

        $scope.bundle = [{
            "id": 5,
            "name": "shirt",
            "category": "clothes"
        },{
            "id": 2,
            "name": "shoes",
            "category": "shoes"
        }];

        $scope.bundle2 = [];
        $scope.bundle3 = [];
    });
