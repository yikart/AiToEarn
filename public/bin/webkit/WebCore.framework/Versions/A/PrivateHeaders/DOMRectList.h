/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include "FloatQuad.h"
#include <wtf/RefCounted.h>
#include <wtf/Vector.h>

namespace WebCore {

class DOMRect;

class DOMRectList : public RefCounted<DOMRectList> {
public:
    static Ref<DOMRectList> create(const Vector<FloatQuad>& quads) { return adoptRef(*new DOMRectList(quads)); }
    static Ref<DOMRectList> create(const Vector<FloatRect>& rects) { return adoptRef(*new DOMRectList(rects)); }
    static Ref<DOMRectList> create() { return adoptRef(*new DOMRectList()); }
    WEBCORE_EXPORT ~DOMRectList();

    unsigned length() const { return m_items.size(); }
    DOMRect* item(unsigned index) { return index < m_items.size() ? m_items[index].ptr() : nullptr; }
    bool isSupportedPropertyIndex(unsigned index) const { return index < m_items.size(); }

private:
    WEBCORE_EXPORT explicit DOMRectList(const Vector<FloatQuad>& quads);
    WEBCORE_EXPORT explicit DOMRectList(const Vector<FloatRect>& rects);
    DOMRectList() = default;

    Vector<Ref<DOMRect>> m_items;
};

}
