/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "CSSParserMode.h"
#include <wtf/HashFunctions.h>
#include <wtf/Hasher.h>

namespace WebCore {

struct CSSParserContext;
class Document;

struct CSSSelectorParserContext {
    CSSParserMode mode { CSSParserMode::HTMLStandardMode };
    bool cssNestingEnabled : 1 { false };
#if ENABLE(SERVICE_CONTROLS)
    bool imageControlsEnabled : 1 { false };
#endif
    bool popoverAttributeEnabled : 1 { false };
    bool targetTextPseudoElementEnabled : 1 { false };
    bool thumbAndTrackPseudoElementsEnabled : 1 { false };
    bool viewTransitionsEnabled : 1 { false };
    bool viewTransitionClassesEnabled : 1 { false };
    bool viewTransitionTypesEnabled : 1 { false };

    bool isHashTableDeletedValue : 1 { false };

    CSSSelectorParserContext() = default;
    CSSSelectorParserContext(const CSSParserContext&);
    explicit CSSSelectorParserContext(const Document&);

    friend bool operator==(const CSSSelectorParserContext&, const CSSSelectorParserContext&) = default;
};

void add(Hasher&, const CSSSelectorParserContext&);

struct CSSSelectorParserContextHash {
    static unsigned hash(const CSSSelectorParserContext& context) { return computeHash(context); }
    static bool equal(const CSSSelectorParserContext& a, const CSSSelectorParserContext& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = false;
};

} // namespace WebCore

namespace WTF {

template<> struct HashTraits<WebCore::CSSSelectorParserContext> : GenericHashTraits<WebCore::CSSSelectorParserContext> {
    static void constructDeletedValue(WebCore::CSSSelectorParserContext& slot) { slot.isHashTableDeletedValue = true; }
    static bool isDeletedValue(const WebCore::CSSSelectorParserContext& value) { return value.isHashTableDeletedValue; }
    static WebCore::CSSSelectorParserContext emptyValue() { return { }; }
};

template<> struct DefaultHash<WebCore::CSSSelectorParserContext> : WebCore::CSSSelectorParserContextHash { };

} // namespace WTF
