let db;
const request = indexedDB.open('budget_tracker', 1);

//If the database version changes
request.onupgradeneeded = function(event) {
  //Save a reference to the database 
  const db = event.target.result;
  //Create an object store (table) called `new_budget_entry`
  db.createObjectStore('new_budget_entry', { autoIncrement: true });
};

request.onsuccess = function(event) {
  //When db is successfully created save reference to db in global variable
  db = event.target.result;

  //Check if app is online, if yes run uploadBudgetEntry() function to send all local db data to api
  if (navigator.onLine) {
    uploadBudgetEntry();
  }
};

request.onerror = function(event) {
  console.log(event.target.errorCode);
};

//Executed if attempt to submit a new entry and internet is not available
function saveRecord(record) {
  //Open a new transaction with the database with read and write permissions 
  const transaction = db.transaction(['new_budget_entry'], 'readwrite');

  //Access the object store for `new_budget_entry`
  const budgetObjectStore = transaction.objectStore('new_budget_entry');

  budgetObjectStore.add(record);
    alert("Offline Mode: Update saved successfully");
}

function uploadBudgetEntry() {
  const transaction = db.transaction(['new_budget_entry'], 'readwrite');

  const budgetObjectStore = transaction.objectStore('new_budget_entry');

  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(['new_budget_entry'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('new_budget_entry');

          budgetObjectStore.clear();

          alert("Update: All pending offline transactions have been posted!");
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}

window.addEventListener('online', uploadBudgetEntry);