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

#include <wtf/Forward.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>

typedef struct CF_BRIDGED_TYPE(id) __IOHIDDevice * IOHIDDeviceRef;

namespace WebCore {

class HIDElement;

class HIDDevice {
    WTF_MAKE_TZONE_ALLOCATED(HIDDevice);
public:
    explicit HIDDevice(IOHIDDeviceRef);

    IOHIDDeviceRef rawElement() const { return m_rawDevice.get(); }

    // Walks the collection tree of all elements in the device as presented by IOKit.
    // Adds each unique input element to the vector in the tree traversal order it was encountered.
    // "Unique" is defined as "having a different IOHIDElementCookie from any previously added element"
    Vector<HIDElement> uniqueInputElementsInDeviceTreeOrder() const;

    uint16_t vendorID() const { return m_vendorID; }
    uint16_t productID() const { return m_productID; }
    uint32_t fullProductIdentifier() const { return m_vendorID << 16 | m_productID; }
    const String& productName() const { return m_productName; }

private:
    RetainPtr<IOHIDDeviceRef> m_rawDevice;

    uint16_t m_vendorID;
    uint16_t m_productID;
    String m_productName;
};

} // namespace WebCore

#endif // PLATFORM(MAC)
