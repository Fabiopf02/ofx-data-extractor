export function bufferToString(data: Buffer) {
  return data.toString()
}

export async function blobToString(blob: Blob): Promise<string> {
  const data: string = await new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.FileReader) {
      const reader = new window.FileReader()
      reader.onload = event => resolve(event.target!.result as string)
      reader.onerror = event => reject(event.target!.error)
      reader.readAsText(blob)
    } else {
      reject(new Error('FileReader is not available in this environment.'))
    }
  })
  return data
}
