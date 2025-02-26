/*
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

#include "StyleColor.h"

namespace WebCore {

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(StyleVisitedLinkColorData);
class StyleVisitedLinkColorData : public RefCounted<StyleVisitedLinkColorData> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(StyleVisitedLinkColorData);
public:
    static Ref<StyleVisitedLinkColorData> create() { return adoptRef(*new StyleVisitedLinkColorData); }
    Ref<StyleVisitedLinkColorData> copy() const;
    ~StyleVisitedLinkColorData();

    bool operator==(const StyleVisitedLinkColorData&) const;

#if !LOG_DISABLED
    void dumpDifferences(TextStream&, const StyleVisitedLinkColorData&) const;
#endif

    Style::Color background;
    Style::Color borderLeft;
    Style::Color borderRight;
    Style::Color borderTop;
    Style::Color borderBottom;
    Style::Color textDecoration;
    Style::Color outline;

private:
    StyleVisitedLinkColorData();
    StyleVisitedLinkColorData(const StyleVisitedLinkColorData&);
};

} // namespace WebCore
