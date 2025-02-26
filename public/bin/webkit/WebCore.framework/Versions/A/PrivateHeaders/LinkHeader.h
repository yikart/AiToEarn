/*
 * Copyright 2015 The Chromium Authors. All rights reserved.
 * Copyright (C) 2016 Akamai Technologies Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/Forward.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class LinkHeader {
public:
    template<typename CharacterType> LinkHeader(StringParsingBuffer<CharacterType>&);

    const String& url() const { return m_url; }
    const String& rel() const { return m_rel; }
    const String& as() const { return m_as; }
    const String& mimeType() const { return m_mimeType; }
    const String& media() const { return m_media; }
    const String& crossOrigin() const { return m_crossOrigin; }
    const String& imageSrcSet() const { return m_imageSrcSet; }
    const String& imageSizes() const { return m_imageSizes; }
    const String& nonce() const { return m_nonce; }
    const String& referrerPolicy() const { return m_referrerPolicy; }
    const String& fetchPriorityHint() const { return m_fetchPriorityHint; }
    bool valid() const { return m_isValid; }
    bool isViewportDependent() const { return !media().isEmpty() || !imageSrcSet().isEmpty() || !imageSizes().isEmpty(); }

    enum LinkParameterName {
        LinkParameterRel,
        LinkParameterAnchor,
        LinkParameterTitle,
        LinkParameterMedia,
        LinkParameterType,
        LinkParameterRev,
        LinkParameterHreflang,
        // Beyond this point, only link-extension parameters
        LinkParameterUnknown,
        LinkParameterCrossOrigin,
        LinkParameterAs,
        LinkParameterImageSrcSet,
        LinkParameterImageSizes,
        LinkParameterNonce,
        LinkParameterReferrerPolicy,
        LinkParameterFetchPriority,
    };

private:
    void setValue(LinkParameterName, String&& value);

    String m_url;
    String m_rel;
    String m_as;
    String m_mimeType;
    String m_media;
    String m_crossOrigin;
    String m_imageSrcSet;
    String m_imageSizes;
    String m_nonce;
    String m_referrerPolicy;
    String m_fetchPriorityHint;
    bool m_isValid { true };
};

class LinkHeaderSet {
public:
    WEBCORE_EXPORT LinkHeaderSet(const String& header);

    Vector<LinkHeader>::const_iterator begin() const { return m_headerSet.begin(); }
    Vector<LinkHeader>::const_iterator end() const { return m_headerSet.end(); }

private:
    Vector<LinkHeader> m_headerSet;
};

} // namespace WebCore

