<p align="center">
    <img width="200" src="./resources/png-rw.png" alt="png-rw logo">
</p>

# png-rw

Quick & easy PNG chunks reader / writer.

Main focus: add metadata like exif, xmp, png textual tags, icc profile to captured canvas blobs.

## Install

```bash
npm i png-rw
```

## Status

- Tested and stable along the happy path
- Not feature complete

## Features

### Chunk types

Reading / writing raw chunks is supported. This table show support encoding/decoding chunk data.

| Type | Read | Write | Limitations                                     |
|------|------|-------|-------------------------------------------------|
| IHDR | ✔️   | ✔️    | no verification of value constraints            |
| tEXt | ✔️   | ✔️    | you have to take care of proper latin1 handling |
| iTXt | ✔️   | ✔️    | compression not supported                       |
| zTXt | ✔️   | ✔️    | your have to take care of compression           |
| eXIf | ️    | ✔️    | tag id & data type mappings are supported       |
| iCCP | ✔️   | ✔️    | compression not supported                       |
| sRGB |      |       | should not be present if iCCP is used           |
| tXMP |      |       | use ITXt for XMP                                |

## Usage

Add xmp data and Display-P3 ICC profile to blob when capturing canvas image data in a browser:

```typescript
import { ChunkType, ICCProfileDisplayP3V4Deflated, pngEncodeITXT, pngRead, pngWrite, pngWriteEXIF } from 'png-rw'

canvas.toBlob((blob: Blob | null) => {
  if (blob === null) {
    return
  }

  let title = 'title'
  let author = 'author'
  let description = 'description'
  let features = {
    'key1': 'value1',
    'key2': 'value2',
    'key3': 'value3',
  }
  let reader = new FileReader()
  reader.onload = () => {
    let result = reader.result as ArrayBuffer
    let data = new Uint8Array(result)
    let chunks = pngRead(data)
    chunks.push(
      pngEncodeITXT({
        key: 'XML:com.adobe.xmp',
        compressionFlag: false,
        compressionMethod: 0,
        languageTag: '',
        translatedKey: '',
        value:
        // language=xml
          `<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="XMP Core 6.0.0">
            <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
              <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
                <dc:title>
                  <rdf:Alt>
                    <rdf:li xml:lang="x-default">${title}</rdf:li>
                  </rdf:Alt>
              </dc:title>
              <dc:description>
                <rdf:Alt>
                  <rdf:li xml:lang="x-default">${description}</rdf:li>
                </rdf:Alt>
              </dc:description>
              <dc:subject>
                <rdf:Seq>
                    ${Object.entries(features).map(([k, v]) => `<rdf:li>${k}: ${v}</rdf:li>`).join('')}
                 <rdf:li><![CDATA[link: ${window.location.toString()}]]></rdf:li>
                </rdf:Seq>
              </dc:subject>
              <dc:creator>
                <rdf:Seq>
                  <rdf:li>${author}</rdf:li>
                </rdf:Seq>
              </dc:creator>
              </rdf:Description>
          </rdf:RDF>
        </x:xmpmeta>`.trim(),
      }),
    )

    // note: values are only exemplary
    let ihdr = chunks.filter((chunk) => chunk.type === ChunkType.IHDR).at(0);
    chunks.push(
      pngWriteEXIF({
        ifd0: new Ifd(
          IfdId.FIRST,
          [
            new IfdTag(TagIFD0Id.XResolution, new Rational([72, 1])),
            new IfdTag(TagIFD0Id.YResolution, new Rational([72, 1])),
            new IfdTag(TagIFD0Id.ResolutionUnit, new Short(2)),
            new IfdTag(TagIFD0Id.YCbCrPositioning, new Short(1))
          ],
          [
            new Ifd(IfdId.EXIF,
              [
                new IfdTag(TagExifId.ExifVersion, new Undefined(stringEncode('0232'))),
                new IfdTag(TagExifId.ComponentsConfiguration, new Undefined(new Uint8Array([1, 2, 3, 0]))),
                new IfdTag(TagExifId.ColorSpace, new Short(0xffff)),
                new IfdTag(TagExifId.ExifImageWidth, new Short(ihdr.imageWidth)),
                new IfdTag(TagExifId.ExifImageHeight, new Short(ihdr.imageHeight))
              ]
            )
          ]
        )
      })
    )

    // add icc profile
    if (!chunks.some((chunk) => chunk.type === ChunkType.ICCP)) {
      // drop sRGB - should not be there if iCCP is present
      chunks = chunks.filter((chunk) => chunk.type != ChunkType.SRGB)
      chunks.push(pngEncodeICCP({
        name: 'ICC Profile',
        compressionMethod: 0,
        profileDeflated: ICCProfileDisplayP3V4Deflated,
      }))
    }

    const a = document.createElement('a')
    document.body.appendChild(a)
    a.style.display = 'none'
    a.href = URL.createObjectURL(new Blob([pngWrite(chunks)]))
    a.download = name
    a.onclick = (event: MouseEvent) => event.stopPropagation()
    a.click()
  }
  reader.readAsArrayBuffer(blob)
})
```

## Links

### Specs

- https://www.w3.org/TR/png/#4Concepts.Format
- https://exiftool.org/TagNames/PNG.html
- https://exiftool.org/TagNames/EXIF.html
- https://www.awaresystems.be/imaging/tiff/faq.html
- https://www.awaresystems.be/imaging/tiff/tifftags/privateifd.html
- https://exiftool.org/TagNames/XMP.html
- https://github.com/eeeps/exif-intrinsic-sizing-explainer

### Libraries

- https://github.com/nodeca/pako - to deflate/inflate compressed chunk data
- https://github.com/mathiasbynens/windows-1252 - latin1 encoder / decoder
- https://github.com/image-js/tiff - tiff decoder
- https://github.com/lovell/icc - icc profile decoder

### ICC Profiles

- https://github.com/saucecontrol/Compact-ICC-Profiles - compact, CC0 licensed profiles incl. support for Display-P3 D65

### Tools

- https://exiftool.org/ - excellent metadata reader / writer with validation support

## License

[MIT](LICENSE)
