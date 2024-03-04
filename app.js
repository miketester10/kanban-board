'use strict';

let addBtn = document.querySelector('.add-btn:not(.solid)');
let saveItemBtn = document.querySelector('.solid');
let closeBtn = document.querySelector('#close');
let addItemContainer = document.querySelector('.add-container');
let addInput = document.querySelector('.add-input');
let addItem = document.querySelector('.add-item');
let task;
let ul_todo = document.querySelector('#to-do-content > ul');
let ul_doing = document.querySelector('#doing-content > ul');
let ul_done = document.querySelector('#done-content > ul');
let tasks = document.querySelectorAll('.drag-item');
let columns = document.querySelectorAll('.drag-column');
let dragTask = null;
let currentColumn = null;


addBtn.addEventListener('click', (event) => {
    event.preventDefault();
    addBtn.classList.add('no-visible');
    addBtn.style.visibility = "hidden";
    closeBtn.classList.remove('no-visible');
    closeBtn.style.visibility = "visible";
	saveItemBtn.style.display = "flex";
	addItemContainer.style.display = "flex";   
})

closeBtn.addEventListener('click', (event) => {
    event.preventDefault();
    addBtn.classList.remove('no-visible');
    addBtn.style.visibility = "visible";
    closeBtn.classList.add('no-visible');
    closeBtn.style.visibility = "hidden";
    saveItemBtn.style.display = "none";
    addItemContainer.style.display = "none";
    addItem.textContent = "";
})

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
            body: JSON.stringify({ colonna: 'to-do-column', descrizioneTask: task })
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
            body: JSON.stringify({ id: id, colonna: currentColumn })
        });
        let data = await response.json();
        if (data.success == true) {
            console.log('Task aggiornato nel DB');
        };
    } catch (error) {
        console.error('Errore:', error);
    };
};

async function addToColumn() {
    ul_todo.innerHTML = ""; // ogni volta pulisco/inizalizzo subito l'elenco prima di crearlo/ri-crearlo
    ul_doing.innerHTML = ""; // ogni volta pulisco/inizalizzo subito l'elenco prima di crearlo/ri-crearlo
    ul_done.innerHTML = ""; // ogni volta pulisco/inizalizzo subito l'elenco prima di crearlo/ri-crearlo
    // removeEvents();
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
        li_todo.setAttribute('data-id', task.id);
        li_todo.draggable = true;
        // Append
        if (task.colonna == 'to-do-column') {
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
addToColumn();

// // rimuovi eventi drag&drop esistenti prima di aggiungere i nuovi
// function removeEvents() {
//     console.log(tasks);
//     tasks.forEach(task => {
//         task.removeEventListener('dragstart', dragStart);
//         task.removeEventListener('dragend', dragEnd);
//     });

//     columns.forEach(column => {
//         column.removeEventListener('dragover', dragOver);
//         column.removeEventListener('dragenter', dragEnter);
//         column.removeEventListener('dragleave', dragLeave);
//         column.removeEventListener('drop', dragDrop);
//     });
//     console.log('eventi rimossi');
// };

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
    // console.log('start');
};

function dragEnd() {
    this.classList.remove('dragging-color');
    this.classList.remove('hide');
    dragTask = null;
    currentColumn = null;
};

function dragOver(e) {
    e.preventDefault();
    // console.log('over');   
};

function dragEnter() {
    let classe = this.attributes[0].textContent.split(' ')[1];
    let content_corrente = document.querySelector(`.${classe} > div`);
    content_corrente.classList.add('over');
    // console.log('enter');
};

function dragLeave() {
    // let classe = this.className.split(' ')[1];
    // console.log(document.querySelector(`.${classe} > div`));
    
};

async function dragDrop() {
    // console.log('drop');
    let classe = this.attributes[0].textContent.split(' ')[1];
    let ul_corrente = document.querySelector(`.${classe} ul`);
    ul_corrente.appendChild(dragTask);

    let divs_content = document.querySelectorAll('#to-do-content, #doing-content, #done-content');
    divs_content.forEach(div => div.classList.remove('over'));
    currentColumn = this.className.split(' ')[1]
    // console.log(currentColumn);
    await aggiorna_tasks_nel_db();     
};