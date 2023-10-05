const users = require('./dao/users.js')
const profiles = require('./dao/profiles.js')
const sessions = require('./dao/sessions.js')
const textures = require('./dao/textures.js')

const response = require('./response.js')
const png = require('./png.js')

let metadata = undefined

async function checkAuth(env, data) {
	if (!data.token === env.ADMIN_TOKEN) {
		return await users.getUserByAccessToken(env, data.accessToken)
	} else {
		return await users.getUserByUsername(env, data.username)
	}
}

async function index(env) {
	if (metadata === undefined) {
		metadata = {
			skinDomains: env.SKIN_DOMAINS,
			signaturePublickey: env.PUBKEY,
			meta: {
				implementationVersion: env.VERSION,
				serverName: env.SERVER_NAME,
				implementationName: "yggdrasil-worker",
				"feature.non_email_login": false
			}
		}
	}
	return response.success(metadata)
}

async function authenticate(env, data) {
	const user = await users.getUserByUsername(env, data.username)
	if (user.password !== data.password) {
		return response.authFail()
	}
	user.clientToken = data.clientToken
	users.setUserToken(env, user)
	const profile = await profiles.getProfile(env, user.profile)
	return response.success({
		accessToken: user.accessToken,
		clientToken: user.clientToken,
		availableProfiles: [profile],
		selectedProfile: profile,
		user: { id: user.id, properties: [] }
	})
}

async function refresh(env, data) {
	const user = await users.getUserByAccessToken(env, data.accessToken)
	if (user === null) {
		return response.authFail()
	}
	user.clientToken = data.clientToken
	users.setUserToken(env, user)
	const profile = await profiles.getProfile(env, user.profile)
	return response.success({
		accessToken: user.accessToken,
		clientToken: user.clientToken,
		availableProfiles: [profile],
		user: { id: user.id, properties: [] }
	})
}

async function validate(env, data) {
	const user = await users.getUserByAccessToken(env, data.accessToken)
	if (user === null) {
		return response.authFail()
	}
	return response.success()
}

async function invalidate(env, data) {
	return response.notImpl()
}

async function signout(env, data) {
	const user = await users.getUserByUsername(env, data.username)
	if (user.password !== data.password) {
		return response.authFail()
	}
	user.clientToken = ''
	users.setUserToken(env, user)
	return response.authFail()
}

async function joinServer(env, data, ip) {
	const user = await users.getUserByAccessToken(env, data.accessToken)
	if (user === null) {
		return response.authFail()
	}
	sessions.addSession(env, data.serverId, user.username, ip)
	return response.success()
}

function hasJoinedOfficial(data) {
	let url = new URL('api.mojang.com/sessionserver/session/minecraft/hasJoined')
	for (const [key, value] of data) {
		url.searchParams.append(key, value)
	}
	return fetch(url)
}

async function hasJoined(env, data) {
	const session = await sessions.getSessionById(env, data.serverId)
	if (session === null) return hasJoinedOfficial(data)
	const profile = await profiles.getProfileByName(env, session.username)
	if (session === null) return hasJoinedOfficial(data)
	return response.success(profile)
}

async function profile(env, uuid) {
	const profile = await profiles.getProfile(env, uuid)
	if (profile === null) return response.fail({ reason: 'not found' }, 404)
	return response.success(profile)
}

async function texture(env, uuid) {
	const texture = await textures.getTexture(env, uuid)
	return new Response(texture, {
		status: 200,
		headers: {
			'content-type': 'image/png'
		}
	})
}

async function createUser(env, data) {
	if (!data.token === env.ADMIN_TOKEN) return response.authFail()
	const profileId = crypto.randomUUID().replaceAll('-', '')
	const userResult = await users.createUser(env, data.username, datapassword, profileId)
	if (!userResult.success) return response.fail({ reason: 'failed' })
	const profileResult = await profiles.createProfile(env, profileId, data.name)
	if (!profileResult.success) return response.fail({ reason: 'failed' })
	return response.success()
}

