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
		.when('/contact', {
			templateUrl : 'pages/contact.html',
			controller  : 'contactController'
		})

		// route for the contact page
		.when('/itemlist', {
            templateUrl : 'pages/itemlist.html',
            controller  : 'itemListController'
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

InventoryApp.controller('contactController', function($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';        
});

InventoryApp.controller('itemListController', function ($scope) {
    $scope.message = 'Item List';
    // Use Ajax to submit form data
    $.ajax({
        url: '/api/get_item_list',
        type: 'GET',        
        success: function (result) {
            $scope.item_list = result;
        }

    });
});