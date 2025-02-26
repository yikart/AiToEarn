/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003-2017 Apple Inc. All rights reserved.
 * Copyright (C) 2006 Graham Dennis (graham.dennis@gmail.com)
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "BorderValue.h"
#include "GapLength.h"
#include "RenderStyleConstants.h"
#include <wtf/RefCounted.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

// CSS3 Multi Column Layout

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(StyleMultiColData);
class StyleMultiColData : public RefCounted<StyleMultiColData> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(StyleMultiColData);
public:
    static Ref<StyleMultiColData> create() { return adoptRef(*new StyleMultiColData); }
    Ref<StyleMultiColData> copy() const;
    
    bool operator==(const StyleMultiColData&) const;

#if !LOG_DISABLED
    void dumpDifferences(TextStream&, const StyleMultiColData&) const;
#endif

    unsigned short ruleWidth() const
    {
        if (rule.style() == BorderStyle::None || rule.style() == BorderStyle::Hidden)
            return 0; 
        return rule.width();
    }

    float width { 0 };
    unsigned short count;
    BorderValue rule;
    Style::Color visitedLinkColumnRuleColor;

    bool autoWidth : 1;
    bool autoCount : 1;
    unsigned fill : 1; // ColumnFill
    unsigned columnSpan : 1; // ColumnSpan
    unsigned axis : 2; // ColumnAxis
    unsigned progression : 2; // ColumnProgression

private:
    StyleMultiColData();
    StyleMultiColData(const StyleMultiColData&);
};

} // namespace WebCore
