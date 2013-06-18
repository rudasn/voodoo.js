voodoo.js
=========

Voodoo magic for front-end development.

# Store
Modern web applications are data driven and so the way we work with the data is very important.

**We need things like**

* PubSub/Events - know when some data has changed so that we can do other things like initialize an ajax request or update the UI.
* Array/Set-like functionality - be able to manipulate, organise, retrieve, update data easily and quickly.
* Support for real-time - make it super easy to handle real-time data changing.
* Support for async code without callbacks. Use promises.

### PubSub/Events

```javascript
var RockStars = new RockStars('/rockstars/');

RockStars.on('change:name', function(e, change) {
    var rockstars = change.items,
        old_value = change.from,
        new_value = change.to;
    console.log(rockstars.length +
        ' rock star(s) have changed their name ' +
        ' from ' + old_value + 
        ' to ' + new_value);
});

RockStars.on('push', function(e, change) {
    var rockstars = change.items;
    console.log(rockstars.length + ' new rock stars were added');
});

```

### Arrays

```javascript
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
```

And the usuall methods:

* ``slice``
* ``each``
* ``map``
* ``pluck``
* ``values``

### Objects

```javascript
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

## Two-way data binding

Associate DOM elements with some data. When the data changes, update the DOM element to reflect the new data. When the DOM element changes, update the data to reflect the changes.

```javascript
// The flexible way.
var RockStar = Voodo.View.create({
    'bindings': {
        'name': '.rockstar-name',
        'dod': '.rockstar-dod'
    },
    'initialize': function(attrs, opts) {
        this.binding(this.model, 'name');
        this.binding(this.model, 'dod',
            function(e, change) {
                el.pulsate(2); // pulsate element twice
            });
        return this;
    }
});

var RockStar = Voodo.View.create({
    'initialize': function(attrs, opts) {
        this.binding(this.model, 'name', '.rockstar-name');
        this.binding(this.model, 'dod', '.rockstar-dod',
            function(el, change) {
                el.pulsate(2); // pulsate element twice
            });
        return this;
    }
});

Or the long way around:
var RockStar = Voodo.View.create({
    'areas': {
        '.rockstar-name': function(el) {
            return this.model.get('name');
        }
    },
    'initialize': function(attrs, opts) {
        var _this = this;
        this.model.on('change:name', function(e, change) {
            _this.set('name', change.to, {
                'silent': true
            });
        });
        this.on('change:name', function(e, change) {
            this.area('.rockstar-name');
            this.area('.rockstar-name').pulsate();
            this.model.set('name', change.to);
        });
        return this;
    },
    'render': function() {
        this.html(); // listener to render all areas next
        return this;
    }
});



```

# Controller
The controllers are the "glue" - they bring the data and the UI together at the right place and at the right time.

They are things like:

* Routes - easy URL routing that works (pushState and hash based).
* Global PubSub/Events - for event-based applications.
