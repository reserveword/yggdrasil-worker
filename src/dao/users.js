// getters

export function getUserById(env, id) {
    return env.DB.prepare('select * from users where id = ?').bind(id).first()
}

export function getUserByUsername(env, username) {
    return env.DB.prepare('select * from users where username = ?').bind(username).first()
}

export function getUserByAccessToken(env, accessToken) {
    const timestamp = new Date().getTime() - 30*24*60*60*1000 // one month ago
    return env.DB.prepare('select * from users where access_token = ? and timestamp > ?').bind(accessToken, timestamp).first()
}

export function getUserByProfile(env, profile) {
    return env.DB.prepare('select * from users where profile = ?').bind(profile).first()
}

export async function getUsers(env) {
    const { results } = await env.DB.prepare('select * from users').all()
    return results
}

// setters

export function setUserToken(env, user) {
    user.access_token = crypto.randomUUID().replaceAll('-', '')
    const timestamp = new Date().getTime()
    return env.DB.prepare('update users set access_token = ?, client_token = ?, timestamp = ? where id = ?').bind(user.access_token, user.client_token, timestamp, user.id).run()
}

export async function createUser(env, username, password, profile) {
    const id = crypto.randomUUID().replaceAll('-', '')
    if (await getUserByUsername(env, username) !== null) {
        return {success: false}
    }
    return env.DB.prepare('insert into users (id, username, password, profile) values (?,?,?,?)').bind(id, username, password, profile).run()
}

export function updateUser(env, id, username, password) {
    return env.DB.prepare('update users set username = ?, password = ?, access_token = ?, client_token = ? where id = ?').bind(username, password, '', '', id).run()
}