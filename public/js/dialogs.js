let selectedDate = new Date();
const boardBackgroundCount = 10;

$(document).on('click','input[type="date"]',function(){
    this.showPicker();
});


$(document).on('change','input[type="date"]',function(){
    const input = this.value;
    selectedDate = new Date(input);
});

function CreateModalWindowComponents() {
    const body = $('<div>').addClass('dialog-window modal-dialog');
    const titleBar = $('<div>').addClass('title-bar');
    const footerBar = $('<div>').addClass('footer-bar');
    const createBtn = $('<div>').addClass('create-btn ctrl-e').text('Створити');
    const closeBtn = $('<div>').addClass('close-btn ctrl-e');
    const close = $('<i class="bx bx-x"></i>');
    const content = $('<div>').addClass('dialog-content');

    closeBtn.on('click', function(){
        removeDialog(body);
        body.remove();
    });

    closeBtn.append(close);
    titleBar.append(closeBtn);
    footerBar.append(createBtn);
    body.append(titleBar, content, footerBar);

    return body;
}

function CreateModalWindowForBoard(parent) {
    const window = CreateModalWindowComponents();
    const inputContainer = $('<div>').addClass('input-container').append($('<i>').addClass('bx bxs-window-alt'));
    const nameInput = $('<input>').addClass('name-input').attr('name', 'name').attr('placeholder', 'Назва').val("Нова дошка");

    inputContainer.append(nameInput);
    window.find('.dialog-content').append(inputContainer);
    parent.append(window);

    makeElementMovable(window, window.find('.title-bar'));

    return new Promise((resolve) => {
        window.on('click', '.create-btn', () => {
            const data = { 
                id: generateUniqueId(), 
                name: nameInput.val(),
                lists: [],
                created: new Date(),
                users: [],
                background: 'var(--board-bg' + getRandomInt(boardBackgroundCount - 1) + ')',
                tags: ['#ff3333','#6833ff','#60e830','#e8d530']

            };
            
            try {
                validateBoard(data);
                removeDialog(window);
                resolve(data);
            } catch (error) {
                sendToastMsg(error.message, 'error', true);
            }
        });

        $(document).on('click', '.dialog-window > .title-bar .close-btn', () => {
            resolve(null);
        });
    });
}


function CreateModalWindowForList(parent){
    const window = CreateModalWindowComponents();
    const inputContainer = $('<div>').addClass('input-container').append($('<i>').addClass('bx bxs-window-alt'));
    const nameInput = $('<input>').addClass('name-input').attr('name', 'name').attr('placeholder', 'Назва').val("Новий Список");

    inputContainer.append(nameInput);
    window.find('.dialog-content').append(inputContainer);
    parent.append(window);

    makeElementMovable(window, window.find('.title-bar'));

    return new Promise((resolve) => {
        window.on('click', '.create-btn', () => {
            const data = { 
                id: generateUniqueId(), 
                name: $('input[name="name"]').val(),
                created: new Date(),
                tiles: [],
                background: '',
                color: '',
                removable: true,
            };

            try{
                validateList(data);
                removeDialog(window);
                resolve(data);
            }
            catch(error){
                sendToastMsg(error.message, 'error', true);
            }
        });

        $(document).on('click', '.dialog-window > .title-bar .close-btn', () => {
            resolve(null);
        });
    });
}

