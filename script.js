const CLIENT_ID = '1086756731753-t04p9b9c9edsaq4kehfhuj6rf3c69tuq.apps.googleusercontent.com';
const SCOPES =  "https://www.googleapis.com/auth/drive.file";

let authInstance;

// Load auth2 library
function initClient() {
    gapi.load('client:auth2', () => {
        gapi.client.init({
            clientId: CLIENT_ID,
            scope: SCOPES
        }).then(() => {
            authInstance = gapi.auth2.getAuthInstance();
            if (!authInstance.isSignedIn.get()) {
                authInstance.signIn();
            }
        });
    });
}

document.getElementById('storeSpotBtn').addEventListener('click', () => {
    document.getElementById('storeSpotForm').classList.toggle('hidden');
});

document.getElementById('uploadBtn').addEventListener('click', () => {
    const itemName = document.getElementById('itemName').value;
    const itemLocation = document.getElementById('itemLocation').value;
    const itemImage = document.getElementById('itemImage').files[0];

    if (itemName && itemLocation && itemImage) {
        uploadToGoogleDrive(itemName, itemLocation, itemImage);
    } else {
        alert('Please fill all fields!');
    }
});

function uploadToGoogleDrive(name, location, file) {
    const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
    if (!token) {
        alert("Please sign in first!");
        return;
    }

    const metadata = {
        name: file.name,
        mimeType: file.type
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
        body: form
    }).then(response => response.json()).then(data => {
        console.log('File uploaded:', data);
        alert('File Uploaded Successfully!');
        displayStoredItems();
    }).catch(error => console.error('Error:', error));
}

function displayStoredItems() {
    if (!gapi.client || !gapi.client.drive) {
        console.error('Google API client not loaded.');
        return;
    }

    gapi.client.drive.files.list({
        'pageSize': 10,
        'fields': "nextPageToken, files(id, name, thumbnailLink, description)"
    }).then(function(response) {
        const files = response.result.files;
        const gallery = document.getElementById('itemsGrid');
        gallery.innerHTML = '';

        if (files && files.length > 0) {
            files.forEach(file => {
                const item = document.createElement('div');
                item.className = 'item-card';
                item.innerHTML = `
                    <img src="${file.thumbnailLink}" alt="${file.name}">
                    <p>${file.name}</p>
                `;
                gallery.appendChild(item);
            });
        } else {
            gallery.innerHTML = '<p>No items stored yet.</p>';
        }
    }).catch(function(error) {
        console.error('Error fetching files:', error);
    });
}


window.onload = function() {
    initClient();
    displayStoredItems();
};
