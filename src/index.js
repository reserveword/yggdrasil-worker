let pubkey = "-----BEGIN PUBLIC KEY-----\nBase64==\n-----END PUBLIC KEY-----\n"

let metadata = {
	"skinDomains": [
	],
	"signaturePublickey": pubkey,
	"meta": {
		"implementationVersion": "20231005",
		"serverName": "Minecraft auth server",
		"implementationName": "yggdrasil-worker",
		"feature.non_email_login": false
	}
}

let users = {
	user1: { password: 'password', accessToken: 'asdfaigrjgb', clientToken: 'client', profile: '3c2106f05891d9d1e6149859fb005c83' },
	user2: { password: 'password', accessToken: 'asdfaigrjgb', clientToken: 'client' },
}

let profiles = {
	'3c2106f05891d9d1e6149859fb005c83': {
		id: '3c2106f05891d9d1e6149859fb005c83',
		name: 'user01'
	}
}

function success(body) {
	if (typeof body === 'object') body = JSON.stringify(body)
	if (body) {
		return new Response(body, {
			status: 200,
			headers: {
				'content-type': 'application/json; charset=utf-8',
			}
		})
	} else {
		return new Response(null, {status: 204})
	}
}


function fail(body, reason) {
	if (typeof body === Object) body = JSON.stringify(body)
	if (body) {
		return new Response(body, {
			status: reason ? reason : 400,
			headers: {
				'content-type': 'application/json; charset=utf-8',
			}
		})
	} else {
		return new Response(null, {status: reason ? reason : 400})
	}
}

function authFail() {
	return fail({ 'reason': 'auth failed' }, 403)
}

function notImpl() {
	return fail({ 'reason': 'not implemented' }, 500)
}

function findUser(data) {
	for (const username in users) {
		const user = users[username]
		if (data.accessToken === user.accessToken) {
			return user
		}
		return undefined
	}
}

function index() {
	return success(metadata)
}

function authenticate(data) {
	if (users[data.username].password === data.password) {
		let token = crypto.randomUUID().replaceAll('-', '')
		users[data.username].accessToken = token
		users[data.username].clientToken = data.clientToken
		return success({
			accessToken: token,
			clientToken: data.clientToken,
			availableProfiles: [profiles[users[data.username].profile]],
			selectedProfile: profiles[users[data.username].profile],
			user: {
				id: users[data.username].profile,
				properties: []
			}
		})
	}
	return authFail()
}

function refresh(data) {
	let user = findUser(data)
	if (user === undefined) {
		return authFail()
	}
	let token = crypto.randomUUID().replaceAll('-', '')
	console.log(JSON.stringify(data));
	console.log(JSON.stringify(users));
	user.accessToken = token
	user.clientToken = data.clientToken
	return success({
		accessToken: token,
		clientToken: data.clientToken,
		availableProfiles: [user.profile],
		user: {id: user.profile, properties: []}
	})
}

function validate(data) {
	let user = findUser(data)
	if (user === undefined) {
		return authFail()
	}
	return success()
}

function invalidate(data) {
	return notImpl()
}

function signout(data) {
	if (users[data.username].password === data.password) {
		let token = crypto.randomUUID().replaceAll('-', '')
		users[data.username].accessToken = token
		users[data.username].clientToken = crypto.randomUUID().replaceAll('-', '')
		return success()
	}
	return authFail()
}

function joinServer(data, ip) {
	let user = findUser(data)
	if (user === undefined) {
		return authFail()
	}
	user.recentTime = new Date().getTime()
	// user.ip = ip
	// user.serverId = data.serverId
	return success()
}

function hasJoined(data) {
	for (const username in users) {
		const user = users[username]
		if (data.username === profiles[user.profile].name
			&& new Date().getTime() - user.recentTime < 30 * 1000) { // 30s
			return success(profiles[user.profile])
		}
	}
	return authFail()
}

function profile(uuid) {
	uuid = uuid.toLowerCase()
	let profile = profiles[uuid]
	if (profile === undefined) return fail({ reason: 'not found' }, 404)
	return success(profiles[uuid])
}

export default {
	async fetch(request, env, ctx) {
		let url = new URL(request.url);
		let prefix = url.pathname;
		if (url.pathname === '/') return index()
		if (url.pathname === '/authserver/authenticate') return authenticate(await request.json())
		if (url.pathname === '/authserver/refresh') return refresh(await request.json())
		if (url.pathname === '/authserver/validate') return validate(await request.json())
		if (url.pathname === '/authserver/invalidate') return invalidate(await request.json())
		if (url.pathname === '/authserver/signout') return signout(await request.json())
		if (url.pathname === '/sessionserver/session/minecraft/join') return joinServer(await request.json())
		if (url.pathname.slice(0, 42) === '/sessionserver/session/minecraft/hasJoined') {
			return hasJoined(await request.json())
		}
		if (url.pathname.slice(0, 24) === '/api/profiles/minecraft/') {
			return profile(url.pathname.slice(24))
		}
		return success({users: users, profiles: profiles})
		return notImpl()
	},
};