// getters

export function getUserById(env, id, column) {
    return env.DB.prepare('select * from users where id = ?').bind(id).first(column)
}

export function getUserByUsername(env, username, column) {
    return env.DB.prepare('select * from users where username = ?').bind(username).first(column)
}

export function getUserByAccessToken(env, accessToken, column) {
    const timestamp = new Date().getTime() - 30*24*60*60*1000 // one month ago
    return env.DB.prepare('select * from users where access_token = ? and timestamp > ?').bind(accessToken, timestamp).first(column)
}

export function getUserByProfile(env, profile, column) {
    return env.DB.prepare('select * from users where profile = ?').bind(profile).first(column)
}

export async function getUsers(env) {
    const { results } = await env.DB.prepare('select * from users').bind(profile).all()
    return results
}

// setters

export function setUserToken(env, user) {
    user.accessToken = crypto.randomUUID().replaceAll('-', '')
    const timestamp = new Date().getTime()
    return env.DB.prepare('update users set access_token = ?, client_token = ?, timestamp = ? where id = ?').bind(user.accessToken, user.clientToken, timestamp, user.id).run()
}

export async function createUser(env, username, password, profile) {
    const id = crypto.randomUUID().replaceAll('-', '')
    if (await getUserByUsername(env, username) !== null) {
        return {success: false}
    }
    return env.DB.prepare('insert into users (id, username, password, profile) value (?,?,?,?)').bind(id, username, password, profile).run()
}

export function updateUser(env, id, username, password) {
    return env.DB.prepare('update users set username = ?, password = ?, access_token = ?, client_token = ? where id = ?').bind(username, password, '', '', id).run()
}