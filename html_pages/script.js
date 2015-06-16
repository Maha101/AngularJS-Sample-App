// create the module and name it InventoryApp
var InventoryApp = angular.module('InventoryApp', ['ngRoute']);

InventoryApp.run(function ($window, $rootScope) {
    $rootScope.online = navigator.onLine;
    $window.addEventListener("offline", function () {
        $rootScope.$apply(function () {
            $rootScope.online = false;
            alert("offline");
        });
    }, false);
    $window.addEventListener("online", function () {
        $rootScope.$apply(function () {
            $rootScope.online = true;
            alert("online");
        });
    }, false);
});

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
        .when('/salesSummary', {
            templateUrl : 'pages/salesSummary.html',
            controller  : 'salesSummaryController'
        })

        .when('/salesTransaction', {
            templateUrl : 'pages/salesTransaction.html',
            controller  : 'salesTransactionController'
        })
		// route for the add_new_item page
		.when('/newitem', {
            templateUrl : 'pages/newitem.html',
            controller  : 'newItemController'
        })

        .when('/addOutgoingStock', {
            templateUrl : 'pages/addOutgoingStock.html',
            controller  : 'outgoingStockController'
        })

        .when('/dailyreport', {
            templateUrl : 'pages/dailyReport.html',
            controller  : 'dailyReportController'
        });

});


// create the controller and inject Angular's $scope
InventoryApp.controller('mainController', function($scope) {
	// create a message to display in our view
	$scope.message = 'Everyone come and see how good I look!';
});

InventoryApp.controller('aboutController', function($scope, $routeParams) {
    $scope.message = 'Look! I am an about page. ' + $routeParams.userName;
    $scope.items = [{ name: "cashew", price: 100 }, { name: "pepper", price: 200 }, { name: "dry", price: 300 }];
    $scope.headers = [];
    var count = 0;
    for (i in $scope.items[0]) {
        $scope.headers[count] = i;
        count++;
    }
    //$scope.userName = "kiran" + $routeParams.userName;
});


InventoryApp.controller('dailyReportController', function ($scope) {
    $scope.message = 'DailyReport';
    $scope.orderByField = 'name';
    $scope.reverseSort = false;
    
    from = moment().format('YYYY-MM-DD');
    to = moment().format('YYYY-MM-DD');
    // Get Incoming Stocks Summary
    $.ajax({
        url: '/api/get_incoming_stock?summary=true&from=' +from + "&to=" + to,
        type: 'GET',        
        success: function (result) {
            $scope.incoming_stocks = result;                        
            $scope.$apply();
        },
        error: function (error) {
            $scope.message = 'Failed to get Incoming Stock Summary';
            angular.element('.container').css('background-color', '#FF0000');
            $scope.$apply()
        }
    });

    // get outgoing Stocks Summary
    $.ajax({
        url: '/api/get_outgoing_stock?summary=true&from=' + from + "&to=" + to,
        type: 'GET',        
        success: function (result) {
            $scope.outgoing_stocks = result;
            $scope.$apply();
        },
        error: function (error) {
            $scope.message = 'Failed to get Outgoing Stock Summary';
            angular.element('.container').css('background-color', '#FF0000');
            $scope.$apply()
        }
    });

    // Get Item list
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
    $scope.orderByField = 'quantity';
    $scope.reverseSort = false;
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
    $scope.from = typeof $routeParams.from === 'undefined' ?  moment().subtract('days', 7).format('YYYY-MM-DD') : $routeParams.from;
    $scope.to = typeof $routeParams.to === 'undefined' ? moment().format('YYYY-MM-DD') : $routeParams.to;
    $scope.message = 'Incoming Stocks Summary';
    
    $scope.orderByField = 'name';
    $scope.reverseSort = false;

    // Use Ajax to get data
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
    $scope.from = typeof $routeParams.from === 'undefined' ? moment().subtract('days', 7).format('YYYY-MM-DD') : $routeParams.from;
    $scope.to = typeof $routeParams.to === 'undefined' ? moment().format('YYYY-MM-DD') : $routeParams.to;
    $scope.message = 'Incoming Stocks Details';
    
    $scope.orderByField = 'dt';
    $scope.reverseSort = false;

    // Use Ajax to get data
    $.ajax({
        url: '/api/get_incoming_stock?summary=false&from=' + $scope.from + "&to=" + $scope.to,
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

InventoryApp.controller('addIncomingStockController', function ($scope) {
    $scope.message = 'Add Incoming Stock to Database';
    $scope.config = {
        max_qty: 750,
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
            $scope.message = 'Failed to get Item List list';
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
    window.onbeforeunload = function (event) {
        var message = 'Sure you want to leave?';
        if (typeof event == 'undefined') {
            event = window.event;
        }
        if (event) {
            event.returnValue = message;
            window.onbeforeunload = null;
        }
        return message;
    }
});

InventoryApp.controller('salesSummaryController', function ($scope, $routeParams) {
    $scope.from = typeof $routeParams.from === 'undefined' ?  moment().subtract('days', 7).format('YYYY-MM-DD') : $routeParams.from;
    $scope.to = typeof $routeParams.to === 'undefined' ? moment().format('YYYY-MM-DD') : $routeParams.to;
    $scope.message = 'Outgoing Stocks Summary';
    
    $scope.orderByField = 'name';
    $scope.reverseSort = false;
    
    // Use Ajax to get data
    $.ajax({
        url: '/api/get_outgoing_stock?summary=true&from=' + $scope.from + "&to=" + $scope.to,
        type: 'GET',        
        success: function (result) {
            $scope.item_list = result;
            $scope.$apply();
        },
        error: function (error) {
            $scope.message = 'Failed to get Outgoing Stock Summary';
            angular.element('.container').css('background-color', '#FF0000');
            $scope.$apply()
        }
    });
});

InventoryApp.controller('salesTransactionController', function ($scope, $routeParams) {
    $scope.from = typeof $routeParams.from === 'undefined' ? moment().subtract('days', 7).format('YYYY-MM-DD') : $routeParams.from;
    $scope.to = typeof $routeParams.to === 'undefined' ? moment().format('YYYY-MM-DD') : $routeParams.to;
    $scope.message = 'Outgoing Stocks Details';
    
    $scope.orderByField = 'dt';
    $scope.reverseSort = false;
    
    // Use Ajax to get data
    $.ajax({
        url: '/api/get_outgoing_stock?summary=false&from=' + $scope.from + "&to=" + $scope.to,
        type: 'GET',
        timeout: 8000,        
        success: function (result) {
            $scope.item_list = result;
            $scope.$apply();
        },
        error: function (error) {
            $scope.message = 'Failed to get outgoing Stock';
            angular.element('.container').css('background-color', '#FF0000');
            $scope.$apply()
        }
    });
});

InventoryApp.controller('outgoingStockController', function ($scope) {
    
    $scope.message = 'Add Outgoing Stock to Database';
    $scope.config = {
        max_price: 30000,
        max_qty: -1
    }
    $scope.bill = {
        billno: 0,
        reason: 0,
        comment: ""
    }
    $.ajax({
        url: '/api/current_stocks',
        type: 'GET',        
        success: function (result) {
            $scope.current_stocks = result;
            $scope.$apply();
        },
        error: function (error) {
            $scope.message = 'Failed to get current stock';
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

    window.onbeforeunload = function (event) {
        var message = 'Sure you want to leave?';
        if (typeof event == 'undefined') {
            event = window.event;
        }
        if (event) {
            event.returnValue = message;
            window.onbeforeunload = null;
        }
        return message;
    }
});