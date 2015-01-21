angular.module('multiselectDemo', ['oi.multiselect', 'hljs'])

    .controller('MainCtrl', function ($scope, $http, $timeout, $q, $location, $anchorScroll) {
        var url = 'src/multiselect/docs/';

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

            var newItem = {
                id: 0,
                name: "SavedItem",
                category: "shoes"
            };

            function findOptions(query) {
                var deferred = $q.defer();
                $timeout(function() {
                    deferred.resolve($scope.shopArr);
                }, 1000);
                return deferred.promise;
            }

            function getOptionsById(querySelectAs) {
                var deferred = $q.defer();
                $timeout(function() {
                    deferred.resolve($scope.shopArr.concat(newItem));
                }, 1000);
                return deferred.promise;
            }

            $scope.shopArrFn = function(query, querySelectAs) {
                if (querySelectAs) {
                    return getOptionsById(querySelectAs);

                } else {
                    return findOptions(query);
                }
            };

            $scope.addItem = function(query) {
                var deferred = $q.defer();
                $timeout(function() {
                    deferred.resolve(newItem);
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

            $scope.bundle6 = ["slippers", "shirt", "pants"];

            $scope.bundle7 = $scope.shopObjShort[8];

            $scope.bundle8 = undefined;

            $scope.bundle9 = ["slippers", "shirt", "pants"];

            $scope.bundle10 = null;

            $scope.bundle11 = [{
                "id": 9,
                "name": "jeans",
                "category": "clothes"
            },{
                "id": 10,
                "name": "cap"
            }];

            $scope.bundle12 = [{
                "id": 9,
                "name": "jeans",
                "category": "clothes"
            },{
                "id": 2,
                "name": "shoes",
                "category": "shoes"
            }];

            $scope.bundle13 = $scope.shopObj[5];

            $scope.bundle14 = $scope.shopObj[5];

            $scope.bundle15 = [2,3,4];
        });

        $scope.scrollTo = function(id) {
            $location.hash(id);
            $anchorScroll();
        }
    })

    .filter('mySearchFilter', ['$sce', function($sce) {
        return function(label) {

            var html = '<i>' + label + '</i>';

            return $sce.trustAsHtml(html);
        };
    }])

    .filter('myDropdownFilter', ['$sce', function($sce) {
        return function(label, query, option) {

            var html = '<kbd>#' + option.id + '</kbd> ' + label;

            return $sce.trustAsHtml(html);
        };
    }])

    .filter('myListFilter', function() {
        return function (list, query, getLabel) {
            return list;
        }
    })

    .factory('mySaveLastQuery', function() {
        return function(removedValue, lastQuery) {
            return removedValue.name;
        };
    });
