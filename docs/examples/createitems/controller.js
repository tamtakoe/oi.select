angular.module('selectDemo')
    .controller('selectCreateitemsController', function ($q, $timeout, $scope, ShopArr, ShopArrShort) {

        $scope.shopArrShort = ShopArrShort.query();
        $scope.shopArr = ShopArr.query();

        $scope.bundle1 =['boots'];
        $scope.bundle4 =['smth'];

        $scope.shopArr.$promise.then(function(data) {
            $scope.bundle2 = [data[5]];
            $scope.bundle3 = [data[3]];
        });


        var counter = 0;

        $scope.addItem = function(query) {
            var id = counter++;

            return {
                id: id,
                name: query + '-' + id,
                category: "shoes"
            };
        };
    });
