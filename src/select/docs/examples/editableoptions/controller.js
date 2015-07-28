angular.module('selectDemo')
    .controller('selectEditableoptionsController', function ($scope, $q, $timeout, ShopArr) {

        $scope.shopArr = ShopArr.query();

        //$scope.bundle = [{
        //    "id": 9,
        //    "name": "jeans",
        //    "category": "clothes"
        //},{
        //    "id": 10,
        //    "name": "cap"
        //}];

        $scope.bundle = {
            "id": 9,
            "name": "jeans",
            "category": "clothes"
        }
    });
