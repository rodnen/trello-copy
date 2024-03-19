async function generateUser(){

    const user = await $.ajax({
        url: 'https://randomuser.me/api/',
        dataType: 'json',
        success: function(data) {}
    });

    return user;
}

async function fillUsers(countOfUsers){
    const storage = JSON.parse(localStorage['board']);
    const boardData = getBoardDataFromStorage(storage,localStorage['selected-board']);
    boardData.users = [];

    for(let i = 0; i < countOfUsers; i++){
        pushUser(boardData, (await generateUser()));
    }

    updateLocalStorage('board',JSON.stringify(storage));
}

function removeUsersFromTiles(boardData, seeds){
    for(let i = 0; i < boardData.lists.length; i++){
        const list = boardData.lists[i];
        for(let j = 0; j < list.tiles.length; j++){
            const tile = list.tiles[j];
            for(let k = 0; k < seeds.length; k++) {
                let index = tile.employes.indexOf(seeds[k]);
                if (index !== -1) tile.employes.splice(index, 1);
                index = tile.responsible.indexOf(seeds[k]);
                if (index !== -1) tile.responsible.splice(index, 1);
            }
        }
    }
}

function removeTagsFromTiles(boardData, tag){
    for(let i = 0; i < boardData.lists.length; i++){
        const list = boardData.lists[i];
        for(let j = 0; j < list.tiles.length; j++) {
            const tile = list.tiles[j];
            let index = tile.tags.indexOf(tag);
            if (index !== -1) tile.tags.splice(index, 1);
        }
    }

    const rgb = hexToRgb(tag);
    const color = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    $('.tile-tag[style="background: '+color+';"]').remove();
}

$(document).on('click','.generate-users',async function(){
    const countOfUsers = (getRandomInt(10) + 1);
    await fillUsers(countOfUsers);

    const storage = JSON.parse(localStorage['board']);
    const boardData = getBoardDataFromStorage(storage,localStorage['selected-board']);
    const users = boardData.users;
   
    $(this).parent().html(usersList(users, 5)[0]);
    sendToastMsg(`Користувачі згенеровані: ${countOfUsers}`, 'info', true);
});

$(document).on('click', '.remove-selected-users', function (){
    const storage = JSON.parse(localStorage['board']);
    const boardData = getBoardDataFromStorage(storage,localStorage['selected-board']);
    const users = boardData.users;

    if(users.length === 1){
        sendToastMsg('Мінімальна кількість користувачів - 1', 'error', true);
    }
    else{
        const dataArray = $(document).find('li.profile-thumbnail.active').map(function () {
            return $(this).attr('data-id');
        }).get();

        if($('.profile-thumbnail.active').length === users.length){
            $(document).find('li.profile-thumbnail.active[data-id = '+dataArray.at(0)+']').removeClass('active');
            dataArray.splice(0,1);
        }

        for(let i = 0; i < dataArray.length; i++){
            const index = users.findIndex(user => user.info.seed === dataArray[i]);
            if (index !== -1) {
                users.splice(index, 1);
            }
        }

        $(document).find('li.profile-thumbnail.active').remove();
        $(document).find('.remove-selected-users').remove();

        const rPart = $('.r-part-menu');
        const fill = usersList(users, 5);
        rPart.find('.board-users-container').remove();
        rPart.prepend(fill);

        removeUsersFromTiles(boardData, dataArray);
        updateLocalStorage('board', JSON.stringify(storage));
    }
});