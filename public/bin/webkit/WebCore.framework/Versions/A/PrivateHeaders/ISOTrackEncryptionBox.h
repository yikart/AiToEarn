/*
 * Copyright (C) 2017-2023 Apple Inc. All rights reserved.
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

class WEBCORE_EXPORT ISOTrackEncryptionBox final : public ISOFullBox {
public:
    ISOTrackEncryptionBox();
    ~ISOTrackEncryptionBox();

    static FourCC boxTypeName() { return "tenc"; }

    std::optional<int8_t> defaultCryptByteBlock() const { return m_defaultCryptByteBlock; }
    std::optional<int8_t> defaultSkipByteBlock() const { return m_defaultSkipByteBlock; }
    int8_t defaultIsProtected() const { return m_defaultIsProtected; }
    int8_t defaultPerSampleIVSize() const { return m_defaultPerSampleIVSize; }
    Vector<uint8_t> defaultKID() const { return m_defaultKID; }
    Vector<uint8_t> defaultConstantIV() const { return m_defaultConstantIV; }

    bool parseWithoutTypeAndSize(JSC::DataView&);

    bool parse(JSC::DataView&, unsigned& offset) override;

private:
    bool parsePayload(JSC::DataView&, unsigned& offset);

    std::optional<int8_t> m_defaultCryptByteBlock;
    std::optional<int8_t> m_defaultSkipByteBlock;
    int8_t m_defaultIsProtected { 0 };
    int8_t m_defaultPerSampleIVSize { 0 };
    Vector<uint8_t> m_defaultKID;
    Vector<uint8_t> m_defaultConstantIV;
};

}

SPECIALIZE_TYPE_TRAITS_ISOBOX(ISOTrackEncryptionBox)
