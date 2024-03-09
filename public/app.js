'use strict';

/*** Gestione pagina ***/
let addBtn = document.querySelector('.add-btn:not(.solid)');
let saveItemBtn = document.querySelector('.solid');
let closeBtn = document.querySelector('#close');
let addItemContainer = document.querySelector('.add-container');
let addInput = document.querySelector('.add-input');
let addItem = document.querySelector('.add-item');
let ul_todo = document.querySelector('#todo-content > ul');
let ul_doing = document.querySelector('#doing-content > ul');
let ul_done = document.querySelector('#done-content > ul');
let tasks = document.querySelectorAll('.drag-item');
let columns = document.querySelectorAll('.drag-column');
let title = document.querySelector('.main-title');
let div_btn_group = document.querySelector('.add-btn-group');
let task = null;
let dragTask = null;
let dropColumn = null;

addBtn.addEventListener('click', (event) => {
    event.preventDefault();
    addBtn.classList.add('no-visible');
    addBtn.style.visibility = "hidden";
    closeBtn.classList.remove('no-visible');
    closeBtn.style.visibility = "visible";
	saveItemBtn.style.display = "flex";
	addItemContainer.style.display = "flex";   
});

closeBtn.addEventListener('click', (event) => {
    event.preventDefault();
    addBtn.classList.remove('no-visible');
    addBtn.style.visibility = "visible";
    closeBtn.classList.add('no-visible');
    closeBtn.style.visibility = "hidden";
    saveItemBtn.style.display = "none";
    addItemContainer.style.display = "none";
    addItem.textContent = "";
});

saveItemBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    addBtn.classList.remove('no-visible');
    addBtn.style.visibility = "visible";
    closeBtn.classList.add('no-visible');
    closeBtn.style.visibility = "hidden";
    saveItemBtn.style.display = "none";
    addItemContainer.style.display = "none";
    task = addItem.textContent.trim();
    if (task == "") {
        return;
    }
    addItem.textContent = "";
    await inserisci_task_nel_db();

});

async function inserisci_task_nel_db() {
    try {
        let response = await fetch('http://127.0.0.1:8080/inserisci_task/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ colonna: 'todo-column', descrizioneTask: task })
        });
        let data = await response.json();
        if (data.success == true) {
            console.log('Task inserito nel DB');
            addToColumn();
        };
    }
    catch (error) {
        console.error('Errore:', error);
    };
};

async function aggiorna_tasks_nel_db() {
    try {
        let id = parseInt(dragTask.getAttribute('data-id'));
        let response = await fetch('http://127.0.0.1:8080/aggiorna_task/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_task: id, colonna: dropColumn })
        });
        let data = await response.json();
        if (data.success == true) {
            // console.log('Task aggiornato nel DB');
        };
    } catch (error) {
        console.error('Errore:', error);
    };
};

async function addToColumn() {
    ul_todo.innerHTML = ""; // ogni volta pulisco/inizalizzo subito l'elenco prima di crearlo/ri-crearlo
    ul_doing.innerHTML = ""; // ogni volta pulisco/inizalizzo subito l'elenco prima di crearlo/ri-crearlo
    ul_done.innerHTML = ""; // ogni volta pulisco/inizalizzo subito l'elenco prima di crearlo/ri-crearlo

    try {
        let response = await fetch('http://127.0.0.1:8080/recupera_tasks/')
        let data = await response.json();
        tasks = data.tasks;
    } catch (error) {
        console.error('Errore:', error);
    }

    if (tasks.length == 0) {
        console.log('Nessun task salvato nel DB');
        // console.log(tasks); 
    } else {
    tasks.forEach(task => {
        let li_todo = document.createElement('li');
        li_todo.textContent = task.descrizioneTask;
        li_todo.classList.add("drag-item");
        li_todo.setAttribute('data-id', task.id_task);
        li_todo.draggable = true;
        // Append
        if (task.colonna == 'todo-column') {
            ul_todo.appendChild(li_todo);
        } else if (task.colonna == 'doing-column') {
            ul_doing.appendChild(li_todo);
        } else if (task.colonna == 'done-column') {
            ul_done.appendChild(li_todo);
        };     
    });
        updateTasks();
    };
};

function updateTasks() {
    tasks = document.querySelectorAll('.drag-item');
    tasks.forEach(task => {
        task.addEventListener('dragstart', dragStart);
        task.addEventListener('dragend', dragEnd);
    });
    
    columns.forEach(column => {
        column.addEventListener('dragover', dragOver);
        column.addEventListener('dragenter', dragEnter);
        column.addEventListener('dragleave', dragLeave);
        column.addEventListener('drop', dragDrop);    
    });
};

