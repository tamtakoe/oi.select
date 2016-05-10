angular.module('selectDemo')
    .controller('selectMultipleController', function ($scope, ShopArr) {

        $scope.shopObj = {
            5: "shirts",
            '1': "sneakers",
            2: "shoes",
            3: "foobar"
        };

        // $scope.shopArr = ["shirts", "sneakers", "shoes", "foobar"];

        $scope.bundle = ['1'];

        // $scope.shopArr = ShopArr.query();

        // $scope.bundle = [{
        //     "id": 5,
        //     "name": "shirt",
        //     "category": "clothes"
        // },{
        //     "id": 2,
        //     "name": "shoes",
        //     "category": "shoes"
        // }];

        $scope.bundle2 = [];
        $scope.bundle3 = [];
    });
