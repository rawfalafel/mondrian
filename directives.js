/* global angular */
angular.module('directives', []).
    directive('ngRightClick', function($parse) {
        return function(scope, element, attrs) {
            var fn = $parse(attrs.ngRightClick);
            element.bind('contextmenu', function(e) {
                scope.$apply(function() {
                    e.preventDefault();
                    fn(scope, {$event: event});
                });
            });
        };
    });