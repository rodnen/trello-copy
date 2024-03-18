let timeoutId;

$(document).on('click', '#show-hide-menu', function(){
    $('.boards-list-section').attr('aria-expanded', function (_, value) {
        const data = !JSON.parse(value);
        const rootStyles = getComputedStyle(document.documentElement);
        document.documentElement.style.setProperty('--current-aria-width', rootStyles.getPropertyValue(data ? '--expanded-aria' : '--hiden-aria'));
        return String(data);
    });
});

$(document).on('click', '.floating-btn', function(){
    $(this).addClass('hidden');
});

$(document).on('mouseover','.boards-list-section[aria-expanded="false"], .floating-btn',function(){
    clearTimeout(timeoutId);
    $('.floating-btn').removeClass('hidden');
});

$(document).on('mouseleave','.boards-list-section[aria-expanded="false"], .floating-btn',function(){
    timeoutId = setTimeout(function() {
        $('.floating-btn').addClass('hidden');
    }, 500);
});

$(document).on('click','.btn-add-board', async function(){
    const main = $('.main-content');
    const faded = createFadedBg();
    main.append(faded);
    const result = await CreateModalWindowForBoard(faded);
    
    if(result !== null){
        const boardItem = createBoardItem(result);
        boardItem.insertBefore($(this));
        saveLocalStorage('board', result);
        createStartLists(result.id);
        sendToastMsg('Дошку створено','info', true);
    }
});

$(document).on('click','#add-list > .btn-add-list', async function(){
    const boardID = localStorage['selected-board'];
    const storage = JSON.parse(localStorage['board']);
    const boardData = getBoardDataFromStorage(storage, boardID);

    if(boardData.lists.length === 10){
        sendToastMsg('Не можна створити більше 10 списків!', 'error', true);
        return;
    }

    const main = $('.main-content');
    const faded = createFadedBg();
    main.append(faded);
    const result = await CreateModalWindowForList(faded);
    
    if(result !== null){
        pushListItem(boardData,result);
        updateLocalStorage('board', JSON.stringify(storage));
        
        const list = $('#lists');
        const listItem = createListItem(result);
        list.append(listItem);
        sendToastMsg('Список додано','info', true);
    }
});

$(document).on('click','.btn-add-tile', async function(){
    try{
        const main = $('.main-content');
        const faded = createFadedBg();
        const listID = $(this).parent().attr('data-id');
        validateTilesCount(listID);
        main.append(faded);
        const result = await createModalWindowForTile(faded);
    
        if(result !== null){        
            const listID = $(this).closest('.list-item').attr('data-id');
            const storage = JSON.parse(localStorage['board']);
            const listData = getListDataFromStorage(storage, listID);

            pushTileItem(listData,result);
            updateLocalStorage('board', JSON.stringify(storage));

            const listItem = $(this).parent().find('.list-content');
            const tileItem = createTileItem(result);
            listItem.append(tileItem);
            sendToastMsg('Задачу додано','info', true);
        }
    }
    catch(e){
        sendToastMsg(e.message,'error',true);
    }
});

$(document).on('dragstart','.list-tile',function(e){
    const tiles = $('.list-tile');
    const currentTile = $(this);
    localStorage['dragstart-element'] = currentTile.closest('.list-item').attr('data-id');
    const index = tiles.index(this);
    e.originalEvent.dataTransfer.setData('text', index.toString());
});


$(document).on('dragover', '.list-item', function(e) {
    e.preventDefault();
});


