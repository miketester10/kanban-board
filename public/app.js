'use strict';

const BASE_URL = 'http://127.0.0.1:8080';

/*** Gestione pagina ***/
let addBtn = document.querySelector('.add-btn:not(.solid)');
let saveItemBtn = document.querySelector('.solid');
let closeBtn = document.querySelector('#close-btn');
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
    await addTaskToDB();

});

async function addTaskToDB() {
    try {
        let response = await fetch(`${BASE_URL}/api/v1/tasks/task`, { // aggiungo la singola task dell'utente autenticato nel DB
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

async function updateTaskToDB() {
    try {
        let id = parseInt(dragTask.getAttribute('data-id'));
        let response = await fetch(`${BASE_URL}/api/v1/tasks/task`, { // aggiorno la singola task dell'utente autenticato nel DB
            method: 'PUT',
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
    logout_text.classList.add('hide');

    let tasks = null;
    let user = null;
    try {
        let response = await fetch(`${BASE_URL}/api/v1/tasks`) // recupero tutte le tasks dell'utente autenticato dal DB
        let data = await response.json();
        tasks = data.tasks;
        user = data.user;
        if (response.ok) { // se sono autenticato
            let nome = user.nome[0].toUpperCase()+user.nome.slice(1).toLowerCase();
            let contenuto_titolo = `${nome}'s Kanban Board`;
            title.textContent = contenuto_titolo; 

            login_text.classList.add('hide');
            iscrizione_text.classList.add('hide');  
            logout_text.classList.remove('hide');
            div_btn_group.classList.remove('no-visible');
        };
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
        handleDragAndDrop();
    };
};

function handleDragAndDrop() {
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
        updateTaskToDB();
    }
    // console.log('drop');
};

/*** Gestione Iscrizione ***/
const modal_iscrizione = document.getElementById('modalIscrizione');
const iscrizione_text = document.getElementById('iscrizioneText');
const iscrizione_form = document.getElementById('formIscrizione');  
const input_nome_iscrizione = document.getElementById('nomeIscrizione');
const input_cognome_iscrizione = document.getElementById('cognomeIscrizione');
const input_email_iscrizione = document.getElementById('emailIscrizione');
const input_password_iscrizione = document.getElementById('passwordIscrizione');

iscrizione_text.addEventListener('click', function () {
    modal_iscrizione.style.display = 'block';
});

window.addEventListener('click', function (event) { // serve per chiudere la finestra modale quando clicco in qualsiasi punto dello schermo al di fuori della finsetra modale
    if (event.target === modal_iscrizione) {
        // console.log(event.target);
        modal_iscrizione.style.display = 'none';
        input_nome_iscrizione.value = '';
        input_cognome_iscrizione.value = '';
        input_email_iscrizione.value = '';
        input_password_iscrizione.value = '';
    }
});

iscrizione_form.addEventListener('submit', async function (event) {
    event.preventDefault();
    try {
        let nome = input_nome_iscrizione.value;
        let cognome = input_cognome_iscrizione.value;
        let email = input_email_iscrizione.value;
        let password = input_password_iscrizione.value;
        const response = await fetch(`${BASE_URL}/iscrizione`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome: nome, cognome: cognome, email: email, password: password }),
        });
        // console.log(response)
        if (response.ok) {
            modal_iscrizione.style.display = 'none';
            input_nome_iscrizione.value = '';
            input_cognome_iscrizione.value = '';
            input_email_iscrizione.value = '';
            input_password_iscrizione.value = '';
            alert('Iscrizione effettuata con successo!');
        } else {
            // gestisco errori tipi: email già registrata, ecc..
            const errore = await response.json();
            alert(errore.error);
        };
    } catch (error) {
        console.error('Errore durante l\'iscrizione:', error);
    };
});

/*** Gestione Login ***/
const modal_login = document.getElementById('modalLogin');
const login_text = document.getElementById('loginText');
const login_form = document.getElementById('formLogin');  
const input_email_login = document.getElementById('emailLogin');
const input_password_login = document.getElementById('passwordLogin');

login_text.addEventListener('click', function () {
    modal_login.style.display = 'block';
});

window.addEventListener('click', function (event) { // serve per chiudere la finestra modale quando clicco in qualsiasi punto dello schermo al di fuori della finsetra modale
    if (event.target === modal_login) {
        // console.log(event.target);
        modal_login.style.display = 'none';
        input_email_login.value = '';
        input_password_login.value = '';
    }
});

login_form.addEventListener('submit', async function (event) {
    event.preventDefault();
    try {
        let username = input_email_login.value;
        let password = input_password_login.value;
        const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const user = await response.json();
            const nome = user.nome[0].toUpperCase()+user.nome.slice(1).toLowerCase();
            alert(`Login effettuato con successo. Benvenuto ${nome}!`);

            modal_login.style.display = 'none';

            addToColumn();
        } else {
            input_email_login.value = '';
            input_password_login.value = '';

            modal_login.style.display = 'none';

            alert('Email o password errata!');
        };
    } catch (error) {
        console.error('Errore durante il login:', error); 
    }; 
});

/*** Gestione Logout ***/
const logout_text = document.querySelector('#logoutText');

logout_text.addEventListener('click', async function () {
    try {
        const response = await fetch(`${BASE_URL}/logout`, { method: 'DELETE' });
        if (response.ok) {
            alert('Logout effettuato con successo!');
            input_email_login.value = '';
            input_password_login.value = '';
            location.reload();
        }
    } catch (error) {
        console.error('Errore durante il logout:', error);
    }
});

addToColumn();