/*
 * Copyright (C) 2016 Akamai Technologies Inc. All rights reserved.
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

#include "CachedResourceHandle.h"
#include <wtf/WeakHashMap.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class CachedResource;
class Document;
class LocalFrame;
class ResourceTiming;

class ResourceTimingInformation {
public:
    static bool shouldAddResourceTiming(CachedResource&);

    void addResourceTiming(CachedResource&, Document&, ResourceTiming&&);
    void removeResourceTiming(CachedResource&);
    void storeResourceTimingInitiatorInformation(const CachedResourceHandle<CachedResource>&, const AtomString&, LocalFrame*);

private:
    enum AlreadyAdded { NotYetAdded, Added };
    struct InitiatorInfo {
        AtomString type;
        AlreadyAdded added { NotYetAdded };
    };
    WeakHashMap<CachedResource, InitiatorInfo> m_initiatorMap;
};

}
