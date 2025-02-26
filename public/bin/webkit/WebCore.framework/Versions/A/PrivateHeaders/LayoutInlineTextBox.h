/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include "LayoutBox.h"
#include <wtf/OptionSet.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

namespace Layout {

class InlineTextBox : public Box {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(InlineTextBox);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(InlineTextBox);
public:
    enum class ContentCharacteristic : uint8_t {
        CanUseSimplifiedContentMeasuring         = 1 << 0,
        CanUseSimpledFontCodepath                = 1 << 1,
        HasPositionDependentContentWidth         = 1 << 2,
        HasStrongDirectionalityContent           = 1 << 3,
    };
    InlineTextBox(String, bool isCombined, OptionSet<ContentCharacteristic>, RenderStyle&&, std::unique_ptr<RenderStyle>&& firstLineStyle = nullptr);
    virtual ~InlineTextBox() = default;

    const String& content() const { return m_content; }
    bool isCombined() const { return m_isCombined; }
    // FIXME: This should not be a box's property.
    bool canUseSimplifiedContentMeasuring() const { return m_contentCharacteristicSet.contains(ContentCharacteristic::CanUseSimplifiedContentMeasuring); }
    bool canUseSimpleFontCodePath() const { return m_contentCharacteristicSet.contains(ContentCharacteristic::CanUseSimpledFontCodepath); }
    bool hasPositionDependentContentWidth() const { return m_contentCharacteristicSet.contains(ContentCharacteristic::HasPositionDependentContentWidth); }
    bool hasStrongDirectionalityContent() const { return m_contentCharacteristicSet.contains(ContentCharacteristic::HasStrongDirectionalityContent); }

    void setContent(String newContent, OptionSet<ContentCharacteristic>);
    void setContentCharacteristic(OptionSet<ContentCharacteristic> contentCharacteristicSet) { m_contentCharacteristicSet = contentCharacteristicSet; }

private:
    String m_content;
    bool m_isCombined { false };
    OptionSet<ContentCharacteristic> m_contentCharacteristicSet;
};

inline void InlineTextBox::setContent(String newContent, OptionSet<ContentCharacteristic> contentCharacteristicSet)
{
    m_content = newContent;
    m_contentCharacteristicSet = contentCharacteristicSet;
}

}
}

SPECIALIZE_TYPE_TRAITS_LAYOUT_BOX(InlineTextBox, isInlineTextBox())

