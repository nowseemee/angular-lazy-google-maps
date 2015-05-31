(function() {
    'use strict';

    angular
        .module('lazyGoogleMaps')
        .directive('lazyGoogleMaps', lazyGoogleMaps);

    function lazyGoogleMaps ($window, $q, $rootScope, lazyGoogleMapsUtils) {
        var _ = $window._;
        var directive = {
            restrict: 'E',
            scope: {
                lat: '=?',
                lng: '=?',
                country: '=?',
                city: '=?',
                place: '=?'
            },
            replace: true,
            templateUrl: 'lazyGoogleMaps.html',
            link: link
        };
        return directive;


        function link(scope) {
            var maps;
            var renderedMap;
            var marker;
            var infowindow;

            if (maps) {
                return renderMap();
            }

            injectMap().then(function () {
                $rootScope.$broadcast('lazyGoogleMaps:loaded');
                renderMap();
            });


            function injectMap() {
                var deferred = $q.defer();
                var options = ['sensor=false', 'callback=mapLoaded', 'libraries=places'];
                var source = 'https://maps.googleapis.com/maps/api/js?' + options.join('&');
                var scriptTag = document.createElement('script');
                scriptTag.type = 'text/javascript';
                scriptTag.src = source;

                if (lazyGoogleMapsUtils.isLoading) {
                    scope.$on('lazyGoogleMaps:loaded', renderMap);
                    deferred.reject();

                    return deferred.promise;
                }

                document.body.appendChild(scriptTag);
                lazyGoogleMapsUtils.isLoading = true;

                $window.mapLoaded = function () {
                    deferred.resolve();
                };

                return deferred.promise;
            }


            function renderMap() {
                var mapOptions;
                var watchLatLng;
                maps = google.maps;
                mapOptions = {
                    zoom: 8,
                    center: new maps.LatLng(scope.lat, scope.lng)
                };
                renderedMap = new maps.Map(document.getElementById('lazy-google-maps-canvas-' + scope.$id), mapOptions);
                marker = new maps.Marker({ map: renderedMap });
                infowindow = new google.maps.InfoWindow();

                renderPlaceSearch();
                addClickListener();

            }

            function placeMarkerByLatLng() {
                var latLng = scope.lat + ',' + scope.lng;

                lazyGoogleMapsUtils.reverseGeocode(latLng).then(function (place) {
                    if(place) {
                        processPlace(place);
                    }
                });
            }

            function placeMarkerByAddress() {
                var address = (scope.city || '') + ' ' + (scope.country || '') + ' ' + (scope.place || '');

                lazyGoogleMapsUtils.geocode(address).then(function (place) {
                    if(place) {
                        processPlace(place);
                    }
                });
            }


            function renderPlaceSearch() {
                var searchInput = (document.getElementById('lazy-google-maps-search-' + scope.$id));
                var searchBox = new google.maps.places.SearchBox((searchInput));

                renderedMap.controls[maps.ControlPosition.TOP_LEFT].push(searchInput);

                maps.event.addListener(searchBox, 'places_changed', function() {
                    var place = searchBox.getPlaces()[0];

                    console.log(place);

                    if (!place) {
                        return;
                    }

                    processPlace(place);
                });

            }


            function addClickListener() {
                maps.event.addListener(renderedMap, 'click', function(target) {
                    var latLng = target.latLng.A + ',' + target.latLng.F;

                    lazyGoogleMapsUtils.reverseGeocode(latLng).then(function (place) {
                        console.log(place);
                        processPlace(place);
                    });
                });
            }


            function processPlace(place) {

                var bounds = new maps.LatLngBounds();
                var infoWindowContent;

                setMarker(place);

                infowindow.close();

                if (_.has(place, 'geometry.viewport.Da')) {
                    renderedMap.fitBounds(place.geometry.viewport);
                } else if (_.has(place, 'geometry.location.A')) {
                    bounds.extend(place.geometry.location);
                    renderedMap.fitBounds(bounds);
                }

                renderedMap.setCenter(place.geometry.location);

                scope.place = place.formatted_address;
                scope.lat = place.geometry.location.A || place.geometry.location.lat;
                scope.lng = place.geometry.location.F || place.geometry.location.lng;

                processAddressComponents(place);

                infoWindowContent = '<div><strong>' + scope.city + '</strong><br>' + scope.place + '</div>';
                infowindow.setContent(infoWindowContent);
                infowindow.open(renderedMap, marker);

            }


            function setMarker(place) {
                var markerImage = {
                    url: place.icon,
                    size: new maps.Size(71, 71),
                    origin: new maps.Point(0, 0),
                    anchor: new maps.Point(17, 34),
                    scaledSize: new maps.Size(35, 35)
                };
                var position = place.geometry.location;
                if (place.icon) {
                    marker.setIcon((markerImage));
                }
                marker.setPosition(position);
                marker.setVisible(true);
            }


            function processAddressComponents(place) {
                var country = _.filter(place.address_components, { types: ['country'] });
                var city = _.filter(place.address_components, { types: ['locality'] });

                scope.country = country[0] ? country[0].long_name : scope.place;
                scope.city = city[0] ? city[0].long_name : scope.country;
            }
        }
    }
})();
