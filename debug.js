function injectPlaylist(list) {
  console.log(list);
  const target = document.querySelector("#test_user_playlist"); // selects the HTML element that has the ID #locations
  target.innerHTML = "";
  list.forEach((item) => {
    const htmlToAdd = `<li>${item.name}, ${item.id} </li>`;
    target.innerHTML += htmlToAdd; // for every list item, i add an htmlToAdd
  });
}

function injectTracks(list) {
  const target = document.querySelector("#tracklist");
  target.innerHTML = "";
  list.forEach((item) => {
    // for each item in my list,
    const htmlToAdd = `<li>${item.track.name}, ${item.track.id} </li>`;
    target.innerHTML += htmlToAdd; // for every list item, i add an htmlToAdd
  });
}

function injectAudioFeatures(list) {
  const target = document.querySelector("#track_features");
  target.innerHTML = "";
  list.forEach((item) => {
    // for each item in my list,
    const htmlToAdd = `<li>${item.id}, ${item.energy}, ${item.valence} </li>`;
    target.innerHTML += htmlToAdd; // for every list item, i add an htmlToAdd
  });
}

function injectTopNumberBoi(boiType) {
  const target = document.querySelector("#top_number_boi");
  target.innerHTML = boiType;
}
