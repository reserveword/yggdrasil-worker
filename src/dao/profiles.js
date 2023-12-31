function buildProfile(profile) {
    // don't have texture
    if (!profile.textures) return {
        id: profile.id,
        name: profile.name
    }
    // have texture
    return {
        id: profile.id,
        name: profile.name,
        properties: [
            {
                name: 'textures',
                value: profile.textures
            }
        ]
    }
}

export async function getProfile(env, id) {
	const profile = await env.DB.prepare('select * from profiles where id = ?').bind(id).first()
    return buildProfile(profile)
}

export async function getRawProfile(env, id) {
	return await env.DB.prepare('select * from profiles where id = ?').bind(id).first()
}

export async function getProfileByName(env, name) {
	const profile = await env.DB.prepare('select * from profiles where name = ?').bind(name).first()
    if (profile == null) throw null
    return buildProfile(profile)
}

export function createProfile(env, id, name) {
    return env.DB.prepare('insert into profiles (id, name) values (?,?)').bind(id, name).run()
}

export function updateProfile(env, id, name) {
    return env.DB.prepare('update profiles set name = ? where id = ?').bind(name, id).run()
}

export async function updateTexture(env, id, texture) {
    return env.DB.prepare('update profiles set textures = ? where id = ?').bind(texture, id).run()
}