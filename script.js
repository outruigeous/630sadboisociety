// selects the form
const form = document.querySelector(".main_form");

// selects the link input that contains the playlist URL
const playlistURL = document.querySelector("#link");

// Holds the chart object so we can update it when we have the data.
let chart = null;

const xDivider = 0.5;
const yDivider = 0.5;

function showDownArrow() {
  const loginContainer = document.querySelector(".login_spotify");
  const downArrowContainer = document.querySelector(".show_down_arrow");

  loginContainer.style.display = "none";
  downArrowContainer.style.display = "flex";
}

// debugging
async function getUserData() {
  const response = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: "Bearer " + currentToken.access_token },
  });
  return await response.json();
}

async function getUserPlaylist() {
  const response = await fetch(
    "https://api.spotify.com/v1/me/playlists?limit=20",
    {
      method: "GET",
      headers: { Authorization: "Bearer " + currentToken.access_token },
    }
  );

  return await response.json();
}

// navigation

function goToPartTwo() {
  document.querySelector("#part_two").scrollIntoView();
}

async function getPlaylistItems(playlistID) {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistID}/tracks`,
    {
      method: "GET",
      headers: { Authorization: "Bearer " + currentToken.access_token },
    }
  );

  return await response.json();
}

async function getTracksAudioFeatures(something) {
  const response = await fetch(
    `https://api.spotify.com/v1/audio-features?ids=${something}`,
    {
      method: "GET",
      headers: { Authorization: "Bearer " + currentToken.access_token },
    }
  );

  return await response.json();
}

// categorizing data from spotify
function getBoyType(x, y) {
  if (x <= xDivider) {
    // left side
    if (y <= yDivider) {
      // bottom left
      return "sadboi";
    } else {
      // top left
      return "angryboi";
    }
  } else {
    // right side
    if (y <= yDivider) {
      // bottom right
      return "chillboi";
    } else {
      // top right
      return "hyperboi";
    }
  }
}

const pointBackgroundColor = {
  sadboi: "rgb(113,148,152)",
  angryboi: "rgb(164,3,31)",
  chillboi: "rgb(103,141,88)",
  hyperboi: "rgb(249,137,72)",
};

// this function assembles the track name, energy and valence values of the track into the scatter chart data structure
function assembleChartData(name, audioFeature, artist) {
  const boiType = getBoyType(audioFeature.valence, audioFeature.energy);
  return {
    label: name,
    artist,
    data: [
      {
        x: audioFeature.valence,
        y: audioFeature.energy,
      },
    ],
    backgroundColor: pointBackgroundColor[boiType],
    boiType,
  };
}

// merging the arrays from Spotify API to create the chart data
function processChartData(tracks, audioFeatures) {
  const output = [];
  for (let i = 0; i < tracks.length; i++) {
    output.push(
      assembleChartData(tracks[i].name, audioFeatures[i], tracks[i].artist)
    );
  }
  return output;
}

function drawChart(processedData) {
  console.log(chart.data);
  chart.data.datasets = processedData;
  chart.update();
  console.log("Updated chart!");
}

// Returns the boiType that appears the most in Scatter graph

function getTopBoi(data) {
  const count = {
    chillboi: 0,
    angryboi: 0,
    hyperboi: 0,
    sadboi: 0,
  };
  for (let eachDataPoint of data) {
    count[eachDataPoint.boiType] += 1;
  }
  let bois = Object.keys(count);
  let topNumberBoi = bois[0];
  for (let eachBoi of bois) {
    if (count[topNumberBoi] < count[eachBoi]) {
      topNumberBoi = eachBoi;
    }
  }
  return topNumberBoi;
}

function injectAngryBoiTracks(list) {
  const target = document.querySelector("#angryboi_tracks");
  target.innerHTML = "";
  list.forEach((item) => {
    // for each item in my list,
    const htmlToAdd = `<li>${item.label}</li>`;
    target.innerHTML += htmlToAdd; // for every list item, i add an htmlToAdd
  });
}

function injectTracks(processedData) {
  const angryBoiSongs = processedData.filter((d) => d.boiType === "angryboi");
  const chillBoiSongs = processedData.filter((d) => d.boiType === "chillboi");
  const hyperBoiSongs = processedData.filter((d) => d.boiType === "hyperboi");
  const sadBoiSongs = processedData.filter((d) => d.boiType === "sadboi");

  const angryBoiDiv = document.querySelector("#angryboi_tracks");
  angryBoiDiv.innerHTML = "";
  angryBoiSongs.forEach((item) => {
    const htmlToAdd = `<li>${item.label}, ${item.artist}</li>`;
    angryBoiDiv.innerHTML += htmlToAdd;
  });
  const chillBoiDiv = document.querySelector("#chillboi_tracks");
  chillBoiDiv.innerHTML = "";
  chillBoiSongs.forEach((item) => {
    const htmlToAdd = `<li>${item.label}, ${item.artist}</li>`;
    chillBoiDiv.innerHTML += htmlToAdd;
  });
  const hyperBoiDiv = document.querySelector("#hyperboi_tracks");
  hyperBoiDiv.innerHTML = "";
  hyperBoiSongs.forEach((item) => {
    const htmlToAdd = `<li>${item.label}, ${item.artist}</li>`;
    hyperBoiDiv.innerHTML += htmlToAdd;
  });
  const sadBoiDiv = document.querySelector("#sadboi_tracks");
  sadBoiDiv.innerHTML = "";
  sadBoiSongs.forEach((item) => {
    const htmlToAdd = `<li>${item.label}, ${item.artist}</li>`;
    sadBoiDiv.innerHTML += htmlToAdd;
  });
}

