/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2003, 2004, 2006, 2007, 2008, 2009, 2010, 2011, 2016 Apple Inc. All right reserved.
 * Copyright (C) 2010 Google Inc. All rights reserved.
 * Copyright (C) 2013 ChangSeok Oh <shivamidow@gmail.com>
 * Copyright (C) 2013 Adobe Systems Inc. All right reserved.
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

#include <wtf/Vector.h>

namespace WebCore {

class LegacyInlineIterator;
class RenderBoxModelObject;
class RenderText;

struct BidiRun;
struct BidiIsolatedRun;

template <class Iterator, class Run> class BidiResolver;
template <class Iterator, class Run, class IsolateRun> class BidiResolverWithIsolate;
template <class Iterator> class WhitespaceCollapsingState;
typedef BidiResolverWithIsolate<LegacyInlineIterator, BidiRun, BidiIsolatedRun> InlineBidiResolver;
typedef WhitespaceCollapsingState<LegacyInlineIterator> LineWhitespaceCollapsingState;

class TrailingObjects {
public:
    void setTrailingWhitespace(RenderText& whitespace) { m_whitespace = &whitespace; }
    void clear()
    {
        m_whitespace = { };
        m_boxes.shrink(0); // Use shrink(0) instead of clear() to retain our capacity.
    }

    void appendBoxIfNeeded(RenderBoxModelObject& box)
    {
        if (m_whitespace)
            m_boxes.append(box);
    }

    enum class CollapseFirstSpace : bool { No, Yes };
    void updateWhitespaceCollapsingTransitionsForTrailingBoxes(LineWhitespaceCollapsingState&, const LegacyInlineIterator& lBreak, CollapseFirstSpace);

private:
    RenderText* m_whitespace { nullptr };
    Vector<std::reference_wrapper<RenderBoxModelObject>, 4> m_boxes;
};

} // namespace WebCore
