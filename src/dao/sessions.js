export function getSessionById(env, serverId) {
    const timestamp = new Date().getTime() - 30*1000 // 30s ago
	const result = env.DB.prepare('select * from sessions where server_id = ? and timestamp > ?').bind(serverId, timestamp).first()
    if (result === null) throw null
    return result
}

export function addSession(env, serverId, username, ip) {
    const timestamp = new Date().getTime()
    const expireTimestamp = timestamp - 30 * 1000 // 30s ago
    cleanSession(env, expireTimestamp) // will execute later anyway
    return env.DB.prepare('insert into sessions values (?,?,?,?)').bind(serverId, username, ip, timestamp).run()
}

export function cleanSession(env, timestamp) {
    return env.DB.prepare('delete from sessions where timestamp < ?').bind(timestamp).run()
}