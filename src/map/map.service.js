(function () {
    'use strict';

    angular
        .module('lazyGoogleMaps')
        .factory('lazyGoogleMapsUtils', lazyGoogleMapsUtils);

    function lazyGoogleMapsUtils($http) {
        var service = {
            isLoading: false,
            reverseGeocode: reverseGeocode,
            geocode: geocode
        };

        return service;

        function reverseGeocode(latLng) {
            var googleGeocodeServiceURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=';
            return $http.get(googleGeocodeServiceURL + latLng).then(function (response) {
                return response.data.results[0];
            });
        }


        function geocode(address) {
            var googleGeocodeServiceURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
            return $http.get(googleGeocodeServiceURL + address).then(function (response) {
                return response.data.results[0];
            });
        }

    }
})();