function createModalWindowForTile(parent) {
    localStorage.removeItem('selected-users');
    localStorage.removeItem('selected-responsible');

    const window = CreateModalWindowComponents();
    const inputContainer = $('<div>').addClass('input-container').append($('<i>').addClass('bx bxs-window-alt'));
    const nameInput = $('<input>').addClass('name-input').attr('name', 'name').attr('placeholder', 'Назва').val("Нова задача");
    inputContainer.append(nameInput);

    const tagsContainer = $('<div>').addClass('tags-container');
    const tagTitle = $('<div>').addClass('tags-title').text('Мітки');
    const tagsBody = $('<div>').addClass('tags-body');
    const addTagBtn = $('<div>').addClass('add-tag-btn ctrl-e').append($('<i>').addClass('bx bx-plus'));
    tagsBody.append(addTagBtn);
    tagsContainer.append(tagTitle,tagsBody);

    const dateContainer = $('<div>').addClass('input-container top-container').append($('<i>').addClass('bx bx-calendar'));
    const descriptionContainer = $('<div>').addClass('input-container top-container').append($('<i>').addClass('bx bx-align-left'));

    const description = $('<div>').addClass('d-textarea-body').append($('<span>').text('Опис'),$('<textarea>').addClass('description-input').attr('name', 'description').attr('placeholder', 'Додати детальніший опис'));
    const deadlineDate = $('<div>').addClass('d-date-body').append($('<span>').text('Дата дедлайну'),$('<input>').addClass('deadline-input').attr('name', 'deadline').attr('type', 'date').val(new Date().toISOString().split('T')[0]));
    const addEmployeeBtn = $('<div>').addClass('add-employee ctrl-e').html($('<i>').addClass('bx bx-plus')[0]);
    const addResponsibleBtn = $('<div>').addClass('add-employee ctrl-e').html($('<i>').addClass('bx bx-plus')[0]);
    const employesContainer = $('<div>').addClass('e-container');
    const responsibleContainer = $('<div>').addClass('r-container');

    addEmployeeBtn.on('click', () => { addUsers(parent, employesContainer, 1);});
    addResponsibleBtn.on('click', () => { addUsers(parent, responsibleContainer, 2);});

    dateContainer.append(deadlineDate);
    descriptionContainer.append(description);
    employesContainer.append(addEmployeeBtn);
    responsibleContainer.append(addResponsibleBtn);

    window.find('.dialog-content').append(inputContainer, tagsContainer, dateContainer, descriptionContainer, responsibleContainer, employesContainer);
    parent.append(window);

    makeElementMovable(window, window.find('.title-bar'));

    selectedDate = new Date();
    return new Promise((resolve) => {
        window.on('click', '.create-btn', () => {
            const data = {
                id: generateUniqueId(),
                created: new Date(),
                name: $('input[name="name"]').val(),
                date: selectedDate,
                employes: JSON.parse(localStorage['selected-users'] || '[]'),
                responsible: JSON.parse(localStorage['selected-responsible'] || '[]'),
                description: $('textarea[name="description"]').val(),
                tags: getSelectedTags(),
            };
            
            try{
                validateTile(data);
                removeDialog(window);
                resolve(data);
            }
            catch(error){
                sendToastMsg(error.message, 'error', true);
            }
        });

        $(document).on('click', '.dialog-window > .title-bar .close-btn', () => {
            resolve(null);
        });
    });
}

