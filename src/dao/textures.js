export function getTexture(env, id) {
	return env.DB.prepare('select texture from textures where id = ?').bind(id).first('texture')
}

export function createTexture(env, id, texture) {
	return env.DB.prepare('insert into textures values (?,?)').bind(id, texture).run()
}

export function deleteTexture(env, id) {
	return env.DB.prepare('delete from textures where id = ?').bind(id).run()
}
