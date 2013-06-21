// The model for a single todo item with some defaults we always need.
var Todo = Voodoo.Model.create({
    'text': 'Untitled',
    'is_done': false,
    'is_deleted': false
});

// A collection of todo item models.
var Todos = Voodo.Store.create({
    // When we get a response from the server only work with the data we need.
    'parse': function(response, status, xhr) {
        return response.items || [];
    },
    // Originally our store contains plan objects and we want to convert
    // those to Todo model instances.
    'parseItem': function(item){
        return new Todo(item);
    }
});

// The view for a single todo item.
var TodoView = Voodo.View.create({
    // The template we are using to construct the HTML.
    // It can be a selector, a dom element, or a function.
    'template': '#todo-template',

    // Specify areas (or sub-views).
    // The result of the key should be a property that evaluates to:
    // * a dom element: replace specified dom element with the one on property.
    // * a string: if can append, append to dom, add listener from model.
    // * a string: if can set value attr, set it, add listener to model.
    // * a boolean: if can check|uncheck|select|unselect do it, add listener.
    // * a voodoo view instance: render and append.
    // * a voodoo store: if view property specified, render, append and add
    //                   listener to keep in sync.
    // If anything else, hide the dom element.
    'areas': {
        // Two-way data-binding.
        // The DOM element ".todo-text" holds the result of
        // this.model.text. If model.text changes the html changes.
        '.todo-text': 'model.text',

        // If the input which edits a todo item changes update model.text.
        '.todo-text-edit': 'model.text',

        // If model.is_done evaluates to true the checkbox is checked.
        // If the checkbox changes model.is_done also changes.
        '.todo-toggle-done': 'model.is_done',

        // If model.is_deleted evaluates to true the checkbox is checked.
        // If the chechbox changes model.is_deleted also changes.
        '.todo-toggle-delete': 'model.is_deleted'
    },
    // Add class name bindings.
    // When a property of this view changes, add/remove/change a class name.
    'classNameBindings': {
        // Done items are displayed differently than active items.
        // We also need to distinguish the two when filtering by status.
        'model.is_done': 'is-done:is-active',

        // Deleted items are not displayed.
        'model.is_deleted': 'hidden',

        // The status property of model holds details of the model's
        // most recent XHR request. If the request is still active or if there
        // was an error use CSS to show it.
        // Eg. add a class of "at-state-code-[404|503|etc]" or
        // "at-state-[loading|completed|success|error]"
        'model.xhr.state': 'at-state-{{ model.xhr.state }}',
        'model.xhr.code': 'at-state-code-{{ model.xhr.code }}',

        // When editing the item we need to show the text input
        // and hide other things.
        'is_editing': 'is-editing'
        // vd-is-displayed vd-view (always) vd-is-removed
    },
    // Events (jQuery).
    'events': {
        // Edit (on).
        'dblclick .todo-text': function(e, $target) {
            this.is_editing = true;
        },
        // Edit (off).
        'blur .todo-text-edit': function(e, $target) {
            this.is_editing = false;
            this.model.text = $target.val();
        },
        // Edit (off).
        'keyup .todo-text-edit': function(e, $target) {
            if (e.keyCode === 32) {
                $target.blur();
            }
        }
    }
});

// The view that contains all the todos (their views).
var TodosView = Voodo.View.create({
    'template': '#todos-template',
    'areas': {
        // The .todos-list element displays the views of all the todo items on
        // our todos collection, a store instance with Todo models.
        // The presence of ":" means that todoView is a property of the items
        // in the collection, not the collection itself.
        // todoView is a reference to a Todo view instance.
        // When a new item is added to the collection its todoView gets
        // added to the DOM. When an item is removed its todoView gets removed.
        '.todos-list': 'todos:todoView',

        // todos_active holds a live collection with the active items in our
        // store. When an item in our store is marked as done or not done it
        // automagically gets added or removed from the todos_active
        // collection, thereby changing its length.
        // The DOM element '.todos-list-count-number' will always contain
        // the correct length property.
        '.todos-list-count-number': 'todos_active.length'
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
        // Filter our todos (done, active, or all).
        'click .todos-list-filter': function(e, $target) {
            e.preventDefault();
            e.stopPropagation();

            var by = $target.attr('data-filterType');

            // Change the URL to one generated by the route named 'Filter'.
            Voodoo.Routes.set('Filter', {
                'by': by
            });
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
        var todos = this.todos,
            todos_active = todos.filter({
                'is_done': false
            });

        // "Live" collections.
        // Adds listeners to property changes of the parent collection
        // (in this case is_done) and if the property changes it either
        // adds or removes the changed item from the returned collection
        // and triggers a change event from it.
        this.todos_active = todos_active;

        // Render our template, areas and generate our html.
        this.html(this.template());

        // Filter our results initially to "all".
        this.filter('all');

        return this;
    }
});

// A global variable we will be using so as to keep window clean.
window.scope || (window.scope = {});

// Display list of all todo items.
Voodoo.Routes.add('/', 'Home', {
    'enter': function(url) {
        // The user has landed on our homepage.
        // Create our collection and view, and fetch any existing data.
        // Fetch triggers an async GET.
        var todos = this.todos = new Todos().fetch(),
            todos_view = this.todos_view = new TodosView({
                // Associate our todos view with our todos collection.
                'todos': todos
            }),
            app_view = scope.app_view;

        // For each todo item create a view.
        todos.forEach(function(todo) {
            todo.todoView = new TodoView(todo, {
                'delegateEvents': todos_view
            });
        });

        // Associate our todos view with the app view
        // and let it take care of the rest (render & append).
        app_view.views.todos = todos_view;
    },
    'exit': function(url) {
        app_view.views.todos = null;
    }
});

// Filter our todo collection (done, all, active).
Voodoo.Routes.add('/filter/:by', 'Filter', {
    'enter': function(url, by){
        var home_route = Voodoo.Routes.get('Home');

        home_route.todos_view.filter(by);
    },
    'exit': function(url){
        var home_route = Voodoo.Routes.get('Home');

        home_route.todos_view.filter('all');
    }
});

// Initialize our routes and create our global, application view.
Voodoo.initialize(function() {
    scope.app = new Voodoo.Model({
        'title': 'todos';
    });

    scope.app_view = new Voodo.View({
        'el': 'html',
        'areas': {
            // Since title is a text object and we cannot assign listeners to
            // it we use the property method to return a representation of
            // the title property which we can use internally to add listeners
            // to.
            // If we were to just do scope.app.title then the #title dom
            // element would not have one-way binding to that property.
            '#title': scope.app.property('title'),
            '#todo': 'views.todo',
            '#todos': 'views.todos',
        },
        'views': {}
    });
});

