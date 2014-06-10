angular.module('multiselectDemo', ['oi.multiselect', 'hljs'])

    .controller('MainCtrl', function ($scope, $http, $timeout, $q) {
        var url = '/src/multiselect/docs/';

        $q.all([
            $http.get(url + 'shopArr.json').success(function(data) {
                $scope.shopArr = data;
            }),
            $http.get(url + 'shopObj.json').success(function(data) {
                $scope.shopObj = data;
            }),
            $http.get(url + 'shopArrShort.json').success(function(data) {
                $scope.shopArrShort = data;
            }),
            $http.get(url + 'shopObjShort.json').success(function(data) {
                $scope.shopObjShort = data;
            })
        ]).then(function() {

            $scope.shopArrFn = function(query) {
                var deferred = $q.defer();
                $timeout(function() {
                    deferred.resolve($scope.shopArr);
                }, 1000);
                return deferred.promise;
            };

            $scope.bundle1 = [{
                "id": 5,
                "name": "shirt",
                "category": "clothes"
            },{
                "id": 2,
                "name": "shoes",
                "category": "shoes"
            }];

            $scope.bundle2 = $scope.shopObjShort[3];

            $scope.bundle3 = $scope.shopObj[5];

            $scope.bundle4 = ["slippers", "pants"];

            $scope.bundle5 = undefined;

            $scope.bundle6 = [{
                "id": 9,
                "name": "jeans",
                "category": "clothes"
            },{
                "id": 10,
                "name": "cap"
            }];
        })
    });
