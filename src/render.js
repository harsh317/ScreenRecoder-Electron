const { desktopCapturer } = require('electron');
const remote = require('electron').remote
const { ipcRenderer } = require('electron')
const { Menu, dialog } = remote
const { writeFile } = require('fs');
const videoElem = document.querySelector('video')
const startbtn = document.getElementById('startBtn')
const errorDialog = (title, message, detail) => {
    return {
        type: 'error',
        buttons: ['OK'],
        title: title,
        message: message,
        detail: detail,
    };
}
startbtn.onclick = e => {
    if (typeof mediaRecorder == 'undefined') {
        dialog.showMessageBox(null, errorDialog('Select Source', 'Please Select a souce', 'and then press start'))
    } else {
        startBtn.classList.add('is-danger');
        startBtn.innerText = 'Recording';
        ipcRenderer.send('Unhide', 'hide')
        mediaRecorder.start();
    }
};

const stopbtn = document.getElementById('stopBtn')
stopbtn.onclick = e => {
    if (typeof mediaRecorder == 'undefined') {
        dialog.showMessageBox(null, errorDialog('Press Stop after Start ', 'Start recording', 'and then press Stop'))
    } else {
        startBtn.classList.remove('is-danger');
        startBtn.innerText = 'Start';
        mediaRecorder.stop();
    }
};

ipcRenderer.on('stopRecoding', function() {
    stopbtn.click()
})

const sourcebtn = document.getElementById('videoSelectBtn')
let mediaRecorder
const recordedChunks = []
sourcebtn.onclick = getVideoSources

async function getVideoSources() {
    const allsources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    })
    const videoOptions = Menu.buildFromTemplate(
        allsources.map(sources => {
            console.log(sources.name)
            return {
                label: sources.name,
                click: () => selectSource(sources)
            }
        })
    )

    videoOptions.popup();
}


async function selectSource(source) {
    sourcebtn.innerText = source.name
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElem.srcObject = stream
    videoElem.play()
    ipcRenderer.send('Unhide', 'Unhide')

    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
    console.log('video data available');
    recordedChunks.push(e.data);
}

async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    });
    const buffer = new Buffer.from(await blob.arrayBuffer())
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save',
        defaultPath: `Recording-${Date.now()}.webm`
    })
    writeFile(filePath, buffer, () => {
        console.log('success')
    })
    recordedChunks = []
}