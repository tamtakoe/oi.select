angular.module('selectDemo')
    .controller('selectFunnyController', function ($scope) {

        $scope.items = [
            "I'm a bad programmer",
            "I'm a good programmer",
            "I'm a very good programmer",
            "I'm the best programmer"
        ];

        $scope.result = $scope.items[0];
    });