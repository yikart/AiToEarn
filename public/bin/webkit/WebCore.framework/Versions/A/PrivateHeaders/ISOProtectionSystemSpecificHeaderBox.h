/*
 * Copyright (C) 2017-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2018 Metrological Group B.V.
 * Copyright (C) 2018 Igalia S.L
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

#include "ISOBox.h"

namespace WebCore {

class WEBCORE_EXPORT ISOProtectionSystemSpecificHeaderBox : public ISOFullBox {
public:
    using KeyID = Vector<uint8_t>;

    ISOProtectionSystemSpecificHeaderBox();
    ~ISOProtectionSystemSpecificHeaderBox();

    static FourCC boxTypeName() { return "pssh"; }

    static std::optional<Vector<uint8_t>> peekSystemID(JSC::DataView&, unsigned offset);

    Vector<uint8_t> systemID() const { return m_systemID; }
    Vector<KeyID> keyIDs() const { return m_keyIDs; }
    Vector<uint8_t> data() const { return m_data; }

    bool parse(JSC::DataView&, unsigned& offset) override;

protected:
    Vector<uint8_t> m_systemID;
    Vector<KeyID> m_keyIDs;
    Vector<uint8_t> m_data;
};

}

SPECIALIZE_TYPE_TRAITS_ISOBOX(ISOProtectionSystemSpecificHeaderBox)
