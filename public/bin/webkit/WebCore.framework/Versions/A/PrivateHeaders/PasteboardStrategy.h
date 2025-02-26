/*
 * Copyright (C) 2012 Apple Inc.  All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef PasteboardStrategy_h
#define PasteboardStrategy_h

#include <wtf/Forward.h>

namespace WebCore {

class Color;
class SharedBuffer;
class PasteboardContext;
class PasteboardCustomData;
class SelectionData;
class FragmentedSharedBuffer;
struct PasteboardImage;
struct PasteboardItemInfo;
struct PasteboardURL;
struct PasteboardWebContent;

class PasteboardStrategy {
public:
#if PLATFORM(IOS_FAMILY)
    virtual void writeToPasteboard(const PasteboardURL&, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual void writeToPasteboard(const PasteboardWebContent&, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual void writeToPasteboard(const PasteboardImage&, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual void writeToPasteboard(const String& pasteboardType, const String&, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual void updateSupportedTypeIdentifiers(const Vector<String>& identifiers, const String& pasteboardName, const PasteboardContext*) = 0;
#endif // PLATFORM(IOS_FAMILY)
#if PLATFORM(COCOA)
    virtual void getTypes(Vector<String>& types, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual RefPtr<SharedBuffer> bufferForType(const String& pasteboardType, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual void getPathnamesForType(Vector<String>& pathnames, const String& pasteboardType, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual String stringForType(const String& pasteboardType, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual Vector<String> allStringsForType(const String& pasteboardType, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual int64_t changeCount(const String& pasteboardName, const PasteboardContext*) = 0;
    virtual Color color(const String& pasteboardName, const PasteboardContext*) = 0;
    virtual URL url(const String& pasteboardName, const PasteboardContext*) = 0;
    virtual int getNumberOfFiles(const String& pasteboardName, const PasteboardContext*) = 0;

    virtual int64_t addTypes(const Vector<String>& pasteboardTypes, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual int64_t setTypes(const Vector<String>& pasteboardTypes, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual int64_t setBufferForType(SharedBuffer*, const String& pasteboardType, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual int64_t setURL(const PasteboardURL&, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual int64_t setColor(const Color&, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual int64_t setStringForType(const String&, const String& pasteboardType, const String& pasteboardName, const PasteboardContext*) = 0;

    virtual bool containsURLStringSuitableForLoading(const String& pasteboardName, const PasteboardContext*) = 0;
    virtual String urlStringSuitableForLoading(const String& pasteboardName, String& title, const PasteboardContext*) = 0;
#endif
    virtual String readStringFromPasteboard(size_t index, const String& pasteboardType, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual RefPtr<SharedBuffer> readBufferFromPasteboard(std::optional<size_t> index, const String& pasteboardType, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual URL readURLFromPasteboard(size_t index, const String& pasteboardName, String& title, const PasteboardContext*) = 0;
    virtual std::optional<PasteboardItemInfo> informationForItemAtIndex(size_t index, const String& pasteboardName, int64_t changeCount, const PasteboardContext*) = 0;
    virtual std::optional<Vector<PasteboardItemInfo>> allPasteboardItemInfo(const String& pasteboardName, int64_t changeCount, const PasteboardContext*) = 0;
    virtual int getPasteboardItemsCount(const String& pasteboardName, const PasteboardContext*) = 0;

    virtual Vector<String> typesSafeForDOMToReadAndWrite(const String& pasteboardName, const String& origin, const PasteboardContext*) = 0;
    virtual int64_t writeCustomData(const Vector<PasteboardCustomData>&, const String& pasteboardName, const PasteboardContext*) = 0;
    virtual bool containsStringSafeForDOMToReadForType(const String&, const String& pasteboardName, const PasteboardContext*) = 0;

#if PLATFORM(GTK)
    virtual Vector<String> types(const String& pasteboardName) = 0;
    virtual String readTextFromClipboard(const String& pasteboardName) = 0;
    virtual Vector<String> readFilePathsFromClipboard(const String& pasteboardName) = 0;
    virtual RefPtr<SharedBuffer> readBufferFromClipboard(const String& pasteboardName, const String& pasteboardType) = 0;
    virtual void writeToClipboard(const String& pasteboardName, SelectionData&&) = 0;
    virtual void clearClipboard(const String& pasteboardName) = 0;
    virtual int64_t changeCount(const String& pasteboardName) = 0;
#endif // PLATFORM(GTK)

#if USE(LIBWPE)
    virtual void getTypes(Vector<String>& types) = 0;
    virtual void writeToPasteboard(const PasteboardWebContent&) = 0;
    virtual void writeToPasteboard(const String& pasteboardType, const String&) = 0;
#endif

protected:
    virtual ~PasteboardStrategy()
    {
    }
};

}

#endif // !PasteboardStrategy_h
