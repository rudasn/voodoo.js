var scope = new Voodoo();

// The model for a single todo item.
var Todo = Voodoo.Model.create({
    'defaults': {
        'text': 'Untitled',
        'is_done': false,
        'is_active': true
    }
});

// A collection of todo item models.
var Todos = Voodo.Store.create({
    'model': Todo, // link this collection with the Todo model
    'parse': function(response, status, xhr) {
        return response.items || [];
    }
});

// The view for a single todo item.
var TodoView = Voodo.View.create({
    // We are using a template to construct the HTML.
    'template': '#todo-template',
    'areas': {
        // One-way data-binding.
        '.todo-text': 'model.text',
        // Two-way data-binding.
        // If the value  changes the checkbox changes. If the
        // checkbox changes the value changes.
        '.todo-toggle-done': 'model.is_done',
    },
    'classNameBindings': {
        // Add/Remove class names depending on some properties.
        'model.is_done': 'is-done:is-not-done',
        'model.is_active': ':hidden'
    },
    'events': {
        // Basic jQuery events.
        'click .todo-delete': function(e, $target) {
            this.set('is_active', !this.get('is_active'));
        }
    }
});

var TodosView = Voodo.View.create({
    'template': '#todos-template',
    'areas': {
        '.todos-list': {
            // Bind a callback to the
            'collection': function(el, collection) {
                collection.forEach(function(item) {
                    var view = new TodoView({
                        'delegateEventsTo': this
                    });
                    view.set('model', item);
                    el.append(item.view.render());
                });
                return el;
            }
        },
        '.todos-list-count-number': 'active.length'
    },
    'classNameBindings': {
        'filter_by': 'filter-by-{{ filter_by }}'
    },
    'events': {
        'click .todos-list-filter': function(e, $target) {
            var type = $target.attr('data-filterType');
            this.filter(change.to);
        }
    },
    'filter': function(type) { // type: 'done'|'all'|'active'
        if (type !== 'done' && type !== 'active') {
            type = 'all';
        }
        // We are only changing a property on the view here.
        // The className binding on filter_by property will change
        // the class name of this view to include the type.
        // CSS then takes care of which items will be visible and which not.
        this.set('filter_by', type);
        return this;
    },
    'render': function() {
        var collection = this.get('collection'),
            active_items = this.get('collection').filter({
            'is_done': false
        });
        // "Live" collections.
        // When the collection changes (ie, one of its models changes
        // it's is_done property) the collection removes that item
        // and triggers a change event on 'this.active'.
        this.set('active', active_items);
        this.html(this.template()); // does areas as well
        this.filter();
        return this;
    }
});

Voodoo.Routes.add('/todo/:id', {
    'enter': function(url, id) {
        this.todo = new Todo(url + '.json');
        this.todo = new TodoView();
        this.todo_view.set('model', this.todo);
        scope.app_view.set('views.todo', this.todo_view);
        this.todo_view.render();
    },
    'exit': function(url,id) {
        this.todo_view.unset('model', this.todo);
        scope.app_view.unset('views.todo', this.todo_view);
        this.todo_view.destroy();
        this.todo.destroy();
    }
});

Voodoo.Routes.add('/', {
    'enter': function(url) {
        this.todos = new Todos(url + '.json');
        this.todos_view = new TodosView();
        this.todos_view.set('collection', this.todos);
        scope.app_view.set('views.todos', this.todos_view);
        this.todos_view.render();
    },
    'exit': function(url) {
        this.todos_view.unset('collection', this.todos);
        scope.app_view.unset('views.todos', this.todos_view);
        this.todos_view.destroy();
    }
});

Voodoo.Routers.add('/about/', {
    'enter': function(url) {
        scope.app_view.set('text.about', '<p>About us!</p>');
    },
    'exit': function(url) {
        scope.app_view.unset('text.about');
    }
});

Voodoo.Routers.add('/about/contact', {
    'enter': function(url) {
        scope.app_view.set('text.contact', $('#contact-us'));
    },
    'exit': function(url) {
        scope.app_view.unset('text.contact');
    }
});

Voodoo.Routes.initialize(function() {
   scope.app_view = new Voodo.View({
        'el': '#wrapper',
        'areas': {
            '#todo': 'views.todo',
            '#todos': 'views.todos',
            '#about-us': 'text.about',
            '#contact-us': 'text.contact'
        }
    });
});
