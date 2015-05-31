(function() {
    'use strict';

    describe('Unit testing lazyGoogleMaps', function() {
        var $compile,
            $rootScope;

        beforeEach(function () {
            module('lazyGoogleMaps');
            module('templates');
        });

        beforeEach(inject(function(_$compile_, _$rootScope_){
            $compile = _$compile_;
            $rootScope = _$rootScope_;
        }));

        it('should have the scope values', function() {
            var lazyGoogleMaps = '<lazy-google-maps ' +
                'lat="location.lat" ' +
                'lng="location.lng" ' +
                'country="location.country" ' +
                'city="location.city" ' +
                'place="location.place" ' +
                'ng-init="location = ' +
                '{lat: -34.397, lng: 150.644, country: \'Australia\', city: \'Sydney\', place: \'dunno\'}"> ' +
                '</lazy-google-maps>';
            var element = angular.element(lazyGoogleMaps);
            var isoScope;

            $compile(element)($rootScope);
            $rootScope.$digest();

            isoScope = element.isolateScope();

            expect(isoScope.lat).toBe(-34.397);
            expect(isoScope.lng).toBe(150.644);
            expect(isoScope.country).toBe('Australia');
            expect(isoScope.city).toBe('Sydney');
            expect(isoScope.place).toBe('dunno');
        });
    });


})();
