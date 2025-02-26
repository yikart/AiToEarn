/*
 * Copyright (c) 2016 Igalia S.L.
 * Copyright (c) 2021 Apple Inc.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ScrollbarsController.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

// A Mock implementation of ScrollbarsController used to test the scroll events
// received by the scrollbar controller. Tests can enable this mock object using
// the internal setting setMockScrollbarsControllerEnabled().

class ScrollbarsControllerMock final : public ScrollbarsController {
    WTF_MAKE_TZONE_ALLOCATED(ScrollbarsControllerMock);
    WTF_MAKE_NONCOPYABLE(ScrollbarsControllerMock);
public:
    ScrollbarsControllerMock(ScrollableArea&, Function<void(const String&)>&&);
    virtual ~ScrollbarsControllerMock();
    bool isScrollbarsControllerMock() const final { return true; }

private:

    void didAddVerticalScrollbar(Scrollbar*) final;
    void didAddHorizontalScrollbar(Scrollbar*) final;
    void willRemoveVerticalScrollbar(Scrollbar*) final;
    void willRemoveHorizontalScrollbar(Scrollbar*) final;
    void mouseEnteredContentArea() final;
    void mouseMovedInContentArea() final;
    void mouseExitedContentArea() final;
    void mouseEnteredScrollbar(Scrollbar*) const final;
    void mouseExitedScrollbar(Scrollbar*) const final;
    void mouseIsDownInScrollbar(Scrollbar*, bool) const final;
    ASCIILiteral scrollbarPrefix(Scrollbar*) const;

    Function<void(const String&)> m_logger;
    Scrollbar* m_verticalScrollbar { nullptr };
    Scrollbar* m_horizontalScrollbar { nullptr };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ScrollbarsControllerMock)
    static bool isType(const WebCore::ScrollbarsController& controller) { return controller.isScrollbarsControllerMock(); }
SPECIALIZE_TYPE_TRAITS_END()
