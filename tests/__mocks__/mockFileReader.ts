global.window = {
  // @ts-ignore
  FileReader: class MockFileReader {
    onload: any = null
    onerror: any = null
    result = ''

    async readAsText(blob: Blob) {
      try {
        if (blob instanceof Blob) {
          const result = await blob.text()
          this.onload({ target: { result } })
        } else
          this.onerror({ target: { error: new DOMException('Invalid blob') } })
      } catch (error) {
        this.onerror({ target: { error } })
      }
    }
  },
}