form.addEventListener("submit", async (submitEvent) => {
  submitEvent.preventDefault(); // to prevent a redirect
  const linkValue = playlistURL.value;

  //pulls playlist ID out of the link
  const playlistID = linkValue.replace(
    "https://open.spotify.com/playlist/",
    ""
  );
  try {
    const playlistItems = await getPlaylistItems(playlistID);
    console.log(playlistItems);
    // injectTracks(playlistItems.items); // prints playlist items onto screen, for debugging
    const tracks = playlistItems.items
      // "Get Several Tracks' Audio Features" only takes in 100 songs
      .slice(0, 100)
      // creates a new array to populate it with a list of track names and its corresponding track IDs
      .map((i) => ({
        name: i.track.name,
        id: i.track.id,
        artist: i.track.artists[0].name,
      }));
    const audioFeatureResponse = await getTracksAudioFeatures(
      tracks.map((i) => i.id).join(",")
    );
    // injectAudioFeatures(audioFeatureResponse.audio_features);
    const processedData = processChartData(
      tracks,
      audioFeatureResponse.audio_features
    );

    const topBoi = getTopBoi(processedData);
    // injectTopNumberBoi(getTopBoi(processedData));

    const angryBoiBadge = document.querySelector("#angryboi_results");
    const chillBoiBadge = document.querySelector("#chillboi_results");
    const hyperBoiBadge = document.querySelector("#hyperboi_results");
    const sadBoiBadge = document.querySelector("#sadboi_results");
    //resets everything to not show
    [angryBoiBadge, chillBoiBadge, hyperBoiBadge, sadBoiBadge].map(
      (badge) => (badge.style.display = "none")
    );

    if (topBoi === "angryboi") {
      angryBoiBadge.style.display = "flex";
    } else if (topBoi === "chillboi") {
      chillBoiBadge.style.display = "flex";
    } else if (topBoi === "hyperboi") {
      hyperBoiBadge.style.display = "flex";
    } else {
      sadBoiBadge.style.display = "flex";
    }

    const partThreeContainer = document.querySelector("#part_three");

    partThreeContainer.style.display = "flex";
    drawChart(processedData);
    injectTracks(processedData);

    partThreeContainer.scrollIntoView();
    chart.resize();
  } catch (e) {
    console.log(e);
  }
});

async function setupChart() {
  const ctx = document.querySelector("#chart");

  chart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [],
    },
    options: {
      elements: {
        point: {
          radius: 5,
          hoverRadius: 8,
        },
      },
      scale: {
        x: { min: 0, max: 1 },
        y: { min: 0, max: 1 },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.raw.name;
            },
          },
        },
        annotation: {
          annotations: {
            line1: {
              type: "line",
              xMin: xDivider,
              xMax: xDivider,
              borderColor: "rgb(0, 0, 0)",
              borderWidth: 2,
            },
            line2: {
              type: "line",
              yMin: yDivider,
              yMax: yDivider,
              borderColor: "rgb(0, 0, 0)",
              borderWidth: 2,
            },
          },
        },
        legend: {
          display: true,
          labels: {
            color: "#FBF8DE",
            font: {
              family: "Roboto Mono",
              size: 12,
              weight: 300,
            },
            letterSpacing: 4,
          },
        },
      },
    },
  });
  chart.data.datasets = [
    {
      label: "angryboi", // Label for angryboi
      data: [], // Empty data array to be filled later
      backgroundColor: pointBackgroundColor["angryboi"],
    },
    {
      label: "sadboi", // Label for sadboi
      data: [], // Empty data array to be filled later
      backgroundColor: pointBackgroundColor["sadboi"],
    },
    {
      label: "chillboi", // Label for chillboi
      data: [], // Empty data array to be filled later
      backgroundColor: pointBackgroundColor["chillboi"],
    },
    {
      label: "hyperboi", // Label for hyperboi
      data: [], // Empty data array to be filled later
      backgroundColor: pointBackgroundColor["hyperboi"],
    },
  ];
}

async function drawChart(processedData) {
  console.log(chart.data);
  for (let dataset of chart.data.datasets) {
    dataset.data = [];
  }
  // Iterate over processedData and populate datasets with corresponding data points
  processedData.forEach((dataPoint) => {
    // Find the index of the dataset corresponding to the data point's boiType
    const datasetIndex = chart.data.datasets.findIndex(
      (dataset) => dataset.label === dataPoint.boiType
    );
    // Add the data point to the dataset
    chart.data.datasets[datasetIndex].data.push({
      name: dataPoint.label,
      x: dataPoint.data[0].x,
      y: dataPoint.data[0].y,
    });
  });
  chart.update();
  console.log("Updated chart!");
}

document.addEventListener("DOMContentLoaded", async (event) => {
  setupChart();
  const hasAuthCode = await checkForAuthCode();
  if (hasAuthCode) {
    showDownArrow();
  }
});