$(document).on('drop','.list-item', function(e){
    try{
        e.preventDefault();
        const dragEndElementID = $(this).attr('data-id');
        validateTilesCount(dragEndElementID);
        const storage = JSON.parse(localStorage['board']);
        const boardData = storage.find(obj => obj.id === localStorage['selected-board']);
        const startListData = boardData.lists.find(obj => obj.id === localStorage['dragstart-element']);
        const endListData = boardData.lists.find(obj => obj.id === dragEndElementID);

        const data = e.originalEvent.dataTransfer.getData('text');
        const draggedElement = $('.list-tile').eq(parseInt(data));
        const draggedElementID = draggedElement.attr('data-id');
        const draggedElementData = startListData.tiles.find(obj => obj.id === draggedElementID);
        const body = $(this).find('.list-content');
        
        const mouseY = e.originalEvent.clientY - $(this).offset().top;
        const elements = $(this).find('.list-tile');

        let inserted = false;
        elements.each(function() {
            const elementTop = $(this).offset().top - $(this).parent().offset().top;
            const elementHeight = $(this).outerHeight();
            
            if (mouseY < elementTop + elementHeight && !inserted) {
                $(this).before(draggedElement);
                inserted = true;
            }
        });

        if (!inserted && !draggedElement.parent().is($(this))) {
            body.append(draggedElement);
        }

        const newPosition = body.find('.list-tile').index(draggedElement);

        deleteJsonElement(startListData.tiles,draggedElementID);
        insertJsonElement(endListData.tiles, newPosition, draggedElementData);
        updateLocalStorage('board',JSON.stringify(storage));
    }
    catch(e){
        sendToastMsg(e.message,'error',true);
    }
});


$(document).on('click','svg.close-toast',function(){
    killMsg($(this).parent());
});

$(document).on('click','.close-btn',function(){
    const body = $(this).parent().parent();

    if(body.hasClass('board-settings') || body.hasClass('board-settings-bg')){
        body.addClass('small');
        setTimeout(() => {
            body.remove();
        }, 500);
    }
});

$(document).on('click','.del-list', async function(){
    const list = $(this).closest('li.list-item');
    const listID = list.attr('data-id');
    const storage = JSON.parse(localStorage['board']);
    const boardData = storage.find(obj => obj.id === localStorage['selected-board']);
    const listData = boardData.lists.find(obj => obj.id === listID);

    try{
        if(listData.tiles.length !== 0) throw new Error('Не можна видаляти список із завданнями');
        if(listData.removable) {
            const result = await showDialogWindow('Видалити список "'+list.find('.list-name').text()+'"');
            if(result) {
                deleteJsonElement(boardData.lists, listID);
                updateLocalStorage('board', JSON.stringify(storage));
                list.remove();
                sendToastMsg('Список видалено', 'info', true);
            }
        }
        else throw new Error('Початкові списки не можна видалити');
    }
    catch(e){
        sendToastMsg(e.message,'error', true);
    }
});

$(document).on('click','.del-tile',async function(){
    const listID = $(this).closest('li.list-item').attr('data-id');
    const tile = $(this).closest('.list-tile');
    const tileID = tile.attr('data-id');
    const storage = JSON.parse(localStorage['board']);
    const boardData = storage.find(obj => obj.id === localStorage['selected-board']);
    const listData = boardData.lists.find(obj => obj.id === listID);

    const result = await showDialogWindow('Видалити картку "'+tile.find('.tile-title').text()+'"');

    if(result) {
        deleteJsonElement(listData.tiles, tileID);
        tile.remove();
        updateLocalStorage('board', JSON.stringify(storage));
        sendToastMsg('Картку видалено', 'info', true);
    }
});
function removeDialog(dialog){
    dialog.closest('.faded-bg').remove();
}

$(document).on('click','.list-settings', function(){
    const parent = $(this).parent().parent();
    listDropDown(parent);
});

$(document).on('click', '.chg-list-clr', function(){
    const picker = $(this).find('input[type="color"]');
    const list = $(this).closest('.list-item');
    picker.on('change',function(e){
        const selectors = '.list-ctrls .list-name, .list-ctrls .list-settings, .btn-add-tile .btn-content, .btn-content span';
        const selectedColor = e.target.value;
        const fontColor = getContrastColor(selectedColor);

        list.find(selectors).css('color', fontColor);
        list.css('background', selectedColor);

        
        const listID = list.attr('data-id');
        const storage = JSON.parse(localStorage['board']);
        const listData = getListDataFromStorage(storage, listID);
        
        listData.background = selectedColor;
        listData.color = fontColor;

        updateLocalStorage('board', JSON.stringify(storage));
        
        if($('.res-list-clr').length === 0)
            $('<div>').addClass('list-el ctrl-e res-list-clr').text('Відновити колір').insertAfter($(this).parent());
    });

    picker[0].click();
});

