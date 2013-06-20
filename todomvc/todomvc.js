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
    // Set a title for our todo list. We will need it later.
    'title': 'My todo list',

    // When we get a response from the server only work with the data we need.
    'parse': function(response, status, xhr) {
        return response.items || [];
    },

    // Create a Todo instance out of every item in the array and replace it.
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
    // The result of this.key should be:
    // * a dom element, replace.
    // * a string, and can append, append do it, add listener from model.
    // * a string, and can set value attr do it, add listener to model.
    // * a boolean, and can check|uncheck|select|unselect do it, add listener.
    // * a voodoo instance, go through ghosts and render and append
    // the first view instance (if any).
    // * a store, go through each item, render and append voodoo instances,
    // and add listener to keep in sync.
    // Else hide.
    'areas': {

        // Two-way data-binding.
        // The DOM element ".todo-text" holds the result of
        // this.model.text. If model.text changes the html changes.
        '.todo-text': 'model.text',

        // If the input which edits a todo item changes update model.text.
        '.todo-text-edit': 'model.text',

        // If model.is_done evaluates to true the checkbox is checked.
        // If the checkbox changes model.is_done also changes.
        '.todo-toggle-done': 'model.is_done'
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
        // most recent XHR request. If there was an error use CSS to show it.
        // Eg. add a class of "error-404" if model does not exist.
        'model.status': 'has-error-{{ model.status }}',

        // When editing the item we need to show the text input
        // and hide other things.
        'is_editing': 'is-editing'
    },
    // Events (jQuery).
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
        // The .todos-list element displays the views of all the todo items on
        // our todos collection, a store instance with Todo models.
        // The presence of ":" means that todoView is a property of the items
        // in the collection, not the collection itself.
        // When a new item is added to the collection its todoView gets
        // added to the DOM. When an item is removed its todoView gets removed.
        '.todos-list': 'todos:todoView',
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

        // Render our template and areas and generate our html.
        this.html(this.template());

        // Filter our results initially to "all".
        this.filter('all');

        return this;
    }
});

// Display list of all todo items.
Voodoo.Routes.add('', {
    'enter': function(url) {
        // Create our collection and view, and fetch any existing data.
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

        // Render our view and let the application view handle the rest.
        todos_view.render();
        app_view.views.todos = todos_view;

        // Set the title of our app view to reflect the page we are seeing.
        app_view.setTitle(todos.title);
    },
    'exit': function(url) {
        // Remove reference to our views and destroy them.
        scope.app_view.views.todos = null;
        this.todos_view.todos = null;
        this.todos_view.destroy();

        // For each todo item delete its todo view.
        this.todos.forEach(function(todo) {
            todo.todoView.destroy();
        });

        // Unset the title of our app view.
        app_view.setTitle(todos.title);
    }
});

// Display a single todo item.
Voodoo.Routes.add('/todo/:id', {
    'enter': function(url, id) {
        // Create our model and view and fetch any existing data.
        var todo = this.todo = new Todo({ 'id': id }).fetch(),
            todo_view = this.todo_view = new TodoView({
                // Associate the view with the model.
                'model': todo
            }),
            app_view = scope.app_view;

        // Render our view and let the application view handle the rest.
        todo_view.render();
        app_view.views.todo = todo_view;

        // Set the title of our app view to reflect the item we are seeing.
        app_view.setTitle(todo.text);

        // Just for laughs, we want all the todos to be visible behind the
        // todo item view. So we render all views and use CSS to stack them.
        // Notice that we do this after our main view has loaded.
        Voodoo.Routes.run('');
    },
    'exit': function(url,id) {
        // Remove reference to our views and destroy them.
        this.todo_view.model = null;
        scope.app_view.views.todo = null;
        this.todo_view.destroy();
        this.todo.destroy();

        // Update the app view title.
        app_view.setTitle('');
    }
});

// Handle the about us page.
Voodoo.Routers.add('/about', {
    'enter': function(url) {
        scope.app_view.area('#about-us .about-us').enable();
    },
    'exit, drill': function(url) {
        scope.app_view.area('#about-us .about-us').disable();
    }
});

// Handle the contact us page.
// This is a different way to do it, by using an existing DOM element.
Voodoo.Routers.add('/about/contact', {
    'enter': function(url) {
        scope.app_view.text.contact = $('#contact-us');
    },
    'exit': function(url) {
        scope.app_view.text.contact = null;
    }
});

// Initialize our routes and create our global, application view.
Voodoo.Routes.initialize(function() {
    scope.app = new Voodoo.Model({
        'title': 'My Todos';
    });

    scope.app_view = new Voodo.View({
        'el': 'html',
        'areas': {
            'title': 'page.title',
            '#todo': 'views.todo',
            '#todos': 'views.todos',
            '#about-us .about-us': 'text.about',
            '#about-us .contact-us': 'text.contact'
        },
        'text': {
            'about': '<p>About us!</p>'
        },
        'views': {},
        'page': {
            'title': scope.app.title
        },
        'app': scope.app,
        'setTitle': function(text){
            this.page.title = app.title + (text ? '.:.' + text : '');

            return this;
        }
    });
});
