const APP_ID = '356e6d0957a4433f928ed983929e30bb'
const CHANNEL = sessionStorage.getItem('room')
const TOKEN = sessionStorage.getItem('token')
let UID = Number(sessionStorage.getItem('UID'))

let NAME = sessionStorage.getItem('name')

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })

let localTraks = []
let remoteUser = {}

let joinAndDisplayLocalStream = async () => {
    document.getElementById('room-name').innerText = CHANNEL
    client.on('user-published', habdleUserJoin)
    client.on('user-left', handleUserLeft)

    try {
        await client.join(APP_ID, CHANNEL, TOKEN, UID)
    } catch (err) {
        console.log(err)
        window.open('/', '_self')
    }


    localTraks = await AgoraRTC.createMicrophoneAndCameraTracks()

    let member = await createMemeber()

    let player = ` <div class="video-container" id="user-container-${UID}">
            <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
            <div class="video-player" id="user-${UID}"></div>
        </div>`
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

    localTraks[1].play(`user-${UID}`)

    await client.publish([localTraks[0], localTraks[1]])
}

let habdleUserJoin = async (user, mediaType) => {
    remoteUser[user.uid] = user
    await client.subscribe(user, mediaType)

    if (mediaType === 'video') {
        let player = document.getElementById(`user-container-${user.uid}`)
        if (player != null) {
            player.remove()
        }

        let member = await getMember(user)

        player = ` <div class="video-container" id="user-container-${user.uid}">
            <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
            <div class="video-player" id="user-${user.uid}"></div>
        </div>`
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
        user.videoTrack.play(`user-${user.uid}`)
    }

    if (mediaType === 'audio') {
        user.audioTrack.play()
    }
}

let handleUserLeft = async (user) => {
    delete remoteUser[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}


let leaveAndRemovelocalStream = async () => {
    for (let i = 0; i < localTraks.length; i++) {
        localTraks[i].stop()
        localTraks[i].close()

    }
    await client.leave()
    deleteMemeber()
    window.open('/', '_self')

}

let toggleCamera = async (e) => {
    if (localTraks[1].muted) {
        await localTraks[1].setMuted(false)
        e.target.style.backgroundColor = '#fff'

    } else {
        await localTraks[1].setMuted(true)
        e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
    }
}

let toggleMice = async (e) => {
    if (localTraks[0].muted) {
        await localTraks[0].setMuted(false)
        e.target.style.backgroundColor = '#fff'

    } else {
        await localTraks[0].setMuted(true)
        e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
    }
}

let createMemeber = async () => {
    let response = await fetch('/create_member/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'name': NAME,
            'room_name': CHANNEL,
            'UID': UID,
        })
    })

    let member = await response.json()
    return member
}

let getMember = async (user) => {
    let response = await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
    let member = await response.json()
    return member
}

let deleteMemeber = async () => {
    let response = await fetch('/delete_member/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'name': NAME,
            'room_name': CHANNEL,
            'UID': UID,
        })
    })

    let member = await response.json()

}



joinAndDisplayLocalStream()
window.addEventListener('beforeunload', deleteMemeber)
document.getElementById('leave-btn').addEventListener('click', leaveAndRemovelocalStream)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMice)