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

async function getUserData() {
  const response = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: "Bearer " + currentToken.access_token },
  });
  return await response.json();
}

function goToPartTwo() {
  document.querySelector("#part_two").scrollIntoView();
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

  if (!response.ok) {
    console.log(await response.body());
  }
  return await response.json();
}

// this function assembles the track name, energy and valence values of the track into the scatter chart data structure
function assembleChartData(name, audioFeature) {
  const boiType = getBoyType(audioFeature.valence, audioFeature.energy);
  return {
    label: name,
    data: [
      {
        x: audioFeature.valence,
        y: audioFeature.energy,
      },
    ],
    backgroundColor: pointBackgroundColor[boiType],
    boiType, // idk what this does
  };
}

// labelling the quadrants
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

// merging the arrays from Spotify API to create the chart data
function processChartData(tracks, audioFeatures) {
  const output = [];
  for (let i = 0; i < tracks.length; i++) {
    output.push(assembleChartData(tracks[i].name, audioFeatures[i]));
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
  console.log(count);
  return topNumberBoi;
}

async function debug() {
  // If we have a token, we're logged in, so fetch user data and render logged in template
  if (currentToken.access_token) {
    const userData = await getUserData(); //calling the API
    const element = document.querySelector("#test_user");
    element.innerHTML = JSON.stringify(userData, null, 2);
    const userPlaylistData = await getUserPlaylist();
    //Playlist(userPlaylistData.items);
  }
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
    injectTracks(playlistItems.items); // prints playlist items onto screen, for debugging
    const tracks = playlistItems.items
      // "Get Several Tracks' Audio Features" only takes in 100 songs
      .slice(0, 100)
      // creates a new array to populate it with a list of track names and its corresponding track IDs
      .map((i) => ({ name: i.track.name, id: i.track.id }));
    const audioFeatureResponse = await getTracksAudioFeatures(
      tracks.map((i) => i.id).join(",")
    );
    injectAudioFeatures(audioFeatureResponse.audio_features);
    const processedData = processChartData(
      tracks,
      audioFeatureResponse.audio_features
    );

    const topBoi = getTopBoi(processedData);
    injectTopNumberBoi(getTopBoi(processedData));

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
          display: false,
        },
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", async (event) => {
  setupChart();
  const hasAuthCode = await checkForAuthCode();
  if (hasAuthCode) {
    showDownArrow();
  }
  // debug();
});
