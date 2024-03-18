const tile = {
    name: 'Назва',
    created: 'date',
    creator: 'creator',
    description: 'some',
    tags: ['tag1','tag2'],
    employes: ['1', '2'],
    deadline: 'deadline'
};

const list = {
    name: 'name',
    tiles: ['tile1','tile2'],
    crated: 'date',
    color: 'color'
};

const board = {
    name: 'name',
    lists: ['list1','list2'],
    users: ['user1', 'user2'],
    background: 'color'
}

const users = {
    userData: 'someData'
}

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

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function pushTileItem(listData, tileData){
    listData.tiles.push(tileData);
}

function pushListItem(boardData, listData){
    boardData.lists.push(listData);
}

function pushUser(boardData, userData){
    boardData.users.push(userData);
}

function removeFromArrayByValue(array, value) {
    return array.filter(item => item !== value);
}