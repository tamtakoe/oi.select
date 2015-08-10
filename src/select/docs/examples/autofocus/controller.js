angular.module('selectDemo')
    .controller('selectAutofocusController', function ($scope, ShopArr) {

        $scope.shopArr = ShopArr.query();

        $scope.bundle = null;

        $scope.bundle1 = [{
            "id": 5,
            "name": "shirt",
            "category": "clothes"
        },{
            "id": 2,
            "name": "shoes",
            "category": "shoes"
        }];
    });
