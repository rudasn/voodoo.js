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
var RockStars = new Voodo.Store('/rockstars/');

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

### Inheritance

```javascript
var 60sRockStars = RockStars.create({
    'sayName': function() {
        return this.each(function() {
            console.log('Hi! My name is ' + this.name);
        });
    }
}).filter({
    'decades_active__contains': 1960
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

// Filter
var named_jimmy = RockStars.filter({ 'name': 'Jimmy' });
named_jimmy.length; // => 12
named_jimmy.filter({ 'surname': 'Hendrix' }).length; // => 1

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

```javascript
var RockStar = Voodoo.Model.create({
    'defaults': {
        'name': '',
        'surname': ''
    }
});

var RockStars = Voodo.Store.create({
    'model': RockStar,
    'parse': function(response, status, xhr) {
        return response.items || [];
    }
});

var RockStarView = Voodo.View.create({
    'template': '#rockstar-template',
    'areas': {
        '.rockstar-name': 'model.name',
        '.rockstar-surname': 'model.surname'
    }
});

var RockStarsView = Voodo.View.create({
    'template': '#rockstars-template',
    'areas': {
        '.rockstars-list': {
            'collection': function(el, collection) {
                collection.forEach(function(star) {
                    var view = new RockStarView({
                        'delegateEventsTo': this
                    });
                    view.set('model', star);
                    el.append(view);
                });
                return el;
            }
        }
    }
});

scope = new Voodoo();

Voodoo.Routes.initialize(function() {
   scope.app_view = new Voodo.View({
        'el': '#wrapper',
        'areas': {
            '#rockstar': 'views.rockstar',
            '#about-us': 'text.about',
            '#contact-us': 'text.contact'
        }
    });
});

Voodoo.Routes.add('/rockstar/:id', {
    'enter': function(url, id) {
        this.rockstar = new RockStar(url + '.json');
        this.rockstar_view = new RockStarView();
        this.rockstar_view.set('model', this.rockstar);
        scope.app_view.set('views.rockstar', this.rockstar_view);
        this.rockstar_view.render();
    },
    'exit': function(url,id) {
        this.rockstar_view.unset('model', this.rockstar);
        scope.app_view.unset('views.rockstar', this.rockstar_view);
        this.rockstar_view.destroy();
        this.rockstar.destroy();
    }
});

VoodoRoutes.add('/rockstars/', {
    'enter': function(url) {
        this.rockstars = new RockStars(url + '.json');
        this.rockstars_view = new RockStarsView();
        this.rockstars_view.set('collection', this.rockstars);
        scope.app_view.set('views.rockstars', this.rockstars_view);
        this.rockstars_view.render();
    },
    'exit': function(url) {
        this.rockstars_view.unset('collection', this.rockstars);
        scope.app_view.unset('views.rockstars', this.rockstars_view);
        this.rockstars_view.destroy();
    }
});

Voodo.Routers.add('/about/', {
    'enter': function(url) {
        scope.app_view.set('text.about', '<p>About us!</p>');
    },
    'exit': function(url) {
        scope.app_view.unset('text.about');
    }    
});

Voodo.Routers.add('/about/contact', {
    'enter': function(url) {
        scope.app_view.set('text.contact', $('#contact-us'));
    },
    'exit': function(url) {
        scope.app_view.unset('text.contact');
    }    
});

```

## Todo
```javascript


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
