$(document).ready(function(){
    //localStorage.clear();
    //fillTagColors();
    const boards = $('.menu-bar-content').find('.content');
    const savedBoards = localStorage['board'] !== undefined;
    if(savedBoards){ console.log(JSON.parse(localStorage['board'])); loadBoards(boards);}

    const addNewBoardBtn = $('<div>').addClass('btn-add-board').attr('id','plus-board').html(($('<i>').addClass('bx bx-plus')[0]));
    boards.append(addNewBoardBtn);

});

function fillTagColors(){
    localStorage['tag-colors'] = JSON.stringify(['rgb(22, 75, 53)', 'rgb(159, 121, 7)','rgb(188, 77, 0)','rgb(169, 56, 47)','rgb(73, 60, 137)','rgb(12, 67, 146)']);
}

function getBoardData(id){
    const storage = JSON.parse(localStorage['board']);
    const data = storage.find(obj => obj.id === id);
    return data;
}

function loadBoards(body){
    const boards = JSON.parse(localStorage['board']);
    
    for(let i = 0; i < boards.length; i++){
        body.append(createBoardItem(boards[i]));
    }
}

function loadLists(filterTags = []){
    const boardID = localStorage['selected-board'];
    const storage = JSON.parse(localStorage['board']);
    const boardData = storage.find(obj => obj.id === boardID);
    const listsBody = $('#lists');
    listsBody.html('');
    const listsData = boardData.lists;
    for(let i = 0; i < listsData.length; i++){
        const list = listsData[i];
        const tiles = list.tiles;

        const listItem = createListItem(list);
    
        for(let j = 0; j < tiles.length; j++){
            const tile = tiles[j];
            if(filterTags.length > 0){
                if(tile.tags.some(item => filterTags.includes(item))){
                    listItem.find('.list-content').append(createTileItem(tile));
                }
            } else{
                listItem.find('.list-content').append(createTileItem(tile));
            }
        }

        listsBody.append(listItem);
    }
    
}

$(document).on('click','#show-all-boards-json', function(){
    console.log(JSON.parse(localStorage['board']));
});

$(document).on('click','#clear-storage', function(){
    localStorage.clear();
    sendToastMsg('Сховище очищено!', 'info', true);
});