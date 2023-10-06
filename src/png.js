import { ChunkType, pngWriteTEXT, pngRead, pngWrite } from 'png-rw'

export async function processPng(b64Png, characterId) {
    const chunks = pngRead(Uint8Array.from(atob(b64Png), c => c.charCodeAt(0)))
    const ihdr = chunks.filter((chunk) => chunk.type === ChunkType.IHDR).at(0);
    if (ihdr.imageWidth > 128 || ihdr.imageHeight > 128) return {}
    chunks.push(pngWriteTEXT({
        key: 'character uuid',
        value: characterId
    }))
    const binaryPng = pngWrite(chunks)
    const digest = await crypto.subtle.digest('SHA-256', binaryPng)
    return {
        image: binaryPng.buffer,
        digest: Array.from(new Uint32Array(digest)).map(x=>x.toString(16).padStart(8, "0")).join('')
    }
}