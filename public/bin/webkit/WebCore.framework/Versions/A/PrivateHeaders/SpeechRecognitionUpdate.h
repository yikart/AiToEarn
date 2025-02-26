/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include "SpeechRecognitionConnectionClientIdentifier.h"
#include "SpeechRecognitionError.h"
#include "SpeechRecognitionResultData.h"
#include <variant>
#include <wtf/ArgumentCoder.h>

namespace WebCore {

enum class SpeechRecognitionUpdateType : uint8_t {
    Start,
    AudioStart,
    SoundStart,
    SpeechStart,
    SpeechEnd,
    SoundEnd,
    AudioEnd,
    Result,
    NoMatch,
    Error,
    End
};

String convertEnumerationToString(SpeechRecognitionUpdateType);

class SpeechRecognitionUpdate {
public:
    WEBCORE_EXPORT static SpeechRecognitionUpdate create(SpeechRecognitionConnectionClientIdentifier, SpeechRecognitionUpdateType);
    WEBCORE_EXPORT static SpeechRecognitionUpdate createError(SpeechRecognitionConnectionClientIdentifier, const SpeechRecognitionError&);
    WEBCORE_EXPORT static SpeechRecognitionUpdate createResult(SpeechRecognitionConnectionClientIdentifier, const Vector<SpeechRecognitionResultData>&);

    SpeechRecognitionConnectionClientIdentifier clientIdentifier() const { return m_clientIdentifier; }
    SpeechRecognitionUpdateType type() const { return m_type; }
    WEBCORE_EXPORT SpeechRecognitionError error() const;
    WEBCORE_EXPORT Vector<SpeechRecognitionResultData> result() const;

private:
    friend struct IPC::ArgumentCoder<SpeechRecognitionUpdate, void>;
    using Content = std::variant<std::monostate, SpeechRecognitionError, Vector<SpeechRecognitionResultData>>;
    WEBCORE_EXPORT SpeechRecognitionUpdate(SpeechRecognitionConnectionClientIdentifier, SpeechRecognitionUpdateType, Content);

    SpeechRecognitionConnectionClientIdentifier m_clientIdentifier;
    SpeechRecognitionUpdateType m_type;
    Content m_content;
};


} // namespace WebCore

namespace WTF {

template<typename> struct LogArgument;

template<> struct LogArgument<WebCore::SpeechRecognitionUpdateType> {
    static String toString(const WebCore::SpeechRecognitionUpdateType type)
    {
        return convertEnumerationToString(type);
    }
};

} // namespace WTF