function CreateModalWindowForTileEdit(parent, data) {
    localStorage.removeItem('selected-users');
    localStorage.removeItem('selected-responsible');

    saveLocalStorageArray('selected-users', data.employes);
    saveLocalStorageArray('selected-responsible', data.responsible);

    const window = CreateModalWindowComponents();
    window.find('.create-btn').text('Зберегти');
    parent.append(window);
    makeElementMovable(window, window.find('.title-bar'));

    const inputContainer = $('<div>').addClass('input-container').append($('<i>').addClass('bx bxs-window-alt'));
    const nameInput = $('<input>').addClass('name-input').attr('name', 'name').attr('placeholder', 'Назва').val(data.name);
    inputContainer.append(nameInput);

    const tagsContainer = $('<div>').addClass('tags-container');
    const tagTitle = $('<div>').addClass('tags-title').text('Мітки');
    const tagsBody = $('<div>').addClass('tags-body');
    const addTagBtn = $('<div>').addClass('add-tag-btn ctrl-e').append($('<i>').addClass('bx bx-plus'));
    tagsBody.append(addTagBtn);
    tagsContainer.append(tagTitle,tagsBody);

    const dateContainer = $('<div>').addClass('input-container top-container').append($('<i>').addClass('bx bx-calendar'));
    const descriptionContainer = $('<div>').addClass('input-container top-container').append($('<i>').addClass('bx bx-align-left'));

    const description = $('<div>').addClass('d-textarea-body').append($('<span>').text('Опис'),$('<textarea>').addClass('description-input').attr('name', 'description').attr('placeholder', 'Додати детальніший опис').val(data.description));
    const deadlineDate = $('<div>').addClass('d-date-body').append($('<span>').text('Дата дедлайну'),$('<input>').addClass('deadline-input').attr('name', 'deadline').attr('type', 'date').val(new Date(data.date).toISOString().split('T')[0]));
    const addEmployeeBtn = $('<div>').addClass('add-employee ctrl-e').html($('<i>').addClass('bx bx-plus')[0]);
    const addResponsibleBtn = $('<div>').addClass('add-employee ctrl-e').html($('<i>').addClass('bx bx-plus')[0]);
    const employesContainer = $('<div>').addClass('e-container');
    const responsibleContainer = $('<div>').addClass('r-container');

    addEmployeeBtn.on('click', () => { addUsers(parent, employesContainer, 1);});
    addResponsibleBtn.on('click', () => { addUsers(parent, responsibleContainer, 2);});

    const storage = JSON.parse(localStorage['board']);
    const boardData = getBoardDataFromStorage(storage, localStorage['selected-board']);        
    const users = boardData.users;

    data.tags.slice().reverse().forEach(element => {
        tagsBody.prepend($('<div>').addClass('s-tag-color').css('background', element));
    });

    data.employes.forEach(element => {
        const user = users.find(obj => obj.info.seed === element);
        const listElement = $('<li>').addClass('profile-thumbnail').attr('data-id',user.info.seed);
        listElement.append($('<img>').attr('src',user.results[0].picture.thumbnail));
        employesContainer.prepend(listElement);
    });

    data.responsible.forEach(element => {
        const user = users.find(obj => obj.info.seed === element);
        const listElement = $('<li>').addClass('profile-thumbnail').attr('data-id',user.info.seed);
        listElement.append($('<img>').attr('src',user.results[0].picture.thumbnail));
        responsibleContainer.prepend(listElement);
    });

    employesContainer.append(addEmployeeBtn);
    responsibleContainer.append(addResponsibleBtn);

    dateContainer.append(deadlineDate);
    descriptionContainer.append(description);

    window.find('.dialog-content').append(inputContainer, tagsContainer, dateContainer, descriptionContainer, responsibleContainer, employesContainer);
    selectedDate = new Date();
    const prevDate = data.date;

    return new Promise((resolve) => {
        window.on('click', '.create-btn', () => {
            const data = {
                created: new Date(),
                name: $('input[name="name"]').val(),
                date: selectedDate,
                employes: JSON.parse(localStorage['selected-users'] || '[]'),
                responsible: JSON.parse(localStorage['selected-responsible'] || '[]'),
                description: $('textarea[name="description"]').val(),
                prevDate : prevDate,
                tags: getSelectedTags(),
            };

            try{
                validateTile(data);
                removeDialog(window);
                resolve(data);
            }
            catch(error){
                sendToastMsg(error.message, 'error', true);
            }
        });

        $(document).on('click', '.dialog-window > .title-bar .close-btn', () => {
            resolve(null);
        });
    });
}


async function CreateModalWindowForUsers(parent, view = false){
    let window;
    if(view){
        window = dropDownComponent('Користувачі');
        window.removeClass('for-list').addClass('for-users');
    }else{
        window = CreateModalWindowComponents();
        window.removeClass('modal-dialog');
        window.addClass('user-dialog');
        window.find('.create-btn').text('Додати');
        makeElementMovable(window, window.find('.title-bar'));
    }

    parent.append(window);

    const employes = $('<ol>').addClass('e-list');
    const isEmpty = (localStorage['selected-users'] === undefined || localStorage['selected-users'] === null);
    const selectedUsers = view ? [] : isEmpty ? [] : JSON.parse(localStorage['selected-users']);

    const storage = JSON.parse(localStorage['board']);
    const boardData = getBoardDataFromStorage(storage, localStorage['selected-board']);
    const users = boardData.users;

    const createUserItem = (user) => {
        const isSelected = isEmpty ? false : user.info.seed && selectedUsers.includes(user.info.seed);
        if(!isSelected){
            const listElement = $('<li>').addClass('profile-thumbnail ctrl-e').attr('data-id',user.info.seed);
            const img = $('<img>').attr('src',user.results[0].picture.thumbnail);
            const name = user.results[0].name;
            const fullName = name.title + " " + name.first + " " + name.last;
            const username = fullName.length > 20 ? fullName.substring(0, 20) + '...' : fullName;
            const userNameDiv = $('<div>').append($('<span>').text(username));
            listElement.append(img, userNameDiv);

            if(view){
                listElement.on('click',function(){
                    setTimeout(function (){
                        const countOfSelected = $('.profile-thumbnail.active').length;
                        if(countOfSelected > 0){
                            if(window.find('.remove-selected-users').length === 0) {
                                const removeUserBtn = $('<div>').addClass('list-el ctrl-e remove-selected-users').text('Видалити');
                                window.find('.list').append(removeUserBtn);
                            }
                        }
                        else{
                            window.find('.remove-selected-users').remove();
                        }
                    }, 100);
                });
            }
            return listElement;
        }
    };

    if(users.length > 0){
        for(let i = 0; i < users.length; i++){
            employes.append(createUserItem(users[i]));
        }
    }

    if(view){
        const addUserBtn = $('<div>').addClass('list-el ctrl-e create-btn').text('Додати нового користувача');
        window.find('.list').prepend(employes.children().length > 0 ? employes : $('<div>').addClass('empty-content').text('Немає користувачів'));
        window.find('.list').append(addUserBtn);

        addUserBtn.on('click', async function(){
            const storage = JSON.parse(localStorage['board']);
            const boardData = getBoardDataFromStorage(storage,localStorage['selected-board']);
            const users = boardData.users;

            if(users.length < 10) {
                const user = await generateUser();
                employes.append(createUserItem(user));
                users.push(user);

                const rPart = $('.r-part-menu');
                const fill = usersList(users);
                rPart.find('.board-users-container').remove();
                rPart.prepend(fill);
                updateLocalStorage('board', JSON.stringify(storage));

            }else{
                sendToastMsg('Максимальна кількість користувачів - 10', 'error', true);
            }
        });
    }
    else {
        window.find('.dialog-content').addClass('dialog-user-content').append(employes.children().length > 0 ? employes : $('<div>').addClass('empty-content').text('Немає користувачів'));
        return new Promise((resolve) => {
            window.on('click', '.create-btn', () => {
                const dataArray = $('li.profile-thumbnail.active').map(function () {
                    return $(this).attr('data-id');
                }).get();

                try {
                    if (dataArray.length === 0) throw new Error('Оберіть хоча б одного робітника');
                    removeDialog(window);
                    resolve(dataArray);
                } catch (error) {
                    sendToastMsg(error.message, 'error', true);
                }
            });

            window.on('click', '.close-btn', () => {
                resolve(null);
            });
        });
    }
}

