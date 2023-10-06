async function userLogin() {
    const user = await fetch('/authserver/authenticate', {
        method: 'POST',
        body: JSON.stringify({
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
        })
    }).then(x=>x.json())
    document.getElementById('access-token').value = user.accessToken
    try {
        if (user.accessToken.length > 0) document.getElementById('login-state').textContent = '已登录'
    } catch(_) {
        document.getElementById('login-state').textContent = '未登录'
    }
}

async function updateUser() {
    const user = await fetch('/users/update', {
        method: 'POST',
        body: JSON.stringify({
            accessToken: document.getElementById('access-token').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            name: document.getElementById('character').value,
        })
    })
}

async function uploadSkin() {
    const skin = await document.getElementById('skin').files[0].arrayBuffer()
    const b64skin = btoa(String.fromCharCode(...new Uint8Array(skin)))
    const result = await fetch('/users/skin', {
        method: 'POST',
        body: JSON.stringify({
            accessToken: document.getElementById('access-token').value,
            texture: b64skin,
        })
    })
}

function buildRow(...data) {
    const tr = document.createElement('tr')
    for (const val of data) {
        const td = document.createElement('td')
        td.append(val)
        tr.append(td)
    }
    return tr
}

function extendRow(tr, ...data) {
    for (const val of data) {
        const td = document.createElement('td')
        td.append(val)
        tr.append(td)
    }
    return tr
}

async function listUser() {
    const users = await fetch('/users/list', {
        method: 'POST',
        body: JSON.stringify({
            token: document.getElementById('admin-token').value,
        })
    }).then(x=>x.json())
    const userList = document.getElementById('user-list')
    userList.innerHTML = ''
    for (const user of users) {
        const tr = buildRow(user.id, user.username, user.password, user.profile)
        userList.append(tr)
        fetch('/api/profiles/minecraft/' + user.profile)
        .then(x=>x.json())
        .then(x=> {
            if (x.properties) {
                extendRow(tr, x.name, atob(x.properties[0].value))
            } else {
                extendRow(tr, x.name)
            }
        })
    }
}

async function createUser() {
    const user = await fetch('/users/create', {
        method: 'POST',
        body: JSON.stringify({
            token: document.getElementById('admin-token').value,
            username: document.getElementById('admin-username').value,
            password: document.getElementById('admin-password').value,
            name: document.getElementById('admin-character').value,
        })
    }).then(x=>x.json())
}