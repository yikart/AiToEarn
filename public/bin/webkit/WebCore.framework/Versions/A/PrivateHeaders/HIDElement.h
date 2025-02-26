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

#if PLATFORM(MAC)

#include <IOKit/hid/IOHIDDevice.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class HIDElement {
    WTF_MAKE_TZONE_ALLOCATED(HIDElement);
public:
    explicit HIDElement(IOHIDElementRef);

    IOHIDElementRef rawElement() const { return m_rawElement.get(); }

    CFIndex physicalMin() const { return m_physicalMin; }
    CFIndex physicalMax() const { return m_physicalMax; }
    CFIndex physicalValue() const { return m_physicalValue; }
    uint32_t usage() const { return m_usage; }
    uint32_t usagePage() const { return m_usagePage; }
    uint64_t fullUsage() const { return ((uint64_t)m_usagePage) << 32 | m_usage; }
    IOHIDElementCookie cookie() const { return m_cookie; }

    void valueChanged(IOHIDValueRef);

private:
    CFIndex m_physicalMin;
    CFIndex m_physicalMax;
    CFIndex m_physicalValue;
    uint32_t m_usage;
    uint32_t m_usagePage;
    IOHIDElementCookie m_cookie;
    RetainPtr<IOHIDElementRef> m_rawElement;
};


} // namespace WebCore

#endif // PLATFORM(MAC)
