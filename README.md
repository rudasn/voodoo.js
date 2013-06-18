voodoo.js
=========

Voodoo magic for front-end development.

# Store
Modern web applications are data driven and so the way we work with the data is very important.

We need things like

* PubSub/Events - know when some data has changed so that we can do other things like initialize an ajax request or update the UI.
* Array/Set-like functionality - be able to manipulate, organise, retrieve, update data easily and quickly.
* Support for real-time - make it super easy to handle real-time data changing.
* Support for async code without callbacks. Use promises.

```javascript

// Handling an array
var RockStars = new RockStars('/rockstars/?sortBy=name');

// Filter
var named_jimmy = RockStars.filter({ 'name': 'Jimmy' });
named_jimmy.length; // => 12
named_jimmy.filter({ 'surname': 'Hendrix' }); // => 1

var older_than_27 = RockStars.filter({ 'age__gt': 27 });
older_than_27.length; // => 628

var age_range = RockStars.filter({ 'age__range': [ 24, 29 ] });
age_range.length; // => 291

var gte24_or_lte29 = RockStars.filter({ 'age__gte': 24 }, { 'age__lte': 29 });
gte24_or_lte29.length; // => 1291

// Push
RockStars.push({
    "id": "2",
    "name": "Janis",
    "surname": "Joplin"
});

// Set
RockStars.filter({
    "name": "Janis"
}, {
    "name": "Hendrix"
}).set({
    "decades_active": [ 1960, 1970 ]
});

RockStars.get({ // get using a filter (slower, but cached)
    "name": "Janis",
    "surname": "Joplin"
}); 

RockStars.get("2"); // get using the ID (fastest, always cached)

// Handling an object
var rockStar = new Store('/rockstars/1');

// Get
rockStar.get('name'); // => Jimmy Hendrix
rockStar.get('decates_active'); // => [ 1960, 1970 ]

// Set
rockStar.set('bands', {
    '01': {
        'name': 'The Jimmy Hendrix Experience'
    }    
});

// Merge
rockstar.merge('bands', {
    '01': {
        'start_date': 1950,
        'end_date': 1953
    }
    '02': {
        'name': 'The Jimmy Hendrix Experience',
        'start_date': 1950,
        'end_date': 1953        
    }
});


```

# View
The second most important thing in a modern web application is the UI. We need to be able to render and manipulate the UI super quickly and with great ease. 

We need things like

* PubSub/Events -
* Two-way data binding - 
* Class name data bindings -
* Support for sub-views/child views -

# Controller
The controllers are the "glue" - they bring the data and the UI together at the right place and at the right time.

They are things like:

* Routes - easy URL routing that works (pushState and hash based).
* Global PubSub/Events - for event-based applications.
