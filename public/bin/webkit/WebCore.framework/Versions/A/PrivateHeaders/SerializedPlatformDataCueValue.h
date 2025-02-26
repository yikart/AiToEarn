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

#if ENABLE(VIDEO)

#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/StringHash.h>

OBJC_CLASS AVMetadataItem;
OBJC_CLASS NSData;
OBJC_CLASS NSDate;
OBJC_CLASS NSDictionary;
OBJC_CLASS NSLocale;
OBJC_CLASS NSNumber;
OBJC_CLASS NSString;

namespace WebCore {

class SerializedPlatformDataCueValue {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(SerializedPlatformDataCueValue);
public:
    struct Data {
#if PLATFORM(COCOA)
        String type;
        HashMap<String, String> otherAttributes;
        String key;
        RetainPtr<NSLocale> locale;
        std::variant<std::nullptr_t, RetainPtr<NSString>, RetainPtr<NSDate>, RetainPtr<NSNumber>, RetainPtr<NSData>> value;
        bool operator==(const Data&) const;
#endif
    };

    SerializedPlatformDataCueValue() = default;
    SerializedPlatformDataCueValue(std::optional<Data>&& data)
        : m_data(WTFMove(data)) { }
#if PLATFORM(COCOA)
    SerializedPlatformDataCueValue(AVMetadataItem *);
    RetainPtr<NSDictionary> toNSDictionary() const;
    bool operator==(const SerializedPlatformDataCueValue&) const;
#endif

    const std::optional<Data>& data() const { return m_data; }
private:
    std::optional<Data> m_data;
};

} // namespace WebCore

#endif // ENABLE(VIDEO)
