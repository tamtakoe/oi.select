angular.module('gettext').run(function (gettextCatalog) {
    gettextCatalog.setStrings('fi', {
        "Test question 1": "Testikysymys 1",
        "Test question 2": "Testikysymys 2",
        "Test question 3": "Testikysymys 3",
        "Test question 4": "Testikysymys 4",
        "Group 1": "Ryhmä 1",
        "Group 2": "Ryhmä 2"
    });
});

angular.module('selectDemo')
    .run(function ($rootScope, gettextCatalog) {
        gettextCatalog.setCurrentLanguage('fi');

        $rootScope.translate = function (str) {
            return gettextCatalog.getString(str);
        };
    })
    .controller('selectTranslateController', function ($scope) {
        $scope.items = [{
            "name" : "Test question 1",
            "group" : "Group 1"
        },{
            "name" : "Test question 2",
            "group" : "Group 1"
        },{
            "name" : "Test question 3",
            "group" : "Group 2"
        },{
            "name" : "Test question 4",
            "group" : "Group 2"
        }];

        $scope.item = $scope.items[0];
    });