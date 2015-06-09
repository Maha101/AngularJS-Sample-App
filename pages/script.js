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

		// route for the adding incoming stocks
		.when('/addincomingstock', {
			templateUrl : 'pages/addincomingstock.html',
			controller  : 'addIncomingStockController'
        })

         // route for the current stocks
		.when('/currentstock', {
            templateUrl : 'pages/currentstock.html',
            controller  : 'currentStockController'
        })

		// route for the itemlist page
		.when('/itemlist', {
            templateUrl : 'pages/itemlist.html',
            controller  : 'itemListController'
        })

        .when('/incomingStockSummary', {
            templateUrl : 'pages/incomingstocksSummary.html',
            controller  : 'incomingStockSummaryController'
        })

        .when('/incomingStockTransaction', {
            templateUrl : 'pages/incomingstocksTransaction.html',
            controller  : 'incomingStockTransactionController'
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

InventoryApp.controller('addIncomingStockController', function($scope) {
    $scope.message = 'Add Incoming Stock to Database';
    $scope.config = {
        max_qty: 250,
        max_price: 75000
    }
    $.ajax({
        url: '/api/get_item_list',
        type: 'GET',        
        success: function (result) {
            $scope.item_list = result;
            $scope.$apply();
        },
        error: function (error) {
            $scope.message = 'Failed to current stock list';
            angular.element('.container').css('background-color', '#FF0000');
            $scope.$apply()
        }
    });

    $scope.$on('$locationChangeStart', function (event) {        
            var answer = confirm("Are you sure you want to leave this page without submiting chnanges?");
            if (!answer) {
                event.preventDefault();
            }        
    });
});

InventoryApp.controller('itemListController', function ($scope) {
    $scope.message = 'Item List';
    $scope.search = "";
    $.ajax({
        url: '/api/get_item_list',
        type: 'GET',        
        success: function (result) {
            $scope.item_list = result;
            $scope.$apply();
        },
        error: function (error) {
            $scope.message = 'Failed to get item list';
            angular.element('.container').css('background-color', '#FF0000');
            $scope.$apply();
        }
    });
    
});

InventoryApp.controller('currentStockController', function ($scope) {
    $scope.message = 'Current Stocks';
    // Use Ajax to submit form data
    $.ajax({
        url: '/api/current_stocks',
        type: 'GET',        
        success: function (result) {
            $scope.item_list = result;
            $scope.$apply();
        },
        error: function (error) {
            $scope.message = 'Failed to get current Stocks';
            angular.element('.container').css('background-color', '#FF0000');
            $scope.$apply();
        }
    });
});

InventoryApp.controller('newItemController', function ($scope) {
    $scope.message = 'Add New Item';
    
    $.ajax({
        url: '/api/get_item_list',
        type: 'GET',        
        success: function (result) {
            $scope.item_list = result;
            $scope.$apply();
        },
        error: function (error) {
            $scope.message = 'Failed to get item list';
            angular.element('.container').css('background-color', '#FF0000');
            $scope.$apply();
        }
    });
    
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

InventoryApp.controller('incomingStockSummaryController', function ($scope, $routeParams) {
    
    $scope.from = typeof $routeParams.from === 'undefined' ? '2015-05-01' : $routeParams.from;
    $scope.to = typeof $routeParams.to === 'undefined' ? '2020-05-01' : $routeParams.to;
    $scope.message = 'Incoming Stocks Summary from ' + $scope.from + " to " + $scope.to;
    // Use Ajax to submit form data
    $.ajax({
        url: '/api/get_incoming_stock?summary=true&from='+$scope.from+"&to="+$scope.to,
        type: 'GET',        
        success: function (result) {
            $scope.item_list = result;
            $scope.$apply();
        },
        error: function (error) {
            $scope.message = 'Failed to get Incoming Stock Summary';
            angular.element('.container').css('background-color', '#FF0000');
            $scope.$apply()
        }
    });
});

InventoryApp.controller('incomingStockTransactionController', function ($scope, $routeParams) {    
    $scope.from = typeof $routeParams.from === 'undefined' ? '2015-05-01' : $routeParams.from;
    $scope.to = typeof $routeParams.to === 'undefined' ? '2020-05-01' : $routeParams.to;

    $scope.message = 'Incoming Stocks Details from ' + $scope.from + " to " + $scope.to;
    // Use Ajax to submit form data
    $.ajax({
        url: '/api/get_incoming_stock?summary=false&from=' + $routeParams.from + "&to=" + $routeParams.to,
        type: 'GET',        
        success: function (result) {
            $scope.item_list = result;
            $scope.$apply();
        },
        error: function (error) {
            $scope.message = 'Failed to get incoming Stock';
            angular.element('.container').css('background-color', '#FF0000');
            $scope.$apply()
        }
    });
});