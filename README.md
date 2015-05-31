# angular-lazy-google-maps
google maps directive with lazy loading for AngularJs

[![Build Status](https://travis-ci.org/nowseemee/angular-lazy-google-maps.svg?branch=master)](https://travis-ci.org/nowseemee/angular-lazy-google-maps)

## How to use it
You must include the dependency on your angular module:
```javascript
var app = angular.module('app', ['lazyGoogleMaps'])
```

After that you can include the directive in your markup as an element:
```html
<lazy-google-maps
        lat="location.lat"
        lng="location.lng"
        country="location.country"
        city="location.city"
        place="location.place"
        ng-init="location = {lat: -33.868001, lng: 151.195248, country: 'Australia', city: 'Sydney', place: 'The Star'}">
</lazy-google-maps>
```

You can attach scope variables as directive attributes so they will be updated when you navigate or search.
