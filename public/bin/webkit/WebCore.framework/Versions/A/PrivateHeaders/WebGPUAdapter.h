/*
 * Copyright (C) 2021-2023 Apple Inc. All rights reserved.
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

#include "WebGPUDeviceDescriptor.h"
#include "WebGPUSupportedFeatures.h"
#include "WebGPUSupportedLimits.h"
#include <optional>
#include <wtf/CompletionHandler.h>
#include <wtf/Ref.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore::WebGPU {

class Device;

class Adapter : public RefCountedAndCanMakeWeakPtr<Adapter> {
public:
    virtual ~Adapter() = default;

    const String& name() const { return m_name; }
    SupportedFeatures& features() const { return m_features; }
    SupportedLimits& limits() const { return m_limits; }
    bool isFallbackAdapter() const { return m_isFallbackAdapter; }
    virtual bool xrCompatible() = 0;

    virtual void requestDevice(const DeviceDescriptor&, CompletionHandler<void(RefPtr<Device>&&)>&&) = 0;

protected:
    Adapter(String&& name, SupportedFeatures& features, SupportedLimits& limits, bool isFallbackAdapter)
        : m_name(WTFMove(name))
        , m_features(features)
        , m_limits(limits)
        , m_isFallbackAdapter(isFallbackAdapter)
    {
    }

private:
    Adapter(const Adapter&) = delete;
    Adapter(Adapter&&) = delete;
    Adapter& operator=(const Adapter&) = delete;
    Adapter& operator=(Adapter&&) = delete;

    String m_name;
    Ref<SupportedFeatures> m_features;
    Ref<SupportedLimits> m_limits;
    bool m_isFallbackAdapter;
};

} // namespace WebCore::WebGPU
