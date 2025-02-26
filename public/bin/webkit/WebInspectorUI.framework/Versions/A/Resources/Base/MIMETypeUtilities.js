/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.fileExtensionForFilename = function(filename)
{
    if (!filename)
        return null;

    let index = filename.lastIndexOf(".");
    if (index === -1)
        return null;

    if (index === filename.length - 1)
        return null;

    return filename.substr(index + 1);
};

WI.fileExtensionForURL = function(url)
{
    let lastPathComponent = parseURL(url).lastPathComponent;
    return WI.fileExtensionForFilename(lastPathComponent);
};

WI.mimeTypeForFileExtension = function(extension)
{
    const extensionToMIMEType = {
        // Document types.
        "html": "text/html",
        "xhtml": "application/xhtml+xml",
        "xml": "text/xml",

        // Script types.
        "js": "text/javascript",
        "mjs": "text/javascript",
        "json": "application/json",
        "clj": "text/x-clojure",
        "coffee": "text/x-coffeescript",
        "ls": "text/x-livescript",
        "ts": "text/typescript",
        "ps": "application/postscript",
        "jsx": "text/jsx",

        // Stylesheet types.
        "css": "text/css",
        "less": "text/x-less",
        "sass": "text/x-sass",
        "scss": "text/x-scss",

        // Image types.
        "avif": "image/avif",
        "bmp": "image/bmp",
        "gif": "image/gif",
        "ico": "image/x-icon",
        "jp2": "image/jp2",
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "jxl": "image/jxl",
        "pdf": "application/pdf",
        "png": "image/png",
        "tif": "image/tiff",
        "tiff": "image/tiff",
        "webp": "image/webp",
        "xbm": "image/x-xbitmap",

        "ogx": "application/ogg",
        "ogg": "audio/ogg",
        "oga": "audio/ogg",
        "ogv": "video/ogg",

        // Annodex
        "anx": "application/annodex",
        "axa": "audio/annodex",
        "axv": "video/annodex",
        "spx": "audio/speex",

        // WebM
        "webm": "video/webm",

        // MPEG
        "m1a": "audio/mpeg",
        "m2a": "audio/mpeg",
        "mpg": "video/mpeg",
        "m15": "video/mpeg",
        "m1s": "video/mpeg",
        "m1v": "video/mpeg",
        "m75": "video/mpeg",
        "mpa": "video/mpeg",
        "mpeg": "video/mpeg",
        "mpm": "video/mpeg",
        "mpv": "video/mpeg",

        // MPEG playlist
        "m3u8": "application/x-mpegurl",
        "m3url": "audio/x-mpegurl",
        "m3u": "audio/x-mpegurl",

        // MPEG-4
        "m4v": "video/x-m4v",
        "m4a": "audio/x-m4a",
        "m4b": "audio/x-m4b",
        "m4p": "audio/x-m4p",

        // MP3
        "mp3": "audio/mp3",

        // MPEG-2
        "mp2": "video/x-mpeg2",
        "vob": "video/mpeg2",
        "mod": "video/mpeg2",
        "m2ts": "video/m2ts",
        "m2t": "video/x-m2ts",

        // 3GP/3GP2
        "3gpp": "audio/3gpp",
        "3g2": "audio/3gpp2",
        "amc": "application/x-mpeg",

        // AAC
        "aac": "audio/aac",
        "adts": "audio/aac",
        "m4r": "audio/x-aac",

        // CoreAudio File
        "caf": "audio/x-caf",
        "gsm": "audio/x-gsm",

        // ADPCM
        "wav": "audio/x-wav",

        // Text Track
        "vtt": "text/vtt",

        // Font
        "woff": "font/woff",
        "woff2": "font/woff2",
        "otf": "font/otf",
        "ttf": "font/ttf",
        "sfnt": "font/sfnt",

        // Miscellaneous types.
        "svg": "image/svg+xml",
        "txt": "text/plain",
        "xsl": "text/xsl"
    };

    return extensionToMIMEType[extension] || null;
};

