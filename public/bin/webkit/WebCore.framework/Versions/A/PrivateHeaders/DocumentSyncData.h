/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "DOMAudioSession.h"
#include "DocumentClasses.h"
#include "SecurityOrigin.h"
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>
#include <wtf/TZoneMallocInlines.h>
#include <wtf/URL.h>

namespace WebCore {

struct ProcessSyncData;

class DocumentSyncData : public RefCounted<DocumentSyncData> {
WTF_MAKE_TZONE_ALLOCATED_INLINE(DocumentSyncData);
public:
    template<typename... Args>
    static Ref<DocumentSyncData> create(Args&&... args)
    {
        return adoptRef(*new DocumentSyncData(std::forward<Args>(args)...));
    }
    static Ref<DocumentSyncData> create() { return adoptRef(*new DocumentSyncData); }
    void update(const ProcessSyncData&);

    OptionSet<WebCore::DocumentClass> documentClasses = { };
    RefPtr<WebCore::SecurityOrigin> documentSecurityOrigin = { };
    URL documentURL = { };
    bool userDidInteractWithPage = { };
#if ENABLE(DOM_AUDIO_SESSION)
    WebCore::DOMAudioSessionType audioSessionType = { };
#endif
    bool isAutofocusProcessed = { };

private:
    DocumentSyncData() = default;
    WEBCORE_EXPORT DocumentSyncData(
        OptionSet<WebCore::DocumentClass>
      , RefPtr<WebCore::SecurityOrigin>
      , URL
      , bool
#if ENABLE(DOM_AUDIO_SESSION)
      , WebCore::DOMAudioSessionType
#endif
      , bool
    );
};

} // namespace WebCore
