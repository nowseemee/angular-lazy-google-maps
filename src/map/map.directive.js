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
                place: '=?',
                customSearchElementId: '=?',
                freezeButton: '=?',
                freezed: '=?',
                isLoading: '@',
                markers: '=?'
            },
            replace: true,
            templateUrl: 'map/map.html',
            link: link
        };
        return directive;


        function link(scope) {
            var maps;
            var renderedMap;
            var marker;
            var infowindow;
            var searchInputElement;
            var markerClusterer;

            scope.isLoading = true;

            scope.toggleFreezed = function () {
                scope.freezed = !scope.freezed;
                if (scope.freezed) { return freeze(); }
                unFreeze();
            };


            function freeze() {
                removeClickListener();
                renderedMap.setOptions({
                    disableDoubleClickZoom: false,
                    draggable: false,
                    scrollwheel: false
                });
            }

            function unFreeze() {
                addClickListener();
                renderedMap.setOptions({
                    disableDoubleClickZoom: true,
                    draggable: true,
                    scrollwheel: true
                });
            }


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
                    center: new google.maps.LatLng(-33.868001, 151.195248),
                    panControlOptions: { position: maps.ControlPosition.LEFT_CENTER },
                    zoomControlOptions: { position: maps.ControlPosition.LEFT_CENTER },
                    streetViewControlOptions: { position: maps.ControlPosition.LEFT_CENTER }
                };
                renderedMap = new maps.Map(document.getElementById('lazy-google-maps-canvas-' + scope.$id), mapOptions);
                marker = new maps.Marker({ map: renderedMap });
                infowindow = new google.maps.InfoWindow();

                renderPlaceSearch();
                addClickListener();

                watchLatLng = scope.$watchGroup(['lat', 'lng'], function (coordinates) {
                    var watchAddress;
                    if(coordinates[0] && coordinates[0]) {
                        placeMarkerByLatLng();
                        return watchLatLng();
                    }

                    watchAddress = scope.$watchGroup(['city', 'country', 'place'], function (address) {
                        if (address[0] || address[1] || address[2]) {
                            watchLatLng();
                            placeMarkerByAddress();
                            return watchAddress();
                        }
                    });
                });

                scope.isLoading = false;

                if (scope.freezed) {
                    freeze();
                }
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
                var searchBox;
                searchInputElement = getSearchInput();
                searchBox = new google.maps.places.SearchBox((searchInputElement));

                if (!scope.customSearchElementId) {
                    renderedMap.controls[maps.ControlPosition.TOP_LEFT].push(searchInputElement);
                }

                maps.event.addListener(searchBox, 'places_changed', function() {
                    var place = searchBox.getPlaces()[0];

                    if (!place) {
                        return;
                    }

                    processPlace(place);
                });

                function getSearchInput() {
                    if (scope.customSearchElementId) {
                        return document.getElementById(scope.customSearchElementId);
                    }
                    return document.getElementById('lazy-google-maps-search-' + scope.$id);
                }
            }


            function addClickListener() {
                maps.event.addListener(renderedMap, 'click', function(target) {
                    var latLng = target.latLng.A + ',' + target.latLng.F;

                    lazyGoogleMapsUtils.reverseGeocode(latLng).then(function (place) {
                        if(place) {
                            processPlace(place);
                        }
                    });
                });
            }


            function processPlace(place) {
                var infoWindowContent;

                infowindow.close();

                if (_.has(place, 'geometry.viewport.Da')) {
                    renderedMap.fitBounds(place.geometry.viewport);
                }

                renderedMap.panTo(place.geometry.location);

                if (scope.markers) {
                    return setMarkerCluster();
                }

                setMarker(place);

                scope.place = place.formatted_address;
                scope.lat = place.geometry.location.A || place.geometry.location.lat;
                scope.lng = place.geometry.location.F || place.geometry.location.lng;

                searchInputElement.value = scope.place;

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


            function removeClickListener() {
                maps.event.clearListeners(renderedMap, 'click');
            }


            function setMarkerCluster() {

                var markerBounds = new google.maps.LatLngBounds();
                var imageUrl = 'http://chart.apis.google.com/chart?cht=mm&chs=24x32&chco=FFFFFF,008CFF,000000&ext=.png';
                var markerImage = new google.maps.MarkerImage(imageUrl, new google.maps.Size(24, 32));


                var markers = _.map(scope.markers, function (position) {
                    var latLng = new google.maps.LatLng(position.lat, position.lng);

                    var googleMarker = new google.maps.Marker({
                        position: latLng,
                        icon: markerImage,
                        title: 'Click to zoom'
                    });

                    maps.event.addListener(googleMarker, 'click', function() {
                        renderedMap.setZoom(17);
                        renderedMap.setCenter(googleMarker.getPosition());
                        console.log(googleMarker);
                    });

                    markerBounds.extend(latLng);
                    return googleMarker;
                });

                var mcOptions = {
                    gridSize: 90,
                    maxZoom: 15,
                    styles: [{
                        url: imageUrl,
                        height: 35,
                        width: 35,
                        anchor: [16, 0],
                        textColor: '#ff00ff',
                        textSize: 10
                    }]
                };
                markerClusterer = new MarkerClusterer(renderedMap, markers, mcOptions);
                renderedMap.fitBounds(markerBounds);
            }
        }
    }
})();
