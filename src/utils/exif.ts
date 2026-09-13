import { ExifData } from '../types';

/**
 * Parses JPEG EXIF data directly from an ArrayBuffer.
 * Handles both Little Endian (Intel) and Big Endian (Motorola) TIFF formats.
 */
export function parseExif(buffer: ArrayBuffer): ExifData {
  const defaultResult: ExifData = { hasExif: false };
  const view = new DataView(buffer);

  // Check if it's a JPEG
  if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) {
    return defaultResult;
  }

  let offset = 2;
  const length = view.byteLength;

  while (offset < length - 1) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFE1) {
      // Found APP1 (EXIF Segment)
      const segmentLength = view.getUint16(offset + 2);
      const app1Offset = offset + 4;
      
      // Check Exif header "Exif\0\0"
      if (
        view.getUint32(app1Offset) === 0x45786966 && // "Exif"
        view.getUint16(app1Offset + 4) === 0x0000     // "\0\0"
      ) {
        return parseTiffSegment(view, app1Offset + 6);
      }
      
      offset += segmentLength + 2;
    } else if ((marker & 0xFF00) === 0xFF00 && marker !== 0xFFD8 && marker !== 0xFFD9) {
      // Other marker, skip its contents
      const markerLength = view.getUint16(offset + 2);
      offset += markerLength + 2;
    } else {
      offset++;
    }
  }

  return defaultResult;
}

function parseTiffSegment(view: DataView, tiffOffset: number): ExifData {
  const result: ExifData = { hasExif: false };

  // Check Byte Order
  const byteOrder = view.getUint16(tiffOffset);
  let isLittleEndian: boolean;
  if (byteOrder === 0x4949) {
    isLittleEndian = true; // Intel
  } else if (byteOrder === 0x4D4D) {
    isLittleEndian = false; // Motorola
  } else {
    return { hasExif: false }; // Invalid TIFF header
  }

  // Check TIFF magic number (0x002A)
  const magic = view.getUint16(tiffOffset + 2, isLittleEndian);
  if (magic !== 0x002A) {
    return { hasExif: false };
  }

  // Get offset to first IFD (Image File Directory)
  const firstIfdOffset = view.getUint32(tiffOffset + 4, isLittleEndian);
  if (firstIfdOffset + tiffOffset >= view.byteLength) {
    return { hasExif: false };
  }

  // Parse IFD0
  const tags = parseIFD(view, tiffOffset, firstIfdOffset, isLittleEndian);
  
  if (tags.get(0x010F)) {
    result.make = readAscii(view, tiffOffset + (tags.get(0x010F) as number), isLittleEndian);
  }
  if (tags.get(0x0110)) {
    result.model = readAscii(view, tiffOffset + (tags.get(0x0110) as number), isLittleEndian);
  }
  if (tags.get(0x0132)) {
    result.dateTime = readAscii(view, tiffOffset + (tags.get(0x0132) as number), isLittleEndian);
  }

  // Check if GPS Info pointer exists (tag 0x8825)
  const gpsOffsetVal = tags.get(0x8825);
  if (gpsOffsetVal !== undefined) {
    const gpsIfdOffset = gpsOffsetVal as number;
    const gpsTags = parseIFD(view, tiffOffset, gpsIfdOffset, isLittleEndian);
    
    // Parse GPS details
    const latRefOffset = gpsTags.get(0x0001); // GPSLatitudeRef
    const latOffset = gpsTags.get(0x0002);    // GPSLatitude
    const lngRefOffset = gpsTags.get(0x0003); // GPSLongitudeRef
    const lngOffset = gpsTags.get(0x0004);    // GPSLongitude

    if (latOffset && lngOffset) {
      const latRef = latRefOffset !== undefined ? readAscii(view, tiffOffset + (latRefOffset as number), isLittleEndian, 2).trim() : 'N';
      const lngRef = lngRefOffset !== undefined ? readAscii(view, tiffOffset + (lngRefOffset as number), isLittleEndian, 2).trim() : 'E';
      
      const latitude = parseGPSCoordinate(view, tiffOffset + (latOffset as number), isLittleEndian);
      const longitude = parseGPSCoordinate(view, tiffOffset + (lngOffset as number), isLittleEndian);

      if (latitude !== null && longitude !== null) {
        const finalLat = latRef === 'S' ? -latitude : latitude;
        const finalLng = lngRef === 'W' ? -longitude : longitude;
        
        result.gps = {
          latitude: finalLat,
          longitude: finalLng,
          latitudeRef: latRef,
          longitudeRef: lngRef,
          googleMapsUrl: `https://www.google.com/maps?q=${finalLat.toFixed(6)},${finalLng.toFixed(6)}`
        };
      }
    }
  }

  result.hasExif = !!(result.make || result.model || result.gps);
  return result;
}

function parseIFD(view: DataView, tiffOffset: number, ifdOffset: number, isLittleEndian: boolean): Map<number, number | number[]> {
  const tags = new Map<number, number | number[]>();
  const dirOffset = tiffOffset + ifdOffset;
  if (dirOffset + 2 > view.byteLength) return tags;

  const numEntries = view.getUint16(dirOffset, isLittleEndian);
  let entryOffset = dirOffset + 2;

  for (let i = 0; i < numEntries; i++) {
    if (entryOffset + 12 > view.byteLength) break;

    const tag = view.getUint16(entryOffset, isLittleEndian);
    const type = view.getUint16(entryOffset + 2, isLittleEndian);
    const count = view.getUint32(entryOffset + 4, isLittleEndian);
    const valueOffset = view.getUint32(entryOffset + 8, isLittleEndian);

    // If data size fits inside 4 bytes, valueOffset contains the value directly.
    // Otherwise, it's an offset from the start of the TIFF header.
    const size = getTagSize(type, count);
    if (size <= 4) {
      tags.set(tag, entryOffset + 8); // Offset to internal value
    } else {
      tags.set(tag, valueOffset);     // Offset relative to TIFF header
    }

    entryOffset += 12;
  }

  return tags;
}

function getTagSize(type: number, count: number): number {
  const typeSizes = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];
  return (typeSizes[type] || 0) * count;
}

function readAscii(view: DataView, offset: number, isLittleEndian: boolean, maxLength: number = 128): string {
  let result = '';
  if (offset >= view.byteLength) return result;

  for (let i = 0; i < maxLength; i++) {
    if (offset + i >= view.byteLength) break;
    const charCode = view.getUint8(offset + i);
    if (charCode === 0) break;
    result += String.fromCharCode(charCode);
  }
  return result;
}

function parseGPSCoordinate(view: DataView, offset: number, isLittleEndian: boolean): number | null {
  if (offset + 24 > view.byteLength) return null;

  // EXIF GPS stores latitude/longitude as 3 Rationals: [Degrees, Minutes, Seconds]
  // Each Rational is 8 bytes: 4 bytes numerator, 4 bytes denominator
  const degNum = view.getUint32(offset, isLittleEndian);
  const degDen = view.getUint32(offset + 4, isLittleEndian);
  
  const minNum = view.getUint32(offset + 8, isLittleEndian);
  const minDen = view.getUint32(offset + 12, isLittleEndian);
  
  const secNum = view.getUint32(offset + 16, isLittleEndian);
  const secDen = view.getUint32(offset + 20, isLittleEndian);

  const degrees = degDen !== 0 ? degNum / degDen : 0;
  const minutes = minDen !== 0 ? minNum / minDen : 0;
  const seconds = secDen !== 0 ? secNum / secDen : 0;

  return degrees + (minutes / 60) + (seconds / 3600);
}
