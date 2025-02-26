/*
 * Copyright (C) 2021 Metrological Group B.V.
 * Copyright (C) 2021 Igalia S.L.
 * Copyright (C) 2021 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "FontTaggedSettings.h"
#include <wtf/WeakPtr.h>
#include <wtf/text/AtomString.h>

namespace WebCore {
class FontLoadRequestClient;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::FontLoadRequestClient> : std::true_type { };
}

namespace WebCore {

class Font;
class FontCreationContext;
class FontDescription;
class FontLoadRequest;
struct FontSelectionSpecifiedCapabilities;

class FontLoadRequestClient : public CanMakeWeakPtr<FontLoadRequestClient> {
public:
    virtual ~FontLoadRequestClient() = default;
    virtual void fontLoaded(FontLoadRequest&) { }
};

class FontLoadRequest {
public:
    virtual ~FontLoadRequest() = default;

    virtual const URL& url() const = 0;
    virtual bool isPending() const = 0;
    virtual bool isLoading() const = 0;
    virtual bool errorOccurred() const = 0;

    virtual bool ensureCustomFontData() = 0;
    virtual RefPtr<Font> createFont(const FontDescription&, bool syntheticBold, bool syntheticItalic, const FontCreationContext&) = 0;

    virtual void setClient(FontLoadRequestClient*) = 0;

    virtual bool isCachedFontLoadRequest() const { return false; }
    virtual bool isWorkerFontLoadRequest() const { return false; }
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_FONTLOADREQUEST(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(ToValueTypeName) \
    static bool isType(const WebCore::FontLoadRequest& request) { return request.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()
