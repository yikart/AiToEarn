/*
 * Copyright (C) 2015-2021 Apple Inc. All rights reserved.
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

#include "FontSelectionAlgorithm.h"
#include "TextFlags.h"
#include <CoreText/CoreText.h>
#include <wtf/Lock.h>
#include <wtf/Noncopyable.h>
#include <wtf/RobinHoodHashMap.h>
#include <wtf/Vector.h>
#include <wtf/text/AtomString.h>

namespace WebCore {

class FontDatabase {
    WTF_MAKE_NONCOPYABLE(FontDatabase);

public:
    FontDatabase(AllowUserInstalledFonts);

    struct InstalledFont {
        InstalledFont() = default;
        InstalledFont(CTFontDescriptorRef);

        RetainPtr<CTFontDescriptorRef> fontDescriptor;
        FontSelectionCapabilities capabilities;
    };

    struct InstalledFontFamily {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;

        InstalledFontFamily() = default;

        explicit InstalledFontFamily(Vector<InstalledFont>&& installedFonts);

        void expand(const InstalledFont&);
        bool isEmpty() const { return installedFonts.isEmpty(); }
        size_t size() const { return installedFonts.size(); }

        Vector<InstalledFont> installedFonts;
        FontSelectionCapabilities capabilities;
    };

    AllowUserInstalledFonts allowUserInstalledFonts() const { return m_allowUserInstalledFonts; }
    const InstalledFontFamily& collectionForFamily(const String& familyName);
    const InstalledFont& fontForPostScriptName(const AtomString& postScriptName);
    void clear();

private:
    Lock m_familyNameToFontDescriptorsLock;
    MemoryCompactRobinHoodHashMap<String, std::unique_ptr<InstalledFontFamily>> m_familyNameToFontDescriptors WTF_GUARDED_BY_LOCK(m_familyNameToFontDescriptorsLock);
    MemoryCompactRobinHoodHashMap<String, InstalledFont> m_postScriptNameToFontDescriptors;
    AllowUserInstalledFonts m_allowUserInstalledFonts;
};

} // namespace WebCore
