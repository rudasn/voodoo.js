voodoo.js
=========

Voodoo magic for front-end development based on four components:

* PubSub and Object.Observers - for asynchronous events.
* Router - change application state according to the URL.
* Store - our collections of things.
* Model - our things, our data.
* View - how we present our data and how the presentation behaves.

**It does:**

* Separation of concerns.
* Allow for modularized architecture.
* Event-based applications.
* Two-way data-binding.
* Subviews/Child Views.

**Philosophy**

Data is different than structure is different than presentation is different than behaviour, but affects all.

Explicit over implicit: All voodoo instances have listeners (Object.observe) for all  properties!
Modularized, Extendable, Dispoable magic: Code that contains magic (like areas, or attributes) can be easily extended and/or replaced.


# Store
Modern web applications are data driven and so the way we work with the data is very important.

**We need things like**

* PubSub/Events - know when some data has changed so that we can do other things like initialize an ajax request or update the UI.
* Array/Set-like functionality - be able to manipulate, organise, retrieve, update data easily and quickly.
* Support for real-time - make it super easy to handle real-time data changing.
* Support for async code without callbacks. Use promises.

### PubSub/Events

```javascript
var rockStars = new Voodo.Store('/rockstars/');

rockStars.on('change:name', function(e, change) {
    var rockstars = change.items,
        old_value = change.from,
        new_value = change.to;
    console.log(rockstars.length +
        ' rock star(s) have changed their name ' +
        ' from ' + old_value + 
        ' to ' + new_value);
});

rockStars.on('add', function(e, change) {
    var rockstars = change.items;
    console.log(rockstars.length + ' new rock stars were added');
});

```

### Inheritance

```javascript
var RockStars = Voodoo.Store.create({
    'sayName': function() {
        return this.each(function() {
            console.log('Hi! My name is ' + this.name);
        });
    }
})

var RockStarsSixties = RockStars.create({
    'sayName': function() {
        return this.each(function() {
            console.log("Hey man.. How's it going?");
        });
    }
});
```

### Arrays

```javascript
var RockStars = new Voodo.Store('/rockstars/');

// Whenever data is fetched from server pass the results
// to this method and return the data we want.
RockStars.parse = function(response, status, xhr) {
    return response.items; 
};
```

#### Filter
```javascript
var named_jimmy = RockStars.filter({ 'name': 'Jimmy' });
named_jimmy.length; // => 12
named_jimmy.filter({ 'surname': 'Hendrix' }).length; // => 1

var older_than_27 = RockStars.filter({ 'age__gt': 27 });
older_than_27.length; // => 628

var age_range = RockStars.filter({ 'age__range': [ 24, 29 ] });
age_range.length; // => 291

var gte24_or_lte29 = RockStars.filter({ 'age__gte': 24 }, { 'age__lte': 29 });
gte24_or_lte29.length; // => 1291
```

#### Push/Add

```javascript

RockStars.push({
    "id": "2",
    "name": "Janis",
    "surname": "Joplin"
});
```

#### Set

```javascript
RockStars.filter({
    "name": "Janis"
}, {
    "name": "Hendrix"
}).set({
    "decades_active": [ 1960, 1970 ]
});
```

# Get

```javascript
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
rockStar.name; // => Jimmy Hendrix
rockStar.decates_active; // => [ 1960, 1970 ]

// Set
rockStar.bands = {
    '01': {
        'name': 'The Jimmy Hendrix Experience'
    }    
};

// Merge/Extend
rockstar.extend('bands', {
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

The view handles the structure first and the behaviour second.

The structure is the HTML and is defined by the ```template``` property. The ```area`` and ```attributes``` properties handle and interact with the scemantics of that HTML.

The view is primarily a listener on changes from other objects in order to update its ```area```s and ```attributes```. The view is also responsible for triggering changes to either its own properties or the properties of other objects. These triggers occur from DOM event callbacks or custom methods.

For example, when the model updates change the value of this input and vice versa.

We need things like

* PubSub/Events -
* Two-way data binding - 
* Class name data bindings -
* Support for sub-views/child views -

## Two-way data binding

Associate DOM elements with some data. When the data changes, update the DOM element to reflect the new data. When the DOM element changes, update the data to reflect the changes.

```javascript
// The flexible way.
var rockStar = new Voodo.View({
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

rockStar.bind(this.model, 'html');
rockStar.view('.rockstar-name').bind(this.model.attribute('name'));

var rockStar = new Voodo.View({
    'initialize': function(attrs, opts) {
        this.binding(this.model, 'name', '.rockstar-name');
        this.binding(this.model, 'dod', '.rockstar-dod',
            function(el, change) {
                el.pulsate(2); // pulsate element twice
            });
        return this;
    }
});

// Or the long way around:
var rockStar = new Voodo.View({
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

## Class name data bindings

```javascript
var RockStar = new Voodo.View({
    'el': $('#rockstar-0'),
    'classNameBindings': {
        'name': 'has-name:no-name',
        'state': 'at-state-{{ state }}'
    }
});
```

# Controller
The controllers are the "glue" - they bring the data and the UI together at the right place and at the right time.

They are things like:

* Routes - easy URL routing that works (pushState and hash based).
* Global PubSub/Events - for event-based applications.
