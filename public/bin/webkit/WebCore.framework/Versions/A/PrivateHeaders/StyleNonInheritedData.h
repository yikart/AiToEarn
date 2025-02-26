/**
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
 * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

#pragma once

#include <wtf/DataRef.h>
#include <wtf/RefCounted.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class StyleBoxData;
class StyleBackgroundData;
class StyleSurroundData;
class StyleMiscNonInheritedData;
class StyleRareNonInheritedData;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(StyleNonInheritedData);
class StyleNonInheritedData : public RefCounted<StyleNonInheritedData> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(StyleNonInheritedData);
public:
    static Ref<StyleNonInheritedData> create();
    Ref<StyleNonInheritedData> copy() const;

    bool operator==(const StyleNonInheritedData&) const;

#if !LOG_DISABLED
    void dumpDifferences(TextStream&, const StyleNonInheritedData&) const;
#endif

    DataRef<StyleBoxData> boxData;
    DataRef<StyleBackgroundData> backgroundData;
    DataRef<StyleSurroundData> surroundData;
    DataRef<StyleMiscNonInheritedData> miscData;
    DataRef<StyleRareNonInheritedData> rareData;

private:
    StyleNonInheritedData();
    StyleNonInheritedData(const StyleNonInheritedData&);
};

} // namespace WebCore
