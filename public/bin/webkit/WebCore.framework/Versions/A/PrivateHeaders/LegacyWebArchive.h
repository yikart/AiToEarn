/*
 * Copyright (C) 2008, 2009 Apple Inc. All rights reserved.
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

#include "Archive.h"
#include "MarkupExclusionRule.h"
#include <wtf/Function.h>

namespace WebCore {

class LocalFrame;
class Node;

struct MarkupExclusionRule;
struct SimpleRange;

class LegacyWebArchive final : public Archive {
public:
    WEBCORE_EXPORT static Ref<LegacyWebArchive> create();
    WEBCORE_EXPORT static RefPtr<LegacyWebArchive> create(FragmentedSharedBuffer&);
    WEBCORE_EXPORT static RefPtr<LegacyWebArchive> create(const URL&, FragmentedSharedBuffer&);
    WEBCORE_EXPORT static Ref<LegacyWebArchive> create(Ref<ArchiveResource>&& mainResource, Vector<Ref<ArchiveResource>>&& subresources, Vector<Ref<LegacyWebArchive>>&& subframeArchives);
    WEBCORE_EXPORT static RefPtr<LegacyWebArchive> create(Node&, Function<bool(LocalFrame&)>&& frameFilter = { }, const Vector<MarkupExclusionRule>& markupExclusionRules = { }, const String& mainFrameFileName = { });
    WEBCORE_EXPORT static RefPtr<LegacyWebArchive> create(LocalFrame&);
    WEBCORE_EXPORT static RefPtr<LegacyWebArchive> createFromSelection(LocalFrame*);
    WEBCORE_EXPORT static RefPtr<LegacyWebArchive> create(const SimpleRange&);

    WEBCORE_EXPORT RetainPtr<CFDataRef> rawDataRepresentation();

private:
    LegacyWebArchive() = default;

    bool shouldLoadFromArchiveOnly() const final { return false; }
    bool shouldOverrideBaseURL() const final { return false; }
    bool shouldUseMainResourceEncoding() const final { return true; }
    bool shouldUseMainResourceURL() const final { return true; }

    enum MainResourceStatus { Subresource, MainResource };

    static RefPtr<LegacyWebArchive> create(const String& markupString, LocalFrame&, Vector<Ref<Node>>&& nodes, Function<bool(LocalFrame&)>&& frameFilter, const Vector<MarkupExclusionRule>& markupExclusionRules = { }, const String& mainResourceFileName = { });
    static RefPtr<ArchiveResource> createResource(CFDictionaryRef);
    static ResourceResponse createResourceResponseFromMacArchivedData(CFDataRef);
    static ResourceResponse createResourceResponseFromPropertyListData(CFDataRef, CFStringRef responseDataType);
    static RetainPtr<CFDataRef> createPropertyListRepresentation(const ResourceResponse&);
    static RetainPtr<CFDictionaryRef> createPropertyListRepresentation(Archive&);
    static RetainPtr<CFDictionaryRef> createPropertyListRepresentation(ArchiveResource*, MainResourceStatus);

    bool extract(CFDictionaryRef);
};

} // namespace WebCore
