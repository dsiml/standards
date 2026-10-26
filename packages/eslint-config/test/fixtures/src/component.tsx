import { useState } from 'react'

export function Counter({ visible }: { visible: boolean }) {
	if (!visible) return null
	const [count] = useState(0)
	return <p>{count}</p>
}