$(document).on('click', '.res-list-clr', function(){
    const list = $(this).closest('.list-item');
    const selectors = '.list-ctrls .list-name, .list-ctrls .list-settings, .btn-add-tile .btn-content, .btn-content span';
    list.find(selectors).removeAttr('style');
    list.removeAttr('style');

    const listID = list.attr('data-id');
    const storage = JSON.parse(localStorage['board']);
    const listData = getListDataFromStorage(storage, listID);

    listData.background = '';
    listData.color = '';

    updateLocalStorage('board', JSON.stringify(storage));

    $(this).remove();
});

$(document).on('click','.board-item', function(){
    $('.board-item.active').removeClass('active');
    $(this).addClass('active');

    const btn = $('<div>').addClass('floating-btn hidden').attr('id','show-hide-menu').html($('<i>').addClass('bx bx-chevron-right'));
    const listContent = $('.list-content');
    const data = getBoardData($(this).attr('data-id'));
    localStorage['selected-board'] = data.id;
    listContent.html('');
    
    closeSettings();
    
    listContent.append(btn);
    createListContent(listContent,data);
    loadLists($(this));
});


function createListContent(body,data){
    $('.main-content').css('background',data.background);
    const storage = JSON.parse(localStorage['board']);
    const boardData = getBoardDataFromStorage(storage,localStorage['selected-board']);
    const users = boardData.users;
   
    const listNavigation = $('<section>').addClass('l-nav-menu');
    const lists = $('<div>').addClass('lists');
    const addList = $('<div>').addClass('add-list').attr('id','add-list');
    const btnAddList = $('<div>').addClass('btn-add-list h-color ctrl-e');
    const btnContent = $('<div>').addClass('btn-content').append($('<i>').addClass('bx bx-plus'), $('<span>').text('Додати новий список'));

    const lPart = $('<div>').addClass('l-part-menu');
    const rPart = $('<div>').addClass('r-part-menu');

    const h1 = $('<h1>').attr('id','list-name').attr("contenteditable", "true").text(data.name);
    const select = $('<select>');
    const btnSettings = $('<div>').addClass('btn-settings h-color ctrl-e').append($('<i>').addClass('bx bxs-cog'));
    const genBtn = $('<div>').addClass('generate-users ctrl-e').text('Згенерувати користувачів');

    select.append($('<option>').text('Дошка'));
    select.append($('<option>').text('Календар'));

    lPart.append(h1, /*select,*/ btnSettings);
    rPart.append(users.length > 0 ? usersList(users) : genBtn);
    
    listNavigation.append(lPart, rPart);

    const listSection = $('<section>').addClass('l-section').attr('id','lists');
    const addListSection = $('<section>').addClass('add-list').attr('id','add-list');
    
    lists.append(listSection, addListSection, addList);

    addList.append(btnAddList);
    btnAddList.append(btnContent);

    body.append(listNavigation, lists);
}

function usersList(users){
    const container = $('<div>').addClass('board-users-container');
    const body = $('<div>').addClass('profile-thumbnail');
    const countOfUsers = users.length;
    const maxIter = countOfUsers >= 5 ? 5 : countOfUsers;

    for(let i = 0; i < maxIter; i++){
        body.append($('<img>').addClass('nav-bar-img').attr('src',users[i].results[0].picture.thumbnail));
    }

    if(maxIter != countOfUsers)
        body.append($('<div>').addClass('u-more-count').text('+'+ (countOfUsers - maxIter)));

    container.on('click', async function (e){
        localStorage.removeItem('selected-users');
        if($('.l-drop-down.for-users').length === 0 && ($(e.target)[0] === container[0] || $(e.target)[0] === body[0] || $(e.target)[0] === body.find($(e.target))[0])) {
            await CreateModalWindowForUsers(container.parent(), true);
        }
    });

    container.append(body);
    return container;
}

function createBoardItem(data){
    const boardItem = $('<div>').addClass('board-item ctrl-e').attr("data-id", data.id).append($('<span>').text(data.name));
    return boardItem;
}

