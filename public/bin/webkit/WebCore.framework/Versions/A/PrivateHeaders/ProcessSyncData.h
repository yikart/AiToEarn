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
#include <variant>
#include <wtf/URL.h>

namespace WebCore {

enum class ProcessSyncDataType : uint8_t {
#if ENABLE(DOM_AUDIO_SESSION)
    AudioSessionType = 0,
#endif
    DocumentClasses = 1,
    DocumentSecurityOrigin = 2,
    DocumentURL = 3,
    UserDidInteractWithPage = 4,
    IsAutofocusProcessed = 5,
};

static const ProcessSyncDataType allDocumentSyncDataTypes[] = {
    ProcessSyncDataType::DocumentClasses
    , ProcessSyncDataType::DocumentSecurityOrigin
    , ProcessSyncDataType::DocumentURL
    , ProcessSyncDataType::UserDidInteractWithPage
#if ENABLE(DOM_AUDIO_SESSION)
    , ProcessSyncDataType::AudioSessionType
#endif
    , ProcessSyncDataType::IsAutofocusProcessed
};

#if !ENABLE(DOM_AUDIO_SESSION)
using DOMAudioSessionType = bool;
#endif

using ProcessSyncDataVariant = std::variant<
    WebCore::DOMAudioSessionType,
    OptionSet<WebCore::DocumentClass>,
    RefPtr<WebCore::SecurityOrigin>,
    URL,
    bool,
    bool
>;

struct ProcessSyncData {
    ProcessSyncDataType type;
    ProcessSyncDataVariant value;
};

}; // namespace WebCore
