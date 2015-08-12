angular.module('starter.services', [])

        //.factory('Auth', function ($firebaseAuth, $rootScope) {
        //    return $firebaseAuth(fb);
        //})
        .factory("Auth", ["$firebaseAuth", "$rootScope",
            function ($firebaseAuth, $rootScope) {
                //var ref = new Firebase(fb);
                return $firebaseAuth(fb);
            }])

        .factory('fireBaseData', function ($firebase, $rootScope, $ionicPopup, $ionicLoading, $q) {

            var currentData = {
                currentUser: false,
                currentHouse: false,
                isadmin: false
            };

            $rootScope.notify = function (title, text) {
                var alertPopup = $ionicPopup.alert({
                    title: title ? title : 'Error',
                    template: text
                });
            };

            $rootScope.show = function (text) {
                $rootScope.loading = $ionicLoading.show({
                    template: '<i class="icon ion-looping"></i><br>' + text,
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });
            };

            $rootScope.hide = function (text) {
                $ionicLoading.hide();
            };

            return {

                clearData: function () {
                    currentData = false;
                },

                checkDuplicateEmail: function (email) {
                    var deferred = $q.defer();
                    var usersRef = fb.child("roommates/" + escapeEmailAddress(email));
                    usersRef.once("value", function (snap) {
                        if (snap.val() === null) {
                            deferred.resolve(true);
                        } else {
                            deferred.reject('EMAIL EXIST');
                        }

                    });
                    return deferred.promise;
                },

                refreshData: function () {
                    var output = {};
                    var deferred = $q.defer();
                    var authData = fb.getAuth();
                    if (authData) {
                        var usersRef = fb.child("roommates/" + escapeEmailAddress(authData.password.email));
                        usersRef.once("value", function (snap) {
                            output.currentUser = snap.val();
                            var housesRef = fb.child("houses/" + output.currentUser.houseid);
                            housesRef.once("value", function (snap) {
                                output.currentHouse = snap.val();
                                output.currentHouse.id = housesRef.key();
                                output.isadmin = (output.currentHouse.admin === output.currentUser.email ? true : false);
                                deferred.resolve(output);
                            });
                        });
                    } else {
                        output = currentData;
                        deferred.resolve(output);
                    }
                    return deferred.promise;
                }
            }

        })


        .factory('HouseData', function ($firebase, $rootScope, $ionicPopup, $ionicLoading, $state, $firebaseAuth, $q) {

            var ref = fb.child("houses");

            return {

                ref: function () {
                    return ref;
                },

                getHouse: function (email) {
                    var deferred = $q.defer();
                    var usersRef = ref.child(escapeEmailAddress(email));
                    usersRef.once("value", function (snap) {
                        deferred.resolve(snap.val());
                    });
                    return deferred.promise;
                },

                getHouseByCode: function (code) {
                    var deferred = $q.defer();
                    ref.orderByChild("join_code").startAt(code)
                        .endAt(code)
                        .once('value', function (snap) {
                            if (snap.val()) {
                                var house, houseid;
                                angular.forEach(snap.val(), function (value, key) {
                                    house = value;
                                    houseid = key;
                                });
                                if (house.join_code === code) {
                                    deferred.resolve(houseid);
                                }
                            }
                        }, function (errorObject) {
                            console.log("The read failed: " + errorObject.code);
                        });
                    return deferred.promise;
                },

                getHouses: function (id) {
                    var deferred = $q.defer();
                    var output = {};
                    ref.once('value', function (snap) {
                        console.log(snap.val());
                        deferred.resolve(snap.val());
                    });
                    return deferred.promise;
                },

                randomHouseCode: function () {
                    return Math.floor((Math.random() * 100000000) + 100);
                }
            };
        })

        .factory('UserData', function ($firebase, $rootScope, $ionicPopup, $ionicLoading, $state, $firebaseAuth, $q) {

            var ref = fb.child("roommates");

            return {

                ref: function () {
                    return ref;
                },

                getRoomMate: function (email) {
                    var deferred = $q.defer();
                    var usersRef = ref.child(escapeEmailAddress(email));
                    usersRef.once("value", function (snap) {
                        deferred.resolve(snap.val());
                    });
                    return deferred.promise;
                },

                checkRoomMateHasHouse: function (email) {
                    var deferred = $q.defer();
                    var usersRef = ref.child(escapeEmailAddress(email));
                    usersRef.once("value", function (snap) {
                        var user = snap.val();
                        if (user.houseid) {
                            deferred.resolve(true);
                        } else {
                            deferred.reject(false);
                        }
                    });
                    return deferred.promise;
                },

                getRoomMates: function (houseid) {
                    var deferred = $q.defer();
                    var output = {};
                    ref.startAt(houseid)
                        .endAt(houseid)
                        .once('value', function (snap) {
                            deferred.resolve(snap.val());
                        });
                    return deferred.promise;
                },

                quitHouse: function (houseid) {
                    var deferred = $q.defer();
                    var output = {};
                    ref.startAt(houseid)
                        .endAt(houseid)
                        .once('value', function (snap) {
                            deferred.resolve(snap.val());
                        });
                    return deferred.promise;
                }
            };
        })

        .factory('ExpensesData', function ($firebase, $rootScope, $firebaseAuth, $q, UserData, fireBaseData, $firebaseArray, $filter) {

            var expenses = {};

            /* Filter Vars */
            var filter = 'all',
                startTime = '0000000000',
                endTime = 0;

            return {

                all: function () {
                    return expenses;
                },

                getExpenses: function (houseId, filter) {
                    var deferred = $q.defer();
                    var expensesRef = fb.child("houses/" + houseId + '/expenses');
                    //expenses = $firebaseArray(expensesRef);//$firebase(expensesRef).$asArray();
                    var expenses = $firebaseArray(expensesRef);

                    var date = new Date();
                    var dt = $filter('date')(new Date(), 'dd-MM-yyyy');
                    //$scope.ddMMyyyy = $filter('date')(new Date(), 'dd/MM/yyyy');
                    //$scope.ddMMMMyyyy = $filter('date')(new Date(), 'dd, MMMM yyyy');
                    //$scope.HHmmss = $filter('date')(new Date(), 'HH:mm:ss');
                    //$scope.hhmmsstt = $filter('date')(new Date(), 'hh:mm:ss a');
                    Date.prototype.getWeek = function () {
                        var onejan = new Date(this.getFullYear(), 0, 1);
                        return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
                    }
                    function getDateRangeOfWeek(weekNo) {
                        var d1 = new Date();
                        numOfdaysPastSinceLastMonday = eval(d1.getDay() - 1);
                        d1.setDate(d1.getDate() - numOfdaysPastSinceLastMonday);
                        var weekNoToday = d1.getWeek();
                        var weeksInTheFuture = eval(weekNo - weekNoToday);
                        d1.setDate(d1.getDate() + eval(7 * weeksInTheFuture));
                        //var rangeIsFrom = d1.getDate() + "-" + eval(d1.getMonth() + 1) + "-" + d1.getFullYear();
                        //d1.setDate(d1.getDate() + 6);
                        //var rangeIsTo = d1.getDate() + "-" + eval(d1.getMonth() + 1) + "-" + d1.getFullYear();
                        var rangeIsFrom = eval(d1.getMonth() + 1) + "-" + d1.getDate() + "-" + d1.getFullYear();
                        d1.setDate(d1.getDate() + 6);
                        var rangeIsTo = eval(d1.getMonth() + 1) + "-" + d1.getDate() + "-" + d1.getFullYear();
                        return rangeIsFrom + " to " + rangeIsTo;
                    }
                    var weekNumber = (date).getWeek();
                    var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    var daterange = getDateRangeOfWeek(weekNumber);
                    var res = daterange.split(" to ");
                    var startDate = $filter('date')(res[0], 'dd-MM-yyyy'),
                        endDate = $filter('date')(res[1], 'dd-MM-yyyy');
                    var exp = [];

                    var _startDate = Date.parse(startDate),
                        _endDate = Date.parse(endDate);//.getTime();

                    expenses.$loaded().then(function () {
                        angular.forEach(expenses, function (value, key) {
                            if (filter == 'today') {
                                if ($filter('date')(expenses[key].created, 'dd-MM-yyyy') == dt) {
                                    //console.log(expenses[key]);
                                    //exp =expenses[key];// expenses[key];
                                    console.log(exp);
                                    exp.push(expenses[key]);

                                    angular.forEach(exp, function (v, k) {
                                        UserData.getRoomMate(exp[k].user).then(function (user) {
                                            exp[k].user = user.firstname + " " + user.surname;
                                        });
                                    });
                                }

                                deferred.resolve(exp);
                            }
                            else if (filter == "week") {
                                var filterData = '';
                                expensesRef.orderByChild("created").startAt(_startDate).endAt(_endDate).on("value", function (snapshot) {
                                    filterData = snapshot.val();
                                    angular.forEach(filterData, function (v, k) {
                                        UserData.getRoomMate(filterData[k].user).then(function (user) {
                                            filterData[k].user = user.firstname + " " + user.surname;
                                        });
                                    });
                                    snapshot.forEach(function (data) {
                                        console.log("The " + data.key() + " dinosaur's score is " + data.val());
                                    });
                                });
                                //expensesRef.orderByChild("created").startAt(startDate).endAt(endDate)
                                //.on("value", function (snapshot) {
                                //    var x = snapshot.val();
                                //    console.log("got the data!", snapshot);
                                //});
                                deferred.resolve(filterData);
                            }
                            else if (filter == 'month') {
                                var dt = new Date();
                                var _thisMonth = dt.getMonth()+1;
                                console.log(_thisMonth); // 11
                                var filterData = '';
                                expensesRef.once("value", function (snapshot) {
                                    filterData = snapshot.val();
                                    angular.forEach(filterData, function (v, k) {
                                    var date=$filter('date')(filterData[k].created, 'MM-dd-yyyy hh:mm:ss');
                                    var Xmas95 = new Date(date);
                                    var month = Xmas95.getMonth()+1;
exp=[];
                                    if(month==_thisMonth){
                                        exp.push(filterData[k]);
}
                                        UserData.getRoomMate(filterData[k].user).then(function (user) {
                                            filterData[k].user = user.firstname + " " + user.surname;
                                        });
                                    });
                                });
                                deferred.resolve(filterData);
                                
                            }
                            else {
                                UserData.getRoomMate(expenses[key].user).then(function (user) {
                                    expenses[key].user = user.firstname + " " + user.surname;
                                });
                            }
                        });

                        deferred.resolve(expenses);

                    });
                    return deferred.promise;

                },

                getExpense: function (expenseId) {
                    var deferred = $q.defer();
                    var usersRef = fb.child("houses/" + fireBaseData.currentData.currentHouse.id + "/expenses/" + expenseId);
                    usersRef.once("value", function (snap) {
                        var expense = snap.val();
                        deferred.resolve(expense);
                    });
                    return deferred.promise;
                },

                addExpense: function (expense, houseId) {
                    var deferred = $q.defer();
                    var output = {};

                    var sync = fb.child("houses/" + houseId + '/expenses');

                    var onComplete = function (error) {
                        if (error) {
                            deferred.reject(error);
                            console.log('faild to add expense');
                        } else {
                            deferred.resolve(error);
                            console.log('add expense');
                        }
                    };
                    sync.push(expense, onComplete);

                    return deferred.promise;
                }
            }
        })

