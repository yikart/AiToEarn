/*
 * Copyright (C) 2016-2023 Apple Inc. All rights reserved.
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

#include "DisplayListItems.h"
#include "DisplayListResourceHeap.h"
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WTF {
class TextStream;
}

namespace WebCore {
namespace DisplayList {

class DisplayList {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(DisplayList, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(DisplayList);
public:
    DisplayList(OptionSet<ReplayOption> options = { })
        : m_options(options)
    {
    }

    WEBCORE_EXPORT void append(Item&&);
    void shrinkToFit();

    WEBCORE_EXPORT void clear();
    WEBCORE_EXPORT bool isEmpty() const;

    const Vector<Item>& items() const { return m_items; }
    Vector<Item>& items() { return m_items; }
    const ResourceHeap& resourceHeap() const { return m_resourceHeap; }

    void cacheImageBuffer(ImageBuffer&);
    void cacheNativeImage(NativeImage&);
    void cacheFont(Font&);
    void cacheDecomposedGlyphs(DecomposedGlyphs&);
    void cacheGradient(Gradient&);
    void cacheFilter(Filter&);

    WEBCORE_EXPORT String asText(OptionSet<AsTextFlag>) const;
    void dump(WTF::TextStream&) const;

    const OptionSet<ReplayOption>& replayOptions() const { return m_options; }

private:
    Vector<Item> m_items;
    ResourceHeap m_resourceHeap;
    OptionSet<ReplayOption> m_options;
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const DisplayList&);

} // DisplayList
} // WebCore
