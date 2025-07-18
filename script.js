console.log("let's start writing JavaScript!!!");
let currentSong = new Audio();
let songs;
let currFolder;

let playlistFolders = [
    "folder1",
    "folder2",
    "folder3",
    "folder4",
    "folder5",
    "folder6",
    "folder7",
    "folder8",
    "folder9",
    "folder10"
];


function getNextFolder(current) {
    let i = playlistFolders.indexOf(current);
    return i !== -1 && i < playlistFolders.length - 1 ? playlistFolders[i + 1] : null;
}


async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`/${folder}/songs.json`);
        songs = await response.json();
    } catch (e) {
        console.error("Error loading songs.json", e);
        songs = [];
    }

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `<li class="flex bg" data-filename="${song.name}">
            <img class="invert" width="34" src="svg/music.svg" alt="">
            <div class="info">
                <div>${song.displayName}</div>
                <div>${song.origin}</div>
            </div>
            <div class="playnow">
                <span class="playNow" >Play Now</span>
                <img class="ply" src="svg/play3.svg" alt="">
            </div>
        </li>`;
    }

    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            const filename = e.getAttribute("data-filename");
            console.log("Playing:", filename);
            playMusic(filename);
        });
    });
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const playMusic = (track, pause = false) => {
    //console.log(songs);
    currentSong.src = `/${currFolder}/` + encodeURIComponent(track);

    const song = songs.find(s => s.name === track);
    const displayName = song?.displayName || track.split("-")[1]?.replace(".mp3", "") || track;
    const artist = song?.origin || "Unknown Artist";

    if (!pause) {
        currentSong.play().catch(e => console.error("Play failed:", e));
        play.src = "svg/Pause.svg";
    }
    document.querySelector(".songInfo").innerHTML = track.split("-")[1].replace(".mp3", "");
    document.querySelector(".songTime").innerHTML = "00:00";

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: displayName,
            artist: artist,
            album: "Web Player",
            artwork: [
                { src: 'favicon-new.png', sizes: '96x96', type: 'image/png' },
                { src: 'favicon-new.png', sizes: '128x128', type: 'image/png' },
                { src: 'favicon-new.png', sizes: '192x192', type: 'image/png' },
                { src: 'favicon-new.png', sizes: '256x256', type: 'image/png' }
            ]
        });


        navigator.mediaSession.setActionHandler("nexttrack", () => {
            next.click();
        });

        navigator.mediaSession.setActionHandler("previoustrack", () => {
            previous.click();
        });
    }
};

async function main() {
    await getSongs("songs/folder1");
    if (songs.length > 0) {
        playMusic(songs[0].name, true);
    }

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "svg/pause.svg";
        } else {
            currentSong.pause();
            play.src = "svg/play2.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songTime").innerHTML = `${formatTime(currentSong.currentTime)}/${formatTime(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = 0;
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        let currentFile = decodeURIComponent(currentSong.src.split(`${currFolder}/`).pop());
        let index = songs.findIndex(song => song.name === currentFile);
        if (index > 0) playMusic(songs[index - 1].name);
    });

    next.addEventListener("click", () => {
        let currentFile = decodeURIComponent(currentSong.src.split(`${currFolder}/`).pop());
        let index = songs.findIndex(song => song.name === currentFile);
        if (index < songs.length - 1) playMusic(songs[index + 1].name);
    });

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            let folder = `songs/${item.currentTarget.dataset.folder}`;
            await getSongs(folder);
            if (songs.length > 0) {
                playMusic(songs[0].name, false);
            }
        });
    });

    currentSong.addEventListener("ended", async () => {
        let currentFile = decodeURIComponent(currentSong.src.split(`${currFolder}/`).pop());
        let index = songs.findIndex(song => song.name === currentFile);

        if (index < songs.length - 1) {
            // Play next song in current folder
            playMusic(songs[index + 1].name);
        } else {
            let folderName = currFolder.split("/").pop();
            let nextFolder = getNextFolder(folderName);
            if (nextFolder) {
                let fullPath = `songs/${nextFolder}`;
                await getSongs(fullPath);
                if (songs.length > 0) {
                    playMusic(songs[0].name);
                }
            } else {
                console.log("All playlists finished.");
                await getSongs("songs/folder1");
                playMusic(songs[0].name);
            }
        }
    });
}


main();
