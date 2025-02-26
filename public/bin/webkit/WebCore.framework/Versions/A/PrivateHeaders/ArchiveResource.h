/*
 * Copyright (C) 2008, 2010 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ArchiveError.h"
#include "SubstituteResource.h"

namespace WebCore {

class ArchiveResource : public SubstituteResource {
public:
    static RefPtr<ArchiveResource> create(RefPtr<FragmentedSharedBuffer>&&, const URL&, const ResourceResponse&);
    WEBCORE_EXPORT static RefPtr<ArchiveResource> create(RefPtr<FragmentedSharedBuffer>&&, const URL&, const String& mimeType, const String& textEncoding, const String& frameName, const ResourceResponse& = ResourceResponse(), const String& fileName = { });

    const String& mimeType() const { return m_mimeType; }
    const String& textEncoding() const { return m_textEncoding; }
    const String& frameName() const { return m_frameName; }
    const String& relativeFilePath() const { return m_relativeFilePath; }

    void ignoreWhenUnarchiving() { m_shouldIgnoreWhenUnarchiving = true; }
    bool shouldIgnoreWhenUnarchiving() const { return m_shouldIgnoreWhenUnarchiving; }
    void setRelativeFilePath(const String& relativeFilePath) { m_relativeFilePath = relativeFilePath; }
    Expected<String, ArchiveError> saveToDisk(const String& directory);

private:
    ArchiveResource(Ref<FragmentedSharedBuffer>&&, const URL&, const String& mimeType, const String& textEncoding, const String& frameName, const ResourceResponse&, const String& fileName = { });

    String m_mimeType;
    String m_textEncoding;
    String m_frameName;
    String m_relativeFilePath;

    bool m_shouldIgnoreWhenUnarchiving;
};

} // namespace WebCore
