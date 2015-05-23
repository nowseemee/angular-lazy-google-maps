# angular-lazy-google-maps
google maps directive with lazy loading for AngularJs

## How to use it
You must include the dependency on your angular module:
```javascript
var app = angular.module('app', ['lazyGoogleMaps'])
```

After that you can include the directive in your markup as an element:
```html
<lazy-google-maps lat="" lng="" country="" city="" place=""></lazy-google-maps>
```

You can attach scope variables as directive attributes so they will be updated when you navigate or search.

Soon, provided attributes will be used to initialize the starting position of the map
or to update the marker position.
