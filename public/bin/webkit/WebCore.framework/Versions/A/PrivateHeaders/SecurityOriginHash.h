/*
 * Copyright (C) 2008 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/Hasher.h>
#include <wtf/URL.h>
#include "SecurityOrigin.h"
#include <wtf/RefPtr.h>

namespace WebCore {

struct SecurityOriginHash {
    static unsigned hash(const SecurityOrigin* origin)
    {
        return computeHash(*origin);
    }
    static unsigned hash(const RefPtr<SecurityOrigin>& origin)
    {
        return hash(origin.get());
    }

    static bool equal(const SecurityOrigin* a, const SecurityOrigin* b)
    {
        if (!a || !b)
            return a == b;
        return a->isSameSchemeHostPort(*b);
    }
    static bool equal(const SecurityOrigin* a, const RefPtr<SecurityOrigin>& b)
    {
        return equal(a, b.get());
    }
    static bool equal(const RefPtr<SecurityOrigin>& a, const SecurityOrigin* b)
    {
        return equal(a.get(), b);
    }
    static bool equal(const RefPtr<SecurityOrigin>& a, const RefPtr<SecurityOrigin>& b)
    {
        return equal(a.get(), b.get());
    }

    static const bool safeToCompareToEmptyOrDeleted = false;
};

} // namespace WebCore

namespace WTF {

template<typename> struct DefaultHash;
template<> struct DefaultHash<RefPtr<WebCore::SecurityOrigin>> : WebCore::SecurityOriginHash { };

} // namespace WTF
