var scope = new Voodoo();

// The model for a single todo item.
var Todo = Voodoo.Model.create({
    'defaults': {
        'text': 'Untitled',
        'is_done': false,
        'is_deleted': false
    }
});

// A collection of todo item models.
var Todos = Voodo.Store.create({
    'parse': function(response, status, xhr) {
        return response.items || [];
    },
    'parseItem': function(item){
        return new Todo(item);
    }
});

// The view for a single todo item.
var TodoView = Voodo.View.create({
    // We are using a template to construct the HTML.
    'template': '#todo-template',
    // Get the result of this.key.
    // It should evaluate to a DOM element or empty string.
    // If a dom element, replace.
    // If a string, and can append, append do it.
    // If a string, and can set value attr do it.
    // If a boolean, and can check|uncheck|select|unselect do it.
    // If a voodoo instance, go through ghosts and render and return
    // the first view instance (if any).
    // If a store, go through each item and parse that.
    // Else hide.
    'areas': {
        // Two-way data-binding.
        // The DOM element ".todo-text" holds the result of
        // this.model.text. If model.text changes the html changes.
        '.todo-text': 'model.text',
        // We want an input to be able to update model.text.
        '.todo-text-edit': 'model.text',
        // If model.is_done evaluates to true the checkbox is checked.
        // If the checkbox changes model.is_done also changes.
        '.todo-toggle-done': 'model.is_done',
    },
    'classNameBindings': {
        // Done items are displayed differently than active items.
        // We also need to distinguish the two when filtering by status.
        'model.is_done': 'is-done:is-active',
        // Deleted items are not displayed.
        'model.is_deleted': 'hidden',
        // When editing the item we need to show the text input
        // and hide other things.
        'is_editing': 'is-editing'
    },
    'events': {
        // Delete.
        'click .todo-delete': function(e, $target) {
            this.model.is_deleted = !this.model.is_deleted;
        },
        // Edit (on).
        'dblclick .todo-text': function(e, $target) {
            this.is_editing = true;
        },
        // Edit (off).
        'blur .todo-text-edit': function(e, $target) {
            this.is_editing = false;
        }
    }
});

var TodosView = Voodo.View.create({
    'template': '#todos-template',
    'areas': {
        // The .todos-list element holds all the todo items on our collection,
        // a store instance.
        // When a new item is added in the collection it gets added to the
        // DOM. When an item is removed it gets removed from the DOM.
        '.todos-list': 'collection',
        '.todos-list-count-number': 'collection_active.length'
    },
    'classNameBindings': {
        // Our filter_by property is added as a class on the view element
        // so that we can show/hide elements depending on their state
        // (done|active|all).
        // So that, .filter-by-done .is-active,
        //          .filter-by-active .is-done { display: none; }
        'filter_by': 'filter-by-{{ filter_by }}'
    },
    'events': {
        'click .todos-list-filter': function(e, $target) {
            var type = $target.attr('data-filterType');
            this.filter(change.to);
        }
    },
    // Filter our todos based on their status.
    // We are only changing a property on the view here.
    // The className binding on filter_by property will change
    // the class name of this view to include the type.
    // CSS then takes care of which items will be visible and which not.
    'filter': function(type) { // type: 'done'|'all'|'active'
        if (type !== 'done' && type !== 'active') {
            type = 'all';
        }
        this.filter_by = type;
        return this;
    },
    'render': function() {
        var collection = this.collection,
            active_items = collection.filter({
            'is_done': false
        }).live();
        // "Live" collections.
        // Adds listeners to property changes of the parent collection
        // (in this case is_done) and if the property changes it either
        // adds or removes changed item from the returned collection
        // and triggers a change event from it.
        this.collection_active = active_items;
        this.html(this.template()); // does areas as well
        this.filter();
        return this;
    }
});

Voodoo.Routes.add('/', {
    'enter': function(url) {
        var todos, todos_view;
        todos = this.todos = new Todos(url + '.json');
        todos_view = this.todos_view = new TodosView();
        // For each item create another instance.
        // a shortcut to on:initialize listener.
        todos.ghost(TodoView, function(item, constr, collection) {
            return new constr(item, {
                'delegateEventsTo': todos_view
            });
        });
        todos_view.collection = todos;
        todos_view.render();
        scope.app_view.views.todos = todos_view;
    },
    'exit': function(url) {
        scope.app_view.views.todos = null;
        this.todos_view.collection = null;
        this.todos_view.destroy();
    }
});

Voodoo.Routes.add('/todo/:id', {
    'enter': function(url, id) {
        this.todo = new Todo(url + '.json');
        this.todo = new TodoView();
        this.todo_view.model = this.todo;
        this.todo_view.render();
        scope.app_view.views.todo = this.todo_view;
    },
    'exit': function(url,id) {
        this.todo_view.model = null;
        scope.app_view.views.todo = null;
        this.todo_view.destroy();
        this.todo.destroy();
    }
});

Voodoo.Routers.add('/about/', {
    'enter': function(url) {
        scope.app_view.area('#about-us .about-us').show();
    },
    'exit, drill': function(url) {
        scope.app_view.area('#about-us .about-us').hide();
    }
});

Voodoo.Routers.add('/about/contact', {
    'enter': function(url) {
        scope.app_view.text.contact = $('#contact-us');
    },
    'exit': function(url) {
        scope.app_view.text.contact = null;
    }
});

Voodoo.Routes.initialize(function() {
   scope.app_view = new Voodo.View({
        'el': '#wrapper',
        'areas': {
            '#todo': 'views.todo',
            '#todos': 'views.todos',
            '#about-us .about-us': 'text.about',
            '#about-us .contact-us': 'text.contact'
        },
        'text': {
            'about': '<p>About us!</p>'
        },
        'views': {}
    });
});

// A list of models
// create a view for each one of them
// and sort & display each view
// on a particular DOM element.
// When list changes, the DOM changes.
