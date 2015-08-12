angular.module('selectDemo')
    .controller('selectCleanmodelController', function ($scope, ShopArr) {

        $scope.shopArr = ShopArr.query();

        $scope.bundle = {
            "id": 5,
            "name": "shirt",
            "category": "clothes"
        };
    });
