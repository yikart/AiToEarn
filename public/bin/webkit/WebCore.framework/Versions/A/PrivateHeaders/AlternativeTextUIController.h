/*
 * Copyright (C) 2012 Apple Inc. All rights reserved.
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

#import "AlternativeTextContextController.h"
#import <wtf/TZoneMalloc.h>

@class NSView;

namespace WebCore {

class FloatRect;

class AlternativeTextUIController {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(AlternativeTextUIController, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT std::optional<DictationContext> addAlternatives(PlatformTextAlternatives *);
    WEBCORE_EXPORT void replaceAlternatives(PlatformTextAlternatives *, DictationContext);
    WEBCORE_EXPORT void removeAlternatives(DictationContext);
    WEBCORE_EXPORT void clear();

    WEBCORE_EXPORT PlatformTextAlternatives *alternativesForContext(DictationContext);

#if USE(APPKIT)
    using AcceptanceHandler = void (^)(NSString *);
    WEBCORE_EXPORT void showAlternatives(NSView *, const FloatRect& boundingBoxOfPrimaryString, DictationContext, AcceptanceHandler);
#endif

private:
#if USE(APPKIT)
    void handleAcceptedAlternative(NSString *, DictationContext, PlatformTextAlternatives *);
    void dismissAlternatives();
#endif

    AlternativeTextContextController m_contextController;
#if USE(APPKIT)
    RetainPtr<NSView> m_view;
#endif
};

} // namespace WebCore