async function addUsers(parent, employesContainer, type) {
    if ($('body').find('.dialog-window.user-dialog').length === 0) {
        const faded = createFadedBg();
        parent.append(faded);
        const userSeeds = await CreateModalWindowForUsers(faded);
        if (userSeeds) {
            type === 1 ? saveLocalStorageArray('selected-users', userSeeds) : saveLocalStorageArray('selected-responsible', userSeeds);
            
            const storage = JSON.parse(localStorage['board']);
            const boardData = getBoardDataFromStorage(storage, localStorage['selected-board']);

            for (let i = 0; i < userSeeds.length; i++) {
                const user = boardData.users.find(obj => obj.info.seed === userSeeds[i]);
                const listElement = $('<li>').addClass('profile-thumbnail').attr('data-id', user.info.seed);
                listElement.append($('<img>').attr('src', user.results[0].picture.thumbnail));
                employesContainer.prepend(listElement);
            }
        }
    }
}

function createFadedBg(){
    const body = $('<div>').addClass('faded-bg');
    return body;
}

function createBoardSettings(titleName, type) {
    const boardBg = JSON.parse(localStorage['board']).find(obj => obj.id === localStorage['selected-board']).background;
    const section = $("<section>").addClass(type !== 1 ? "board-settings-bg" : "board-settings").addClass('small');
    const titleBar = $("<div>").addClass("title-bar");
    const title = $("<div>").addClass("title").text(titleName);
    const closeBtn = $("<div>").addClass("close-btn ctrl-e").html("<i class='bx "+(type !== 1 ? 'bx-chevron-left' : 'bx-x')+"'></i>");
    const menuContent = $("<div>").addClass("menu-content");
    const list = $("<div>").addClass("list");
    
    if(type === 1){
        const listEl1 = $("<div>").addClass("list-el ctrl-e chg-board-bg");
        listEl1.append($("<div>").addClass("board-background").css('background', boardBg)).append("Змінити фон");
        const listEl2 = $("<div>").addClass("list-el ctrl-e chg-tags");
        listEl2.append($("<i>").addClass("bx bxs-purchase-tag")).append("Редагувати мітки");    
        const listEl3 = $("<div>").addClass("list-el ctrl-e del-board");
        listEl3.append($("<i>").addClass("bx bxs-trash")).append("Видалити");    
        list.append(listEl1, listEl2, listEl3);
    }
    else if( type === 2 ){
        for(let i = 0; i < boardBackgroundCount; i++){
            list.append($('<div>').addClass('selectable-bg ctrl-e').css('background', 'var(--board-bg'+i+')'));
        }
    }
    else if( type === 3 ){
        const picker = $('<input>').attr('type','color');
        const storage = JSON.parse(localStorage['board']);
        const boardData = getBoardDataFromStorage(storage, localStorage['selected-board']);
        const colors = boardData.tags;
        const createEl = (color) => {
            const body = $('<div>').addClass('tag-bd');
            const removeBtn = $('<i>').addClass('bx bx-x ctrl-e');
        
            removeBtn.on('click', function(){
                if(boardData.tags.length > 2){
                    boardData.tags.splice(list.find(body).index(), 1);
                    removeTagsFromTiles(boardData, color)
                    updateLocalStorage('board', JSON.stringify(storage));
                    body.remove();
                }else{
                    sendToastMsg('Міток не може бути менше ніж 2', 'error', true);
                }
            });

            body.append($('<div>').addClass('tag-color list-el').css('background',color));
            body.append(removeBtn);
            return body;
        }

        for(let i = 0; i < colors.length; i++){
            list.append(createEl(colors[i]));
        }

        picker.on('change',function(e){
            const selectedColor = e.target.value;
            if(boardData.tags.length < 10){
                boardData.tags.push(selectedColor);
                createEl(selectedColor).insertBefore(picker);
                updateLocalStorage('board', JSON.stringify(storage));
            }
            else{
                sendToastMsg('Міток не може бути більше ніж 10', 'error', true);
            }
        });

        list.append(picker);
    }

    menuContent.append(list);
    type !== 1 ? titleBar.append(closeBtn, title) :  titleBar.append(title, closeBtn); 
    section.append(titleBar, menuContent);
    
    setTimeout(function (){
        section.removeClass('small');
    },10);

    return section;
}