function createListItem(list){
    const listItem = $("<li>").addClass("list-item").attr("data-id", list.id);
    const listCtrls = $("<div>").addClass("list-ctrls ctrl-e");
    const listName = $("<div>").addClass("list-name b-h-color").attr("contenteditable", "true").text(list.name);
    const listSettings = $("<div>").addClass("list-settings b-h-color").html("<i class='bx bx-dots-horizontal-rounded'></i>");
    listCtrls.append(listName, listSettings);
    
    const listContent = $("<div>").addClass("list-content");
    const addTile = $("<div>").addClass("btn-add-tile b-h-color ctrl-e");

    const btnContent = $("<div>").addClass("btn-content").html("<i class='bx bx-plus'></i><span>Додати картку</span>");
    addTile.append(btnContent);
    listItem.append(listCtrls, listContent, addTile);

    const selectors = '.list-ctrls .list-name, .list-ctrls .list-settings, .btn-add-tile .btn-content, .btn-content span';
    listItem.find(selectors).css('color', list.color);
    listItem.css('background', list.background);

    return listItem;
}

function createTileItem(data){

    const tileItem = $('<div>').addClass("list-tile ctrl-e").attr('draggable',"true").attr('data-id',data.id);
    const tagsBody = $('<div>').addClass('list-tile-tags-body');

    for(let i = 0; i < data.tags.length; i++){
        tagsBody.append($('<div>').addClass('tile-tag').css('background',data.tags[i]));
    }
/*
    for(let i = 0; i < data.users.length; i++){
        tagsBody.append($('<div>').addClass('tile-tag').css('background',data.tags[i]));
    }*/

    const uSide = $('<div>').addClass('u-side');
    const dSide = $('<div>').addClass('d-side');

    const deleteBtn = $('<div>').addClass('del-tile').append('<i>').addClass('bx bxs-trash');

    const tileTitle = $('<div>').addClass('tile-title').text(data.name);
    const tileDate = $('<div>').addClass('tile-date').html("<i class='bx bx-time'></i>"+formatDate(new Date(data.date)));

    uSide.append(tagsBody, tileTitle);
    dSide.append(tileDate, deleteBtn);

    tileItem.append(uSide, dSide);
    return tileItem;
}

function formatDate(date){
    const months = ["січ", "лют", "бер", "квіт", "трав", "чер", "лип", "серп", "вер", "жовт", "лист", "груд"];
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    return day + ' ' + months[month] + ' ' + year + ' р.';
}

function createStartLists(boardID){
    const storage = JSON.parse(localStorage['board']);
    const boardData = getBoardDataFromStorage(storage,boardID);
    
    const toDo = { 
        id: generateUniqueId(), 
        name: "Треба зробити",
        created: new Date(),
        tiles: [],
        background: '',
        color: '',
        removable: false,
    };
    
    const inProgress = {
        id: generateUniqueId(), 
        name: 'Робиться',
        created: new Date(),
        tiles: [],
        background: '',
        color: '',
        removable: false,
    };

    const finished = { 
        id: generateUniqueId(), 
        name: 'Готово',
        created: new Date(),
        tiles: [],
        background: '',
        color: '',
        removable: false,
    };

    pushListItem(boardData,toDo);
    pushListItem(boardData,inProgress);
    pushListItem(boardData,finished);
    updateLocalStorage('board', JSON.stringify(storage));        
}

function makeElementMovable(elementSelector, handleSelector) {
    let isDragging = false;
    let offsetX, offsetY;

    const element = $(elementSelector);
    const handle = $(handleSelector);

    handle.on('mousedown', (event) => {
        isDragging = true;
        offsetX = event.pageX - element.offset().left;
        offsetY = event.pageY - element.offset().top;
    });

    $(document).on('mousemove', (event) => {
        if (isDragging) {
            const newX = event.pageX - offsetX;
            const newY = event.pageY - offsetY;
            element.css({ left: newX, top: newY });
        }
    });

    $(document).on('mouseup', () => {
        if (isDragging) {
            isDragging = false;
        }
    });
}