function dragStart() {
    this.classList.add('dragging-color');
    setTimeout(() => this.classList.add('hide'), 10);

    dragTask = this;
    let currentColumn = this.offsetParent.attributes[0].textContent.split(' ')[1];
    this.setAttribute('data-current-column', currentColumn);
    // console.log('start');
};

function dragEnd() {
    this.classList.remove('dragging-color');
    this.classList.remove('hide');
    task = null;
    dragTask = null;
    dropColumn = null;
    // console.log('end');
};

function dragOver(e) {
    e.preventDefault();
    // console.log('over');   
};

function dragEnter() { 
    let classe = this.attributes[0].textContent.split(' ')[1];
    let content_corrente = document.querySelector(`.${classe} > div`);
    content_corrente.classList.add('over');

    dropColumn = this.className.split(' ')[1];
    let currentColumn = dragTask.getAttribute('data-current-column');
    
    if (dropColumn != currentColumn) {
        let divs_content = document.querySelectorAll('#todo-content, #doing-content, #done-content');
        let div_dropColumn = document.querySelector(`#${dropColumn.split('-')[0]}-content`);

        divs_content.forEach(div => div.classList.remove('over'));
        div_dropColumn.classList.add('over');
    } else {
        let divs_content = document.querySelectorAll('#todo-content, #doing-content, #done-content');
        let div_currentColumn = document.querySelector(`#${currentColumn.split('-')[0]}-content`);
        
        divs_content.forEach(div => div.classList.remove('over'));
        div_currentColumn.classList.add('over');
    };
    // console.log('enter');
};

function dragLeave() {
    // console.log('leave');   
};

function dragDrop() {
    let classe = this.attributes[0].textContent.split(' ')[1];
    let ul_corrente = document.querySelector(`.${classe} ul`);
    ul_corrente.appendChild(dragTask);

    let divs_content = document.querySelectorAll('#todo-content, #doing-content, #done-content');
    divs_content.forEach(div => div.classList.remove('over'));

    dropColumn = this.className.split(' ')[1];
    let currentColumn = dragTask.getAttribute('data-current-column');
    dragTask.removeAttribute('data-current-column');
    // console.log(currentColumn);
    // console.log(dropColumn);
    if (dropColumn != currentColumn) {
        aggiorna_tasks_nel_db();
    }
    // console.log('drop');
};

/*** Gestione Login ***/
const modal = document.getElementById('modal');
const login_text = document.getElementById('loginText');
const logout_text = document.querySelector('#logoutText'); 
const closeButton = document.getElementById('close');
const loginForm = document.getElementById('loginForm');  
const input_email = document.getElementById('email');
const input_password = document.getElementById('password');

login_text.addEventListener('click', function () {
    modal.style.display = 'block';
});

closeButton.addEventListener('click', function () {
    modal.style.display = 'none';
});

window.addEventListener('click', function (event) {
    if (event.target === modal) {
    modal.style.display = 'none';
    }
});

loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    try {
        let username = input_email.value;
        let password = input_password.value;
        const response = await fetch('http://127.0.0.1:8080/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        });
        // console.log(response)
        if (response.ok) {
            // console.log(user)
            const user = await response.json();
            const nome = user.nome[0].toUpperCase()+user.nome.slice(1);
            
            modal.style.display = 'none';

            alert(`Login effettuato con successo. Benvenuto ${nome}!`);
            controllo_autenticazione();
        } else {
            input_email.value = '';
            input_password.value = '';

            modal.style.display = 'none';

            alert('Email o password errata!');
        };
    } catch (error) {
        console.error('Errore durante il login:', error); 
    }; 
});

/*** Gestione Logout ***/
logout_text.addEventListener('click', async function () {
    try {
        const response = await fetch('http://127.0.0.1:8080/logout', {
        method: 'POST',
        });
        if (response.ok) {
            alert('Logout effettuato con successo!');
            input_email.value = '';
            input_password.value = '';
            location.reload();
        }
    } catch (error) {
        console.error('Errore durante il logout:', error);
    }
})

/*** Controllo la sessione attuale (quindi se sono autenticato, se sono ancora autenticato o se non lo sono proprio) ***/
async function controllo_autenticazione() {
    try {
        const response = await fetch('http://127.0.0.1:8080/controllo_autenticazione')
        if (response.ok) {
            const user = await response.json();
            const nome = user.nome[0].toUpperCase()+user.nome.slice(1);
            const contenuto_titolo = `${nome}'s ${title.textContent}`; 
            title.textContent = contenuto_titolo; 

            login_text.classList.add('hide');  
            logout_text.classList.remove('hide');
            div_btn_group.classList.remove('no-visible');
            addToColumn();
            console.log('Sei autenticato');
        } else {
            logout_text.classList.add('hide');
            console.log('Non sei autenticato');
        }

    } catch (error) {
        console.error('Errore:', error);
    }
};
controllo_autenticazione();
  