function defaultListContent(){
    const section = $('<section>').addClass('list-content');
    const floatingBtn = $('<div>').addClass('floating-btn hidden').attr('id', 'show-hide-menu').append($('<i>').addClass('bx bx-chevron-right'));
    const emptyContent = $('<div>').addClass('empty-content absolute').text('Оберіть або створіть дошку');

    return section.append(floatingBtn, emptyContent);
}

$(document).on('click', '.btn-settings', function(){
    const main = $('.main-content');
    if(main.find('.board-settings').length === 0)
        main.append(createBoardSettings('Меню', 1));
});


$(document).on('click', '.del-board', async function(){
    const storage = JSON.parse(localStorage['board']);
    const boardID = localStorage['selected-board'];
    const element = $('.board-item[data-id="'+boardID+'"]');

    const result = await showDialogWindow('Ви певні, що хочете видалити дошку?');

    if(result) {
        changeBoardBg('none');
        element.remove();
        $(this).closest('.list').parent().parent().find('.close-btn').trigger('click');
        $('section.list-content').replaceWith(defaultListContent());

        deleteJsonElement(storage, boardID);
        updateLocalStorage('board', JSON.stringify(storage));
        sendToastMsg('Дошку успішно видалено', 'info', true);
    }
});

$(document).on('click','.chg-board-bg',function(){
    const main = $('.main-content');
    if(main.find('.board-settings-bg').length === 0)
        main.append(createBoardSettings('Зміна фону дошки', 2));
});

$(document).on('click','.chg-tags',function(){
    const main = $('.main-content');
    if(main.find('.board-settings-bg').length === 0)
        main.append(createBoardSettings('Зміна міток', 3));
});

$(document).on('click','.selectable-bg',function(){
    const newBg = $(this).attr('style').split(' ')[1].split(';')[0];
    const storage = JSON.parse(localStorage['board']);
    const boardID = localStorage['selected-board'];
    const board = storage.find(obj => obj.id === boardID);
    board.background = newBg;
    changeBoardBg(newBg);
    changeSelectedColor(newBg);
    updateLocalStorage('board',JSON.stringify(storage));
    sendToastMsg('Колір фону змінено','info', true);
});

function changeBoardBg(background){
    $('.main-content').css('background', background);
}


function changeSelectedColor(background){
    $('.board-background').css('background', background);
}