function dropDownComponent(name){
    const body = $('<div>').addClass('l-drop-down for-list');
    const titleBar = $('<div>').addClass('title-bar');
    const closeBtn = $('<div>').addClass('close-btn ctrl-e'); 
    const close = $('<i class="bx bx-x"></i>');
    const title = $('<div>').addClass('title').text(name);

    const content = $('<div>').addClass('drop-down-content');
    const list = $('<div>').addClass('list');

    closeBtn.on('click', function(){
        body.remove();
    });

    content.append(list);
    closeBtn.append(close);
    titleBar.append(title, closeBtn);
    body.append(titleBar, content);

    return body;
}

function listDropDown(parent, data){
    const listID = parent.attr('data-id');
    const storage = JSON.parse(localStorage['board']);
    const listData = getListDataFromStorage(storage, listID);

    const window = dropDownComponent('Дії над списком');

    const fields = ['Змінити колір', 'Відновити колір', "Видалити"];
    const classes = ['chg-list-clr', 'res-list-clr', "del-list"];
    
    const colorPicker = $('<input>').attr('type','color').addClass('color-picker');
    
    for(let i = 0; i < fields.length; i++){
        const element = $('<div>').addClass('list-el ctrl-e '+classes[i]).text(fields[i]);
        element.append(i === 0 ? colorPicker : '');

        if (i === 1) {
            if (listData.background !== '') {
                window.find('.list').append(element);
            }
        } else {
            window.find('.list').append(element);
        }
    }

    window.insertAfter(parent.find('.list-ctrls'));

    const html = $('html');
    html.on('click',function(e){
        if(!$(e.target).closest('.l-drop-down').length){
            window.remove();
            $(this).off('click');
        }
    });
}

