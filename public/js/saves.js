function updateJsonElement(jsonArray, data, id){
    const index = jsonArray.findIndex(obj => obj.id === id);
    
    if (index !== -1) {
        jsonArray[index] = data;
    } else {
        console.error('id немає');
        throw new Error('Елемент з вказаним id не знайдено.');
    }
}

function deleteJsonElement(jsonArray, id) {
    const index = jsonArray.findIndex(obj => obj.id === id);

    if (index !== -1) {
        jsonArray.splice(index, 1);
    } else {
        throw new Error('Елемент з вказаним id не знайдено.');
    }

    return jsonArray;
}

function getBoardDataFromStorage(storage, boardID){
    return storage.find(obj => obj.id === boardID);
}

function getListDataFromStorage(storage, listID){
    const boardID = localStorage['selected-board'];
    const boardData = storage.find(obj => obj.id === boardID);
    return boardData.lists.find(obj => obj.id === listID);
}

function insertJsonElement(jsonArray, index, element) {
    jsonArray.splice(index, 0, element);
}


function updateLocalStorage(localStorageName, data){
    localStorage.setItem(localStorageName, data);
}

function saveLocalStorage(localStorageName, data){
    const storedList = JSON.parse(localStorage.getItem(localStorageName)) || [];
    storedList.push(data);
    localStorage.setItem(localStorageName, JSON.stringify(storedList));
}

function saveLocalStorageArray(localStorageName, array) {
    const storedList = localStorage.getItem(localStorageName) || '[]';
    const storedArray = JSON.parse(storedList);
    const mergedArray = [...storedArray, ...array];
    localStorage.setItem(localStorageName, JSON.stringify(mergedArray));
}

function removeLocalStorageArray(localStorageName, element) {
    const storedList = localStorage.getItem(localStorageName) || '[]';
    const storedArray = JSON.parse(storedList);
    const index = storedArray.indexOf(element);
    if (index !== -1) {
        storedArray.splice(index, 1);
        localStorage.setItem(localStorageName, JSON.stringify(storedArray));
    }
}

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function pushTileItem(listData, tileData){
    listData.tiles.push(tileData);
}

function pushListItem(boardData, listData){
    boardData.lists.push(listData);
}

function pushLogItem(msg){
    const boardID = localStorage['selected-board'];
    const storage = JSON.parse(localStorage['board']);
    const boardData = getBoardDataFromStorage(storage, boardID);

    const data = {
        date: new Date(),
        msg: msg,
    }

    boardData.log.push(data);
    updateLocalStorage('board', JSON.stringify(storage));
}

function pushUser(boardData, userData){
    boardData.users.push(userData);
}

function removeFromArrayByValue(array, value) {
    return array.filter(item => item !== value);
}

function findTileByID(boardData, id){
    const lists = boardData.lists;
    for(let i = 0; i < lists.length; i++){
        const list = lists[i];
        for(let j = 0; j < list.tiles.length; j++){
            const tile = list.tiles[j];
            if(tile.id === id) return tile;
        }
    }
}

function clearLog(){
    const boardID = localStorage['selected-board'];
    const storage = JSON.parse(localStorage['board']);
    const boardData = getBoardDataFromStorage(storage, boardID);
    boardData.log = [];
    updateLocalStorage('board', JSON.stringify(storage));
}

function hasTiles(){
    const boardID = localStorage['selected-board'];
    const storage = JSON.parse(localStorage['board']);
    const boardData = storage.find(obj => obj.id === boardID);
    const lists = boardData.lists;
    for(let i = 0; i < lists.length; i++){
        const list = lists[i];
        if(list.tiles.length > 0) return true;
    }

    return false;
}

function tileNameUsed(name, id){
    const boardID = localStorage['selected-board'];
    const storage = JSON.parse(localStorage['board']);
    const boardData = storage.find(obj => obj.id === boardID);
    const lists = boardData.lists;
    for(let i = 0; i < lists.length; i++){
        const list = lists[i];
        for(let j = 0; j < list.tiles.length; j++){
            const tile = list.tiles[j];
            if(tile.name === name && tile.id !== id) return true;
        }
    }

    return false;
}
