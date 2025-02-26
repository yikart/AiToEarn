/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include "LayoutRect.h"
#include "RenderObject.h"

namespace WebCore {

class LegacyInlineTextBox;
class RenderStyle;
class RenderText;
class VisiblePosition;

class RenderTextLineBoxes {
public:
    RenderTextLineBoxes();

    LegacyInlineTextBox* first() const { return m_first; }
    LegacyInlineTextBox* last() const { return m_last; }

    LegacyInlineTextBox* createAndAppendLineBox(RenderText&);

    void extract(LegacyInlineTextBox&);
    void attach(LegacyInlineTextBox&);
    void remove(LegacyInlineTextBox&);

    void removeAllFromParent(RenderText&);
    void deleteAll();

    void dirtyAll();
    bool dirtyForTextChange(RenderText&);

    LegacyInlineTextBox* findNext(int offset, int& position) const;

#if ASSERT_ENABLED
    ~RenderTextLineBoxes();
#endif

#if !ASSERT_WITH_SECURITY_IMPLICATION_DISABLED
    void invalidateParentChildLists();
#endif

private:
    void checkConsistency() const;

    LegacyInlineTextBox* m_first;
    LegacyInlineTextBox* m_last;
};

} // namespace WebCore
