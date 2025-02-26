/*
 * Copyright (C) 2014-2020 Apple Inc. All rights reserved.
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

#if ENABLE(VIDEO)

#include "SerializedPlatformDataCueValue.h"
#include <JavaScriptCore/ArrayBuffer.h>
#include <JavaScriptCore/JSCJSValue.h>
#include <wtf/RefCounted.h>

namespace WebCore {

class SerializedPlatformDataCue : public RefCounted<SerializedPlatformDataCue> {
public:
    WEBCORE_EXPORT static Ref<SerializedPlatformDataCue> create(SerializedPlatformDataCueValue&&);

    virtual ~SerializedPlatformDataCue() = default;

    virtual JSC::JSValue deserialize(JSC::JSGlobalObject*) const { return JSC::jsNull(); }
    virtual RefPtr<JSC::ArrayBuffer> data() const { return { }; }
    virtual bool isEqual(const SerializedPlatformDataCue&) const { return false; }

    enum class PlatformType : bool { None, ObjC };
    virtual PlatformType platformType() const { return PlatformType::None; }

    virtual bool encodingRequiresPlatformData() const { return false; }

    virtual SerializedPlatformDataCueValue encodableValue() const { return { }; }

protected:
    SerializedPlatformDataCue() = default;
};

} // namespace WebCore

#endif
