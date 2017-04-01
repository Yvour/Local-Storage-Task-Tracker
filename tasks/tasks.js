




function TaskApp(id, storagename) {
    "use strict";
    var self = this;
    self.storagename = storagename;
    self.appElement = document.getElementById(id);
    self.appElement.classList.add("task-app-container");
    self.appElement.setAttribute("data-storagename", storagename);
    self.appElement.innerHTML = '<table><tbody><tr><td><div class = "task-app-edit-form" hidden = true></div></td></tr></tbody></table>'
    self.appElement.innerHTML += '<table><tbody><tr><td class = "task-app-panel"></td></tr><tr><td  class = "task-app-grid"></td></tr></tbody></table>';

    for (var key in self.__proto__) {
        if (self.__proto__.hasOwnProperty(key))
            if ("function" === typeof self.__proto__[key])
                self[key] = self.__proto__[key].bind(self);
    }



    self.appElement.onclick = self.processClick;

    Object.defineProperty(self, "appState", {configurable: true, enumerable: true, get: this.getTaskAppState, set: this.setTaskAppState});

    if (self.appElement) {
        self.renderApp();
    }
}



TaskApp.prototype.getId = function ()
{
    "use strict";

    function generateId() {
        return (Math.random() * 1000000000 + (new Date).valueOf).toString(36).substr(2, 9)
    }
    ;

    var id = generateId();
    if (this.appState)
        if (this.appState.elems)
            while (this.appState.elems.filter(function (x) {
                x.id == id
            }) > 0) {
                id = generateId();
            }
    return id;
};

TaskApp.prototype.getTaskAppState = function ()
{
    "use strict";
    var state = JSON.parse(window.localStorage.getItem(this.storagename)) ||
            {data: {},
                elems: [], deleted: []
            };
// always to be returned sorted
    state.elems = state.elems.sort(function (a, b) {
        if (a.title < b.title)
            return 1;
        if (a.title === b.title)
            return 0
        return -1;
    }
    )
    return state;
}

TaskApp.prototype.setTaskAppState = function (appState) {
    "use strict";
    window.localStorage.setItem(this.storagename, JSON.stringify(appState));
}


TaskApp.prototype.getMarkedTask = function () {
    return this.appState.elems.filter(function (x) {
        return x.marked;
    })[0];
}


TaskApp.prototype.processClick = function (e) {
    "use strict";

    function getParentByClassName(elem, className) {
        var app = elem;
        while ((app != window.document) && (!app.classList.contains(className))) {
            app = app.parentNode;
        }
        if (!app.classList.contains(className)) {

            return;
        }
        return app;
    }

    var elem = e.target;


    if (elem.classList.contains('task-app-clickable')) {
        var app = getParentByClassName(elem, "task-app-container");
        var self = this;
        if (!app)
            return;

        var buttonType = elem.getAttribute('data-clickable-type');

        switch (buttonType) {
            case 'add':

                app.querySelector('.task-app-edit-form').hidden = false;
                app.querySelector('.task-app-edit-form').querySelector('.task-app-edit-form-title-input').value = '';
                break;
            case 'edit':
                if (!self.getMarkedTask())
                    return;
                app.querySelector('.task-app-edit-form').querySelector('.task-app-edit-form-title-input').value = self.getMarkedTask().title;
                app.querySelector('.task-app-edit-form').hidden = false;
                app.querySelector('.task-app-edit-form').setAttribute('data-task-id', self.getMarkedTask().id);
                break;
            case 'grid-cell':
                var id = elem.getAttribute("data-task-id");
                var state = self.getTaskAppState();

                var unmarked = state.elems.filter(function (x) {
                    return x.marked
                });
                //state.elems.map()
                var appState = state.elems.map(function (x) {

                    x.marked = (x.id === id) ? true : false;
                    return x;
                });

                state.elems = appState;
                self.setTaskAppState(state);
                self.renderGrid();
                break;
            case 'ok':
                var form = getParentByClassName(elem, 'task-app-edit-form');
                if (!form)
                    return;
                var title = form.querySelector('.task-app-edit-form-title-input').value;
                var id = form.getAttribute("data-task-id");
                form.removeAttribute("data-task-id");
                var state = self.appState;
                if (id) { //edit
                    state.elems.map(function (x) {
                        if (x.id == id)
                            x.title = title;
                        return x
                    })
                } else
                {
                    id = self.getId();
                    state.elems.push(({id: id, title: title, completed: false, marked: false}))
                }
                self.appState = state;
                self.renderGrid();
                app.querySelector('.task-app-edit-form').hidden = true;
                break;
            case 'cancel':
                var form = getParentByClassName(elem, 'task-app-edit-form');
                form.hidden = false;
                form.removeAttribute('data-task-id');
                
                break;
            case 'delete':
                if (!self.getMarkedTask())
                    return;
                var state = self.appState;
                state.deleted.push(self.getMarkedTask());
                state.elems = state.elems.filter(function (x) {
                    return (x.id !== self.getMarkedTask().id)
                });
                self.appState = state;
                self.renderGrid();
                break;
            case 'complete':
                if (!self.getMarkedTask())
                    return;
                var state = self.appState;
                state.elems = state.elems.map(function (x) {
                    x.completed = (x.id == self.getMarkedTask().id) ? true : x.completed;
                    return x;
                });
                self.appState = state;
                self.renderGrid();
                break;
            default:
                var state = self.appStage;
                state.elems = state.elems.map(function (x) {
                    x.marked = false;
                    return x
                });
                self.appState = state;
                self.renderGrid();


        }

    }

}

TaskApp.prototype.renderPanel = function () {
    "use strict";
    var buttons = [
        {code: "add", label: "Add"},
        {code: "edit", label: "Edit"},
        {code: "complete", label: "Complete"},
        {code: "delete", label: "Delete"}
    ];
    this.appElement.querySelector(".task-app-panel").innerHTML = "<table><tbody><tr>" +
            buttons.reduce(function (r, x, i) {
                return r + '<td data-clickable-type = "' + x.code + '" class = "task-app-clickable button ' + x.code + '">' + x.label + "</td>";
            }, '') + "</tr></tbody></table>";

}

TaskApp.prototype.renderGrid = function () {
    "use strict";
    var state = this.getTaskAppState();

    this.appElement.querySelector(".task-app-grid").innerHTML =
            '<table><thead><tr><td>Title</td><td>Completed</td></tr></thead><tbody>' + state.elems.reduce(function (r, x, i) {
                var attrs = "data-clickable-type = \"grid-cell\"  data-task-id = " + x.id + " class = \"task-app-clickable table-cell " + (x.marked ? "marked" : "") + "\""
                r += "<tr><td data-type-content=\"title\"" + attrs + " >" + x.title + "</td>";
                r += "<td data-type-content=\"completed\"" + attrs + ">" + !!x.completed + "</td></tr>"
                return r;
            }, '') + '</tbody></table>';


}

TaskApp.prototype.renderApp = function () {
    "use strict";
    this.renderPanel();
    this.renderGrid();
    this.renderEditForm();

}

TaskApp.prototype.renderEditForm = function (title) {
    "use strict";
    var s = "<table><tbody><tr><td>Title</td><td>";
    s += "<input class = \"task-app-edit-form-title-input\" type = text></td></tr></tbody></table>";
    s += '<table><tbody><tr><td><div data-clickable-type = "ok" class = "task-app-clickable button ok">OK</div></td><td>'
    s += '<div data-clickable-type = "cancel" class = "task-app-clickable button cancel">Cancel</div></td></tr></tbody></table>';
    this.appElement.querySelector(".task-app-edit-form").innerHTML = s;

}