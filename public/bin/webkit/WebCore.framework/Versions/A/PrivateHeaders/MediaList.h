/*
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2004, 2006, 2008, 2009, 2010, 2012 Apple Inc. All rights reserved.
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
 */

#pragma once

#include "ExceptionOr.h"
#include "MediaQuery.h"
#include "MediaQueryParserContext.h"
#include <memory>
#include <wtf/Forward.h>
#include <wtf/Vector.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class CSSRule;
class CSSStyleSheet;

class MediaList final : public RefCounted<MediaList> {
public:
    static Ref<MediaList> create(CSSStyleSheet* parentSheet)
    {
        return adoptRef(*new MediaList(parentSheet));
    }
    static Ref<MediaList> create(CSSRule* parentRule)
    {
        return adoptRef(*new MediaList(parentRule));
    }

    WEBCORE_EXPORT ~MediaList();

    bool isSupportedPropertyIndex(unsigned index) const { return index < length(); }
    WEBCORE_EXPORT unsigned length() const;
    WEBCORE_EXPORT String item(unsigned index) const;
    WEBCORE_EXPORT ExceptionOr<void> deleteMedium(const String& oldMedium);
    WEBCORE_EXPORT void appendMedium(const String& newMedium);

    WEBCORE_EXPORT String mediaText() const;
    WEBCORE_EXPORT void setMediaText(const String&);

    CSSRule* parentRule() const { return m_parentRule; }
    CSSStyleSheet* parentStyleSheet() const { return m_parentStyleSheet; }
    void detachFromParent();

    const MQ::MediaQueryList& mediaQueries() const;

private:
    MediaList(CSSStyleSheet* parentSheet);
    MediaList(CSSRule* parentRule);

    void setMediaQueries(MQ::MediaQueryList&&);

    CSSStyleSheet* m_parentStyleSheet { nullptr };
    CSSRule* m_parentRule { nullptr };
    std::optional<MQ::MediaQueryList> m_detachedMediaQueries;
};

WTF::TextStream& operator<<(WTF::TextStream&, const MediaList&);

} // namespace
