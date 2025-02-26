/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include <wtf/AbstractRefCounted.h>
#include <wtf/Ref.h>

namespace WebCore {
    
enum class AudioHardwareActivityType {
    Unknown,
    IsActive,
    IsInactive
};

class AudioHardwareListener : public AbstractRefCounted {
public:
    class Client {
    public:
        virtual ~Client() = default;
        virtual void audioHardwareDidBecomeActive() = 0;
        virtual void audioHardwareDidBecomeInactive() = 0;
        virtual void audioOutputDeviceChanged() = 0;
    };

    using CreationFunction = Function<Ref<AudioHardwareListener>(AudioHardwareListener::Client&)>;
    WEBCORE_EXPORT static void setCreationFunction(CreationFunction&&);
    WEBCORE_EXPORT static void resetCreationFunction();

    WEBCORE_EXPORT static Ref<AudioHardwareListener> create(Client&);
    virtual ~AudioHardwareListener() = default;
    
    AudioHardwareActivityType hardwareActivity() const { return m_activity; }

    struct BufferSizeRange {
        size_t minimum { 0 };
        size_t maximum { 0 };
        operator bool() const { return minimum && maximum; }
        size_t nearest(size_t value) const { return std::min(std::max(value, minimum), maximum); }
    };
    BufferSizeRange supportedBufferSizes() const { return m_supportedBufferSizes; }

protected:
    WEBCORE_EXPORT AudioHardwareListener(Client&);

    void setHardwareActivity(AudioHardwareActivityType activity) { m_activity = activity; }
    void setSupportedBufferSizes(BufferSizeRange sizes) { m_supportedBufferSizes = sizes; }

    Client& m_client;
    AudioHardwareActivityType m_activity { AudioHardwareActivityType::Unknown };
    BufferSizeRange m_supportedBufferSizes;
};

}
