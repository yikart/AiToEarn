/*
 * Copyright (C) 2008-2017 Apple Inc. All rights reserved.
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

#include "ArchiveResource.h"
#include <wtf/HashSet.h>

namespace WebCore {

class Archive : public RefCounted<Archive> {
public:
    virtual ~Archive();

    virtual bool shouldLoadFromArchiveOnly() const = 0;
    virtual bool shouldOverrideBaseURL() const = 0;
    virtual bool shouldUseMainResourceEncoding() const = 0;
    virtual bool shouldUseMainResourceURL() const = 0;

    ArchiveResource* mainResource() { return m_mainResource.get(); }
    const Vector<Ref<ArchiveResource>>& subresources() const { return m_subresources; }
    const Vector<Ref<Archive>>& subframeArchives() const { return m_subframeArchives; }
    WEBCORE_EXPORT Expected<Vector<String>, ArchiveError> saveResourcesToDisk(const String& directory);

protected:
    // These methods are meant for subclasses for different archive types to add resources in to the archive,
    // and should not be exposed as archives should be immutable to clients
    void setMainResource(Ref<ArchiveResource>&& mainResource) { m_mainResource = WTFMove(mainResource); }
    void addSubresource(Ref<ArchiveResource>&& resource) { m_subresources.append(WTFMove(resource)); }
    void addSubframeArchive(Ref<Archive>&& subframeArchive) { m_subframeArchives.append(WTFMove(subframeArchive)); }

    void clearAllSubframeArchives();

private:
    void clearAllSubframeArchives(HashSet<Archive*>&);

    RefPtr<ArchiveResource> m_mainResource;
    Vector<Ref<ArchiveResource>> m_subresources;
    Vector<Ref<Archive>> m_subframeArchives;
};

} // namespace WebCore
