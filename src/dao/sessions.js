export function getSessionById(env, serverId, column) {
    const timestamp = new Date().getTime() - 30*1000 // 30s ago
	return env.DB.prepare('select * from sessions where server_id = ? and timestamp > ?').bind(serverId, timestamp).first(column)
}

export function addSession(env, serverId, username, ip) {
    timestamp = new Date().getTime()
    expireTimestamp = timestamp - 30 * 1000 // 30s ago
    cleanSession(expireTimestamp) // will execute later anyway
    return env.DB.prepare('insert into sessions values (?,?,?,?)').bind(serverId, username, ip, timestamp)
}

export function cleanSession(env, timestamp) {
    return env.DB.prepare('delete from sessions where timestamp < ?').bind(timestamp).run()
}