WI.fileExtensionForMIMEType = function(mimeType)
{
    if (!mimeType)
        return null;

    const mimeTypeToExtension = {
        // Document types.
        "text/html": "html",
        "application/xhtml+xml": "xhtml",
        "application/xml": "xml",
        "text/xml": "xml",

        // Script types.
        "application/ecmascript": "js",
        "application/javascript": "js",
        "application/x-ecmascript": "js",
        "application/x-javascript": "js",
        "text/ecmascript": "js",
        "text/javascript": "js",
        "text/javascript1.0": "js",
        "text/javascript1.1": "js",
        "text/javascript1.2": "js",
        "text/javascript1.3": "js",
        "text/javascript1.4": "js",
        "text/javascript1.5": "js",
        "text/jscript": "js",
        "text/x-ecmascript": "js",
        "text/x-javascript": "js",
        "application/json": "json",
        "text/x-clojure": "clj",
        "text/x-coffeescript": "coffee",
        "text/livescript": "ls",
        "text/x-livescript": "ls",
        "text/typescript": "ts",
        "application/postscript": "ps",
        "text/jsx": "jsx",

        // Stylesheet types.
        "text/css": "css",
        "text/x-less": "less",
        "text/x-sass": "sass",
        "text/x-scss": "scss",

        // Image types.
        "image/avif": "avif",
        "image/bmp": "bmp",
        "image/gif": "gif",
        "image/vnd.microsoft.icon": "ico",
        "image/x-icon": "ico",
        "image/jp2": "jp2",
        "image/jpeg": "jpg",
        "image/jxl": "jxl",
        "application/pdf": "pdf",
        "text/pdf": "pdf",
        "image/png": "png",
        "image/tiff": "tiff",
        "image/webp": "webp",
        "image/x-xbitmap": "xbm",

        // Ogg
        "application/ogg": "ogx",
        "audio/ogg": "ogg",

        // Annodex
        "application/annodex": "anx",
        "audio/annodex": "axa",
        "video/annodex": "axv",
        "audio/speex": "spx",

        // WebM
        "video/webm": "webm",
        "audio/webm": "webm",

        // MPEG
        "video/mpeg": "mpeg",

        // MPEG playlist
        "application/vnd.apple.mpegurl": "m3u8",
        "application/mpegurl": "m3u8",
        "application/x-mpegurl": "m3u8",
        "audio/mpegurl": "m3u",
        "audio/x-mpegurl": "m3u",

        // MPEG-4
        "video/x-m4v": "m4v",
        "audio/x-m4a": "m4a",
        "audio/x-m4b": "m4b",
        "audio/x-m4p": "m4p",
        "audio/mp4": "m4a",

        // MP3
        "audio/mp3": "mp3",
        "audio/x-mp3": "mp3",
        "audio/x-mpeg": "mp3",

        // MPEG-2
        "video/x-mpeg2": "mp2",
        "video/mpeg2": "vob",
        "video/m2ts": "m2ts",
        "video/x-m2ts": "m2t",

        // 3GP/3GP2
        "audio/3gpp": "3gpp",
        "audio/3gpp2": "3g2",
        "application/x-mpeg": "amc",

        // AAC
        "audio/aac": "aac",
        "audio/x-aac": "m4r",

        // CoreAudio File
        "audio/x-caf": "caf",
        "audio/x-gsm": "gsm",

        // ADPCM
        "audio/x-wav": "wav",
        "audio/vnd.wave": "wav",

        // Text Track
        "text/vtt": "vtt",

        // Font
        "font/woff": "woff",
        "font/woff2": "woff2",
        "font/otf": "otf",
        "font/ttf": "ttf",
        "font/sfnt": "sfnt",

        // Miscellaneous types.
        "image/svg+xml": "svg",
        "text/plain": "txt",
        "text/xsl": "xsl",
    };

    let extension = mimeTypeToExtension[mimeType];
    if (extension)
        return extension;

    if (mimeType.endsWith("+json"))
        return "json";
    if (mimeType.endsWith("+xml"))
        return "xml";

    return null;
};

WI.shouldTreatMIMETypeAsText = function(mimeType)
{
    if (!mimeType)
        return false;

    if (mimeType.startsWith("text/"))
        return true;

    if (mimeType.endsWith("+json") || mimeType.endsWith("+xml"))
        return true;

    let extension = WI.fileExtensionForMIMEType(mimeType);
    if (extension === "xml")
        return true;

    // Various script and JSON mime types.
    if (extension === "js" || extension === "json")
        return true;

    // Various media text mime types.
    if (extension === "m3u8" || extension === "m3u")
        return true;

    if (mimeType.startsWith("application/"))
        return mimeType.endsWith("script") || mimeType.endsWith("json") || mimeType.endsWith("xml");

    return false;
};
