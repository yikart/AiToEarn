/*
 * Copyright (C) 2007, 2008 Apple Inc. All rights reserved.
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

#pragma once

#include "FontRanges.h"
#include <wtf/Forward.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class FontCache;
class FontCascadeDescription;
class FontDescription;
class FontSelectorClient;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(FontAccessor);

class FontAccessor : public RefCounted<FontAccessor> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(FontAccessor);
public:
    virtual ~FontAccessor() = default;

    virtual const Font* font(ExternalResourceDownloadPolicy) const = 0;
    virtual bool isLoading() const = 0;
};

class FontSelector : public RefCountedAndCanMakeWeakPtr<FontSelector> {
public:
    virtual ~FontSelector() = default;

    virtual FontRanges fontRangesForFamily(const FontDescription&, const AtomString&) = 0;
    virtual RefPtr<Font> fallbackFontAt(const FontDescription&, size_t) = 0;

    virtual size_t fallbackFontCount() = 0;

    virtual void opportunisticallyStartFontDataURLLoading(const FontCascadeDescription&, const AtomString& family) = 0;

    virtual void fontCacheInvalidated() { }

    virtual void registerForInvalidationCallbacks(FontSelectorClient&) = 0;
    virtual void unregisterForInvalidationCallbacks(FontSelectorClient&) = 0;

    virtual unsigned uniqueId() const = 0;
    virtual unsigned version() const = 0;
};

WTF::TextStream& operator<<(WTF::TextStream&, const FontSelector&);

}
