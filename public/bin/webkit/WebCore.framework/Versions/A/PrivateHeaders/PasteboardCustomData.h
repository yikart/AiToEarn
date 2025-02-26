/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#pragma once

#include <variant>
#include <wtf/Function.h>
#include <wtf/HashMap.h>
#include <wtf/Vector.h>
#include <wtf/persistence/PersistentCoders.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class SharedBuffer;

class PasteboardCustomData {
public:
    struct Entry {
        WEBCORE_EXPORT Entry();
        WEBCORE_EXPORT Entry(const Entry&);
        WEBCORE_EXPORT Entry(const String&, const String&, const std::variant<String, Ref<WebCore::SharedBuffer>>&);
        WEBCORE_EXPORT Entry(Entry&&);
        WEBCORE_EXPORT Entry& operator=(const Entry& otherData);
        WEBCORE_EXPORT Entry& operator=(Entry&& otherData);
        Entry(const String& type);

        String type;
        String customData;
        std::variant<String, Ref<SharedBuffer>> platformData;
    };

    WEBCORE_EXPORT PasteboardCustomData();
    WEBCORE_EXPORT PasteboardCustomData(String&& origin, Vector<Entry>&&);
    WEBCORE_EXPORT PasteboardCustomData(PasteboardCustomData&&);
    WEBCORE_EXPORT PasteboardCustomData(const PasteboardCustomData&);
    WEBCORE_EXPORT ~PasteboardCustomData();

    const String& origin() const { return m_origin; }
    void setOrigin(const String& origin) { m_origin = origin; }

    WEBCORE_EXPORT Ref<SharedBuffer> createSharedBuffer() const;
    WEBCORE_EXPORT static PasteboardCustomData fromSharedBuffer(const SharedBuffer&);
    WEBCORE_EXPORT static PasteboardCustomData fromPersistenceDecoder(WTF::Persistence::Decoder&&);

    String readString(const String& type) const;
    RefPtr<SharedBuffer> readBuffer(const String& type) const;
    String readStringInCustomData(const String& type) const;

    void writeString(const String& type, const String& value);
    void writeData(const String& type, Ref<SharedBuffer>&& data);
    void writeStringInCustomData(const String& type, const String& value);

    void clear();
    void clear(const String& type);

#if PLATFORM(COCOA)
    WEBCORE_EXPORT static ASCIILiteral cocoaType();
#elif PLATFORM(GTK)
    static ASCIILiteral gtkType() { return "org.webkitgtk.WebKit.custom-pasteboard-data"_s; }
#endif

    void forEachType(Function<void(const String&)>&&) const;
    void forEachPlatformString(Function<void(const String& type, const String& data)>&&) const;
    void forEachPlatformStringOrBuffer(Function<void(const String& type, const std::variant<String, Ref<SharedBuffer>>& data)>&&) const;
    void forEachCustomString(Function<void(const String& type, const String& data)>&&) const;

    bool hasData() const;
    bool hasSameOriginCustomData() const;

    Vector<String> orderedTypes() const;
    WEBCORE_EXPORT PasteboardCustomData& operator=(const PasteboardCustomData& otherData);

    const Vector<Entry>& data() const { return m_data; }

private:
    UncheckedKeyHashMap<String, String> sameOriginCustomStringData() const;
    Entry& addOrMoveEntryToEnd(const String&);

    String m_origin;
    Vector<Entry> m_data;
};

} // namespace WebCore
