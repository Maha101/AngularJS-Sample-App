// create the module and name it InventoryApp
var InventoryApp = angular.module('InventoryApp', ['ngRoute']);

// configure our routes
InventoryApp.config(function($routeProvider) {
	$routeProvider

		// route for the home page
		.when('/', {
			templateUrl : 'pages/home.html',
			controller  : 'mainController'
		})

		// route for the about page
		.when('/about/:userName?', {
			templateUrl : 'pages/about.html',
			controller  : 'aboutController'
		})

		// route for the contact page
		.when('/incomingstock', {
			templateUrl : 'pages/incomingstock.html',
			controller  : 'incomingstockController'
		})

		// route for the itemlist page
		.when('/itemlist', {
            templateUrl : 'pages/itemlist.html',
            controller  : 'itemListController'
        })

		// route for the add_new_item page
		.when('/newitem', {
            templateUrl : 'pages/newitem.html',
            controller  : 'newItemController'
        });
});


// create the controller and inject Angular's $scope
InventoryApp.controller('mainController', function($scope) {
	// create a message to display in our view
	$scope.message = 'Everyone come and see how good I look!';
});

InventoryApp.controller('aboutController', function($scope, $routeParams) {
    $scope.message = 'Look! I am an about page. ' + $routeParams.userName;
    //$scope.userName = "kiran" + $routeParams.userName;
});

InventoryApp.controller('incomingstockController', function($scope) {
    $scope.message = 'Add Incoming Stock to Database';        
});

InventoryApp.controller('itemListController', function ($scope) {
    $scope.message = 'Item List';
    // Use Ajax to submit form data
    $.ajax({
        url: '/api/get_item_list',
        type: 'GET',        
        success: function (result) {
            $scope.item_list = result;
        },
        error: function (error) {
            $scope.message = 'Failed to get item list';
            angular.element('.container').css('background-color', '#FF0000');
            $scope.$apply()
        }
    });

});

InventoryApp.controller('newItemController', function ($scope) {
    $scope.message = 'Add New Item';
    
    $scope.itemNamePattern = (function () {        
        return {
            test: function (name) {
                if (name === "" || name.length < 5) {
                    return false;
                }
                var letter = /^[0-9a-zA-Z_\-]+$/;
                if (letter.test(name)) {
                    return true;
                }
                return false;
            }
        };
    })();

    // function to submit the form after all validation has occurred            
    $scope.submitForm = function () {        
        // check to make sure the form is completely valid                
        $.ajax({
            url: '/api/add_item?name='+$scope.item.name,
            type: 'GET',        
            success: function (result) {
                $scope.message = "Added Item " + $scope.item.name + ' to Database.';
                angular.element('.msg').css('background-color', '#00FF00');
                $scope.$apply();
            },
            error: function (error) {
                $scope.message = 'Item ' + $scope.item.name + ' already exists in database'; 
                angular.element('.msg').css('background-color', '#FF0000');
                $scope.$apply();
            }
        })
    };
});
