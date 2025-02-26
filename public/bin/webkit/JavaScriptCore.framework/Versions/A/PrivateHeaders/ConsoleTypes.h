/*
 * Copyright (C) 2011 Apple Inc. All rights reserved.
 * Copyright (C) 2012 Google Inc. All rights reserved.
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

#include <wtf/Forward.h>

namespace JSC {

enum class MessageSource : uint8_t {
    XML,
    JS,
    Network,
    ConsoleAPI,
    Storage,
    AppCache,
    Rendering,
    CSS,
    Security,
    ContentBlocker,
    Media,
    MediaSource,
    WebRTC,
    ITPDebug,
    PrivateClickMeasurement,
    PaymentRequest,
    Other,
};

enum class MessageType : uint8_t {
    Log,
    Dir,
    DirXML,
    Table,
    Trace,
    StartGroup,
    StartGroupCollapsed,
    EndGroup,
    Clear,
    Assert,
    Timing,
    Profile,
    ProfileEnd,
    Image,
};

enum class MessageLevel : uint8_t {
    Log,
    Warning,
    Error,
    Debug,
    Info,
};

} // namespace JSC

using JSC::MessageSource;
using JSC::MessageLevel;
