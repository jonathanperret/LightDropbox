var form = document.getElementById('basic-form');
var dbx;

function parseHash() {
  var re = /(.*?)=([^\&]*)&?/gi;
  var ret = {};
  var match;
  while (match = re.exec(document.location.hash.slice(1))) {
    ret[match[1]] = decodeURIComponent(match[2]);
  }
  return ret;
}

var query = parseHash();

var filesList = document.getElementById('files');

dbx = new Dropbox.Dropbox({ accessToken: query.token, fetch: fetch });

function processHash() {
  query = parseHash();
  if (query.search) {
    searchFiles(query.path || '', query.search);
  } else {
    listFolder(query.path || '');
  }
}

processHash();

window.addEventListener('hashchange', processHash);

function listFolder(path) {
  dbx.filesListFolder({path: path})
    .then(function(response) {
      displayFiles(response.entries);
    })
    .catch(function(error) {
      console.error(error);
      alert(error.toString());
    });
}

var searchText = document.getElementById('search-text');
document.getElementById('search-form').addEventListener('submit', function(evt) {
  evt.preventDefault();
  location.hash = '#token=' + query.token + '&path=' + encodeURIComponent(query.path || '') + '&search=' + encodeURIComponent(searchText.value);
});
document.getElementById('search-reset').addEventListener('click', function() {
  location.hash = '#token=' + query.token + '&path=' + encodeURIComponent(query.path || '');
});

function searchFiles(path, query) {
  dbx.filesSearch({ path: path, query: query, mode: 'filename'})
  .then(function(response) {
    displayFiles(response.matches.map(function (match) { return match.metadata; }));
  });
}

function displayFiles(files) {
  filesList.innerHTML = '';
  for (var i = 0; i < files.length; i++) {
    var li = document.createElement('li');

    var a = document.createElement('a');
    var filetype = files[i]['.tag'];
    var filepath = files[i].path_lower;

    if (filetype === 'folder') {
      a.setAttribute('href', '#token=' + query.token + '&path=' + encodeURIComponent(filepath));
    } else {
      a.setAttribute('href', '#');
      a.setAttribute('target', '_blank');
      a.setAttribute('filepath', filepath);
    }

    a.appendChild(document.createTextNode(files[i].name + (filetype === 'folder' ? '/' : '')));

    li.appendChild(a);

    filesList.appendChild(li);
  }
}

filesList.addEventListener('click', function(evt) {
  var clicked = evt.srcElement;
  if (clicked) {
    var filepath = clicked.getAttribute('filepath');
    if (filepath) {
      evt.preventDefault();
      clicked.style.color = 'red';
      dbx.filesGetTemporaryLink({ path: filepath })
      .then(function(result) {
        clicked.style.color = 'green';
        clicked.setAttribute('href', result.link);
        clicked.removeAttribute('filepath');
      });
    }
  }
});