async function updateUser(env, data) {
	const user = await checkAuth(env, data)
	const userResult = await users.updateUser(env, user.id, data.username, datapassword)
	if (!userResult.success) return response.fail({ reason: 'failed' })
	const profileResult = await profiles.updateProfile(env, user.profile, data.name)
	if (!profileResult.success) return response.fail({ reason: 'failed' })
	return response.success()
}

async function listUser(env, data) {
	if (!data.token === env.ADMIN_TOKEN) return response.authFail()
	return response.success(await users.getUsers(env))
}

async function uploadSkin(env, data, host) {
	const user = await checkAuth(env, data)
	const profile = await profiles.getRawProfile(env, user.profile)
	let jsonTexture
	try {
		jsonTexture = JSON.parse(atob(profile.texture))
	} catch (_) {
		jsonTexture = {
			profileId: profile.id,
			profileName: profile.name,
			textures: {}
		}
	}
	if (jsonTexture.SKIN !== undefined) {
		const skinId = jsonTexture.SKIN.url.slice(-32)
		const delResult = await textures.deleteTexture(env, skinId)
		if (!delResult.success) return response.fail({ reason: 'failed' })
	}
	const {image, digest} = await png.processPng(data.texture)
	jsonTexture.timestamp = new Date().getTime()
	jsonTexture.textures.SKIN = {
		url: host + '/textures/' + digest,
		metadata: {
			model: data.model
		}
	}
	const result = await profiles.updateTexture(env, user.profile, btoa(JSON.stringify(jsonTexture)))
	if (!result.success) return response.fail({ reason: 'failed' })
	const updResult = await textures.createTexture(env, digest, image)
	if (!updResult.success) return response.fail({ reason: 'failed' })
	return response.success()
}

async function uploadCape(env, data) {
	let user
	if (!data.token === env.ADMIN_TOKEN) {
		let user = await users.getUserByAccessToken(env, data.accessToken)
	} else {
		let user = await users.getUserByUsername(env, data.username)
	}
	return response.notImpl()
}

export default {
	async fetch(request, env, ctx) {
		let url = new URL(request.url);
		// basic auth server api
		// status
		if (url.pathname === '/') return await index(env)
		// auth
		if (url.pathname === '/authserver/authenticate') return await authenticate(env, request.json())
		if (url.pathname === '/authserver/refresh') return await refresh(env, request.json())
		if (url.pathname === '/authserver/validate') return await validate(env, request.json())
		if (url.pathname === '/authserver/invalidate') return await invalidate(env, request.json())
		if (url.pathname === '/authserver/signout') return await signout(env, request.json())
		// session
		if (url.pathname === '/sessionserver/session/minecraft/join') return await joinServer(env, request.json(), request.ip)
		if (url.pathname.slice(0, 42) === '/sessionserver/session/minecraft/hasJoined') {
			return await hasJoined(env, url.searchParams)
		}
		// profile
		if (url.pathname.slice(0, 24) === '/api/profiles/minecraft/') {
			return await profile(env, url.pathname.slice(24))
		}
		// texture
		if (url.pathname.slice(0, 10) === '/textures/') {
			return await texture(env, url.pathname.slice(10))
		}
		// extend edit api
		// check env admin_token, in case token is empty
		if (env.ADMIN_TOKEN.length < 32) return response.fail({reason: 'server error'})
		// user-profile
		if (url.pathname === '/users/create') return await createUser(env, request.json())
		if (url.pathname === '/users/update') return await updateUser(env, request.json())
		if (url.pathname === '/users/list') return await listUser(env, request.json())
		// texture
		if (url.pathname === '/users/skin') return await uploadSkin(env, request.json(), url.host)
		if (url.pathname === '/users/cape') return await uploadCape(env, request.json())

		return response.notImpl()
	},
};