$(document).on('input','.list-name', function(){
    try{
        const listID = $(this).closest('.list-item').attr('data-id');
        const text = $(this).text();

        const storage = JSON.parse(localStorage['board']);
        const boardID = localStorage['selected-board'];
        const board = storage.find(obj => obj.id === boardID);
        const list = board.lists.find(onj => onj.id === listID);

        validateName(text);

        list.name = text;
        updateLocalStorage('board',JSON.stringify(storage));
    }
    catch(e){
        sendToastMsg(e.message,'error',true);
    }
});
$(document).on('input','#list-name', function(){
    try{
        const text = $(this).text();
        const storage = JSON.parse(localStorage['board']);
        const boardID = localStorage['selected-board'];
        const board = storage.find(obj => obj.id === boardID);
        const boardItem = $('.board-item[data-id = '+boardID+']');

        validateName(text);

        boardItem.find('span').text(text);
        board.name = text;
        updateLocalStorage('board',JSON.stringify(storage));
    }
    catch(e){
        sendToastMsg(e.message,'error',true);
    }
});

$(document).on('click','.list-tile',async function(e) {

    if ($(e.target).hasClass('del-tile')) return;

    const listID = $(this).closest('.list-item').attr('data-id');
    const tileID = $(this).attr('data-id');

    const storage = JSON.parse(localStorage['board']);
    const boardID = localStorage['selected-board'];
    const board = storage.find(obj => obj.id === boardID);
    const list = board.lists.find(obj => obj.id === listID);
    const tile = list.tiles.find(obj => obj.id === tileID);

    const main = $('.main-content');
    const faded = createFadedBg();
    main.append(faded);

    const data = await CreateModalWindowForTileEdit(faded, tile);

    if (data != null) {
        data.id = tile.id;
        tile.name = data.name;
        tile.description = data.description;
        tile.date = data.date;
        tile.employes = data.employes;
        tile.responsible = data.responsible;
        tile.tags = data.tags;

        updateLocalStorage('board', JSON.stringify(storage));

        const newTile = createTileItem(data);
        $(this).replaceWith(newTile);
        sendToastMsg('Зміни збережено', 'info', true);
    }
});

$(document).on('click','.e-list li.profile-thumbnail',function(){
    $(this).toggleClass('active');
});

$(document).on('click', '.e-container li.profile-thumbnail', function(){
    const id = $(this).attr('data-id');
    const users = JSON.parse(localStorage['selected-users']);

    const newArray = removeFromArrayByValue(users,id);
    updateLocalStorage('selected-users',JSON.stringify(newArray));

    $(this).remove();
});

function closeSettings(){
    $('.board-settings').find('.close-btn').trigger('click');
    $('.board-settings-bg').find('.close-btn').trigger('click');
}

function getSelectedTags(){
    const selectedTags = [];
        $('.s-tag-color').each(function() {
            const color = $(this).css('background');
            const rgbRegex = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/;
            const match = color.match(rgbRegex);
            if (match){
                const c = getRGBValues(match[0]);
                selectedTags.push(rgbToHex(c.red,c.green,c.blue));
            }
        });

    return selectedTags;
}

$(document).on('click','.add-tag-btn',function(){
    const selectedTags = getSelectedTags();
    tagDropDown($(this).parent(), selectedTags);  
});

$(document).on('click','.tag-el',function(){
    const checkBox = $(this).find('input[type=checkBox]');
    const color = $(this).find('.tag-color').css('background');
    const isChecked = checkBox.prop('checked');
    checkBox.prop('checked', !isChecked);

    const rgbRegex = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/;
    const match = color.match(rgbRegex);

    if (match) {
        const tagsBody = $('.tags-body');
        const rgbValue = match[0];
        isChecked ? $('.s-tag-color[style="background: '+rgbValue+';"]').remove() : tagsBody.prepend($('<div>').addClass('s-tag-color').css('background', rgbValue));
    } else {
        console.log("RGB кольор не знайдений.");
    }

});


function showDialogWindow(msg) {
    const faded = createFadedBg();
    const dialogWindow = $('<div class="dialog-window yes-no"></div>');
    const message = $(`<div class="section-name regular-text"><span>${msg}</span></div>`);
    const btnsContainer = $('<div class="dialog-btn-container"></div>');
    const yesButton = $('<div class="dialog-btn ctrl-e">Так</div>');
    const noButton = $('<div class="dialog-btn ctrl-e">Ні</div>');

    btnsContainer.append(yesButton);
    btnsContainer.append(noButton);
    dialogWindow.append(message);
    dialogWindow.append(btnsContainer);
    faded.append(dialogWindow);
    $('.main-content').append(faded);
    return new Promise((resolve, reject) => {
        yesButton.on('click', () => {
            faded.remove();
            resolve(true);
        });

        noButton.on('click', () => {
            faded.remove();
            resolve(false);
        });
    });
}