function tagDropDown(parent, selectedTags){
    const window = dropDownComponent('Мітки');
    const colors = JSON.parse(localStorage['board'])[0].tags;
    window.removeClass('for-list').addClass('top');

    for(let i = 0; i < colors.length; i++){
        const body = $('<div>').addClass('tag-el');
        const checkInput = $('<input>').attr('type','checkBox');
        const element = $('<div>').addClass('tag-color list-el ctrl-e').css('background',colors[i]);

        if (selectedTags.includes(colors[i])) {
            checkInput.prop('checked', true);
        }

        body.append(checkInput, element);
        window.find('.list').append(body);
    }

    window.insertAfter(parent.find('.add-tag-btn'));

    const html = $('html');
    html.on('click',function(e){
        if(!$(e.target).closest('.l-drop-down').length){
            window.remove();
            $(this).off('click');
        }
    });
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function dateToNumber(date){
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return parseInt(`${year}${month < 10 ? '0' : ''}${month}${day < 10 ? '0' : ''}${day}`);
}

/*VALIDATION*/
/*VALIDATION*/
/*VALIDATION*/

function validateTilesCount(listID){
    const storage = JSON.parse(localStorage['board']);
    const countOfTiles = storage.find(obj => obj.id === localStorage['selected-board']).lists.find(obj => obj.id === listID).tiles.length;
    if(countOfTiles === 10) throw new Error('Список не може містити більше 10 задач');
}

function validateName(name){
    if(name.length === 0) throw new Error('Уведіть назву');
    if(name.length > 20) throw new Error('Максимальний розмір назви 20 символів');
}

function validateDate(date){
    const deadlineDate = dateToNumber(new Date(date));
    const currentDate = dateToNumber(new Date());
    if(deadlineDate < currentDate) throw new Error('Дата має бути більшою або дорівнювати теперішньому дню');
}

function validateDateEdit(date, prevDate){
    const deadlineDate = dateToNumber(new Date(date));
    const prevDeadlineDate = dateToNumber(new Date(prevDate));
    const currentDate = dateToNumber(new Date());

    if(prevDeadlineDate != deadlineDate)
        if(deadlineDate < currentDate) throw new Error('Дата має бути більшою або дорівнювати теперішньому дню');
}

function validateDescription(description){
    if(description.length === 0) throw new Error('Додайте опис');
    if(description.length > 2000) throw new Error('Максимальна довжина опису 2000 символів');
}

function validateBoard(data){
    try{
        validateName(data.name);
    }
    catch(e){
        throw new Error(e.message);
    }
}

function validateList(data){
    try{
        validateName(data.name);
    }
    catch(e){
        throw new Error(e.message);
    }
}

function validateTagsCount(data){
    if(data.length > 2) throw new Error("Не можна додавати більше 2 міток");
}

function validateEmployes(data){
    if(data === null || data === undefined || data.length === 0)
    throw new Error("Додайте робітників");
}

function validateTile(data){
    try{
        validateName(data.name);
        validateTagsCount(data.tags);
        data.prevDate ? validateDateEdit(data.date, data.prevDate) : validateDate(data.date);
        validateDescription(data.description);
        validateEmployes(data.employes);
    }
    catch(e){
        throw new Error(e.message);
    }
}
/*VALIDATION*/
/*VALIDATION*/
/*VALIDATION*/

function killMsg(element){
    element.addClass('toast-closing-animation');
    const time = parseFloat(element.css('transitionDuration')) * 1000;
    const killTime = time + 1000;

    setTimeout(function (){
        element.addClass('hide-toast');
    },time);

    setTimeout(function() {
        element.remove();
    }, killTime);
}

function sendToastMsg (msg, type, selfKill){
    const parser = new DOMParser();
    const icon = parser.parseFromString(getIcon(type), 'image/svg+xml').querySelector('svg');
    const cross = parser.parseFromString(getIcon('cross'), 'image/svg+xml').querySelector('svg');
    const body = $('.toast-msg-body');
    const isError = type === 'error';
    const toastClass = isError ? "toast-error" : "toast-msg";

    const msgBody = $('<div class="'+toastClass+' foreground-shadow menu-transition"></div>');
    const msgSpan =$('<span>'+msg+'</span>');
    const iconBody = $('<div class="i-container"></div>');

    iconBody.append(icon);
    msgBody.append(iconBody);
    msgBody.append(msgSpan);

    if(!selfKill)
        msgBody.append($(cross));
    else{
        setTimeout(function() {
            killMsg($(msgBody),isError);
        }, isError ? 2000 : 1000);
    }

    body.append(msgBody);
    $(msgBody).height($(msgBody).height() + 'px');
}

function getIcon(type){
    switch (type){
        case 'info':
            return '<svg class="svg-with-fill info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512"><path d="m256 8c-136.957 0-248 111.083-248 248 0 136.997 111.043 248 248 248s248-111.003 248-248c0-136.917-111.043-248-248-248zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12z"></path></svg>';
        case 'hint':
            return '<svg class="svg-with-fill info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512"><path xmlns="http://www.w3.org/2000/svg" d="m504 256c0 136.997-111.043 248-248 248s-248-111.003-248-248c0-136.917 111.043-248 248-248s248 111.083 248 248zm-241.345-166c-54.497 0-89.255 22.957-116.549 63.758-3.536 5.286-2.353 12.415 2.715 16.258l34.699 26.31c5.205 3.947 12.621 3.008 16.665-2.122 17.864-22.658 30.113-35.797 57.303-35.797 20.429 0 45.698 13.148 45.698 32.958 0 14.976-12.363 22.667-32.534 33.976-23.524 13.187-54.652 29.6-54.652 70.659v4c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12v-1.333c0-28.462 83.186-29.647 83.186-106.667 0-58.002-60.165-102-116.531-102zm-6.655 248c-25.365 0-46 20.635-46 46 0 25.364 20.635 46 46 46s46-20.636 46-46c0-25.365-20.635-46-46-46z"></path></svg>';
        case 'cross':
            return '<svg class="svg-with-fill close-toast" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 352 512"><path d="m242.72 256 100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0l-100.07 100.07-100.07-100.07c-12.28-12.28-32.19-12.28-44.48 0l-22.24 22.24c-12.28 12.28-12.28 32.19 0 44.48l100.07 100.07-100.07 100.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0l100.07-100.07 100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48z"></path></svg>';
        case 'error' || '!':
            return '<svg class="svg-with-fill info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512"><path d="m504 256c0 136.997-111.043 248-248 248s-248-111.003-248-248c0-136.917 111.043-248 248-248s248 111.083 248 248zm-248 50c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346 7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"/></svg>';
        case 'show':
            return '<svg class="svg-with-fill show-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 576 512"><path xmlns="http://www.w3.org/2000/svg" d="m288 144a110.94 110.94 0 0 0 -31.24 5 55.4 55.4 0 0 1 7.24 27 56 56 0 0 1 -56 56 55.4 55.4 0 0 1 -27-7.24 111.71 111.71 0 1 0 107-80.76zm284.52 97.4c-54.23-105.81-161.59-177.4-284.52-177.4s-230.32 71.64-284.52 177.41a32.35 32.35 0 0 0 0 29.19c54.23 105.81 161.59 177.4 284.52 177.4s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zm-284.52 158.6c-98.65 0-189.09-55-237.93-144 48.84-89 139.27-144 237.93-144s189.09 55 237.93 144c-48.83 89-139.27 144-237.93 144z"/></svg>';
        case 'hide':
            return '<svg class="svg-with-fill hide-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 640 512"><path xmlns="http://www.w3.org/2000/svg" d="m634 471-598-467.49a16 16 0 0 0 -22.49 2.49l-10 12.49a16 16 0 0 0 2.49 22.51l598 467.49a16 16 0 0 0 22.49-2.49l10-12.49a16 16 0 0 0 -2.49-22.51zm-337.21-324.53 134.79 105.38c-2.22-59.94-51.1-107.85-111.58-107.85a112.26 112.26 0 0 0 -23.21 2.47zm46.42 219.07-134.79-105.38c2.23 59.93 51.11 107.84 111.58 107.84a113 113 0 0 0 23.21-2.46zm-23.21-253.54c98.65 0 189.09 55 237.93 144a285.53 285.53 0 0 1 -44 60.2l37.74 29.5a333.7 333.7 0 0 0 52.9-75.11 32.35 32.35 0 0 0 0-29.19c-54.28-105.81-161.64-177.4-284.57-177.4-36.7 0-71.71 7-104.63 18.81l46.41 36.29c18.94-4.3 38.34-7.1 58.22-7.1zm0 288c-98.65 0-189.08-55-237.93-144a285.47 285.47 0 0 1 44.05-60.19l-37.74-29.5a333.6 333.6 0 0 0 -52.89 75.1 32.35 32.35 0 0 0 0 29.19c54.23 105.81 161.59 177.4 284.51 177.4 36.7 0 71.71-7.05 104.63-18.81l-46.41-36.28c-18.94 4.29-38.33 7.09-58.22 7.09z"/></svg>';
        case 'save':
            return '<svg class="svg-with-fill save-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewbox="0 0 448 512"><path d="m433.941 129.941-83.882-83.882a48 48 0 0 0 -33.941-14.059h-268.118c-26.51 0-48 21.49-48 48v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48v-268.118a48 48 0 0 0 -14.059-33.941zm-209.941 286.059c-35.346 0-64-28.654-64-64s28.654-64 64-64 64 28.654 64 64-28.654 64-64 64zm96-304.52v100.52c0 6.627-5.373 12-12 12h-232c-6.627 0-12-5.373-12-12v-104c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48a11.996 11.996 0 0 1 3.515 8.485z"></path></svg>';
        case 'mail':
            return '<svg class="svg-with-fill mail-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewbox="0 0 512 512"><path d="m502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7v204.5c0 26.5-21.5 48-48 48h-416c-26.5 0-48-21.5-48-48v-204.4c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zm-246.3 129.2c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48h-416c-26.5 0-48 21.5-48 48v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path></svg>';
    }
}

function getContrastColor(hexColor) {
    let r = parseInt(hexColor.substr(1, 2), 16);
    let g = parseInt(hexColor.substr(3, 2), 16);
    let b = parseInt(hexColor.substr(5, 2), 16);

    let brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    return brightness > 125 ? '#000000' : '#ffffff';
}

function rgbToHex(r, g, b) {
    function componentToHex(c) {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

  function getRGBValues(rgbString) {

    const values = rgbString.substring(4, rgbString.length - 1).replace(/ /g, '').split(',');
    const red = parseInt(values[0]);
    const green = parseInt(values[1]);
    const blue = parseInt(values[2]);

    return { red, green, blue };
}

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}