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

#if ENABLE(VIDEO) && ENABLE(DATACUE_VALUE)

#include "SerializedPlatformDataCue.h"
#include "SerializedPlatformDataCueValue.h"
#include <wtf/HashSet.h>

namespace WebCore {

class SerializedPlatformDataCueMac final : public SerializedPlatformDataCue {
public:
    SerializedPlatformDataCueMac(SerializedPlatformDataCueValue&&);
    virtual ~SerializedPlatformDataCueMac() = default;

    JSC::JSValue deserialize(JSC::JSGlobalObject*) const final;
    RefPtr<ArrayBuffer> data() const final;
    bool isEqual(const SerializedPlatformDataCue&) const final;
    PlatformType platformType() const final { return PlatformType::ObjC; }
    bool encodingRequiresPlatformData() const final { return true; }

    WEBCORE_EXPORT SerializedPlatformDataCueValue encodableValue() const final;

    WEBCORE_EXPORT static const HashSet<RetainPtr<Class>>& allowedClassesForNativeValues();

private:
    SerializedPlatformDataCueValue m_value;
};

SerializedPlatformDataCueMac* toSerializedPlatformDataCueMac(SerializedPlatformDataCue*);
const SerializedPlatformDataCueMac* toSerializedPlatformDataCueMac(const SerializedPlatformDataCue*);

} // namespace WebCore

#endif
