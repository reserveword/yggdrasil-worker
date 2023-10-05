function response(body, status) {
	if (typeof body === 'object') body = JSON.stringify(body)
	if (body) {
		return new Response(body, {
			status: status,
			headers: {
				'content-type': 'application/json; charset=utf-8',
			}
		})
	} else {
		return new Response(null, { status: status })
	}
}

export function success(body) {
	return response(body, body ? 200 : 204)
}


export function fail(body, status) {
	return response(body, status ? status : 400)
}

export function authFail() {
	return fail({ 'reason': 'auth failed' }, 403)
}

export function notImpl() {
	return fail({ 'reason': 'not implemented' }, 500)
}
