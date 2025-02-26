/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2003-2017 Apple Inc. All right reserved.
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

#include <unicode/uchar.h>
#include <wtf/RefPtr.h>
#include <wtf/ThreadSafeRefCounted.h>

namespace WebCore {

enum BidiEmbeddingSource { FromStyleOrDOM, FromUnicode };

// Used to keep track of explicit embeddings.
class BidiContext : public ThreadSafeRefCounted<BidiContext> {
public:
    WEBCORE_EXPORT static Ref<BidiContext> create(unsigned char level, UCharDirection, bool override = false, BidiEmbeddingSource = FromStyleOrDOM, BidiContext* parent = nullptr);

    BidiContext* parent() const { return m_parent.get(); }
    unsigned char level() const { return m_level; }
    UCharDirection dir() const { return static_cast<UCharDirection>(m_direction); }
    bool override() const { return m_override; }
    BidiEmbeddingSource source() const { return static_cast<BidiEmbeddingSource>(m_source); }

    WEBCORE_EXPORT Ref<BidiContext> copyStackRemovingUnicodeEmbeddingContexts();

private:
    BidiContext(unsigned char level, UCharDirection, bool override, BidiEmbeddingSource, BidiContext* parent);

    static Ref<BidiContext> createUncached(unsigned char level, UCharDirection, bool override, BidiEmbeddingSource, BidiContext* parent);

    unsigned m_level : 6; // The maximium bidi level is 62: http://unicode.org/reports/tr9/#Explicit_Levels_and_Directions
    unsigned m_direction : 5; // Direction
    unsigned m_override : 1;
    unsigned m_source : 1; // BidiEmbeddingSource
    RefPtr<BidiContext> m_parent;
};

inline unsigned char nextGreaterOddLevel(unsigned char level)
{
    return (level + 1) | 1;
}

inline unsigned char nextGreaterEvenLevel(unsigned char level)
{
    return (level + 2) & ~1;
}

bool operator==(const BidiContext&, const BidiContext&);

} // namespace WebCore
