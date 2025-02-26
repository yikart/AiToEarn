/*
* Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "Document.h"
#include "Element.h"
#include "FloatPoint.h"
#include "ScrollTypes.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class ScrollAnchoringController;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::ScrollAnchoringController> : std::true_type { };
}

namespace WebCore {

class Element;
class ScrollableArea;
class WeakPtrImplWithEventTargetData;

enum class CandidateExaminationResult {
    Exclude, Select, Descend, Skip
};

class ScrollAnchoringController final : public CanMakeWeakPtr<ScrollAnchoringController> {
    WTF_MAKE_TZONE_ALLOCATED(ScrollAnchoringController);
public:
    explicit ScrollAnchoringController(ScrollableArea&);
    ~ScrollAnchoringController();
    void invalidateAnchorElement();
    void adjustScrollPositionForAnchoring();
    void chooseAnchorElement(Document&);
    CandidateExaminationResult examineAnchorCandidate(Element&);
    void updateAnchorElement();
    void notifyChildHadSuppressingStyleChange();
    bool isInScrollAnchoringAncestorChain(const RenderObject&);

    Element* anchorElement() const { return m_anchorElement.get(); }


private:
    Element* findAnchorElementRecursive(Element*);
    bool didFindPriorityCandidate(Document&);
    FloatPoint computeOffsetFromOwningScroller(RenderObject&);
    LocalFrameView& frameView();

    ScrollableArea& m_owningScrollableArea;
    WeakPtr<Element, WeakPtrImplWithEventTargetData> m_anchorElement;
    FloatPoint m_lastOffsetForAnchorElement;
    bool m_midUpdatingScrollPositionForAnchorElement { false };
    bool m_isQueuedForScrollPositionUpdate { false };
    bool m_shouldSuppressScrollPositionUpdate { false };
};

} // namespace WebCore
