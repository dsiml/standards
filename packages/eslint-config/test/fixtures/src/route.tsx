export function loader(): never {
	throw new Response('Not found', { status: 404 })
}
