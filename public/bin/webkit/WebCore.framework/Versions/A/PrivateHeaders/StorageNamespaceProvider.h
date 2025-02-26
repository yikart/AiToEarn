/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include "SecurityOriginHash.h"
#include <wtf/HashMap.h>
#include <wtf/RefCounted.h>

namespace PAL {
class SessionID;
}

namespace WebCore {

class Document;
class Page;
class SecurityOrigin;
class StorageArea;
class StorageNamespace;

class StorageNamespaceProvider : public RefCounted<StorageNamespaceProvider> {
public:
    WEBCORE_EXPORT StorageNamespaceProvider();
    WEBCORE_EXPORT virtual ~StorageNamespaceProvider();

    Ref<StorageArea> localStorageArea(Document&);
    Ref<StorageArea> sessionStorageArea(Document&);

    enum class ShouldCreateNamespace : bool { No, Yes };
    virtual RefPtr<StorageNamespace> sessionStorageNamespace(const SecurityOrigin&, Page&, ShouldCreateNamespace = ShouldCreateNamespace::Yes) = 0;

    WEBCORE_EXPORT void setSessionIDForTesting(PAL::SessionID);

    void setSessionStorageQuota(unsigned quota) { m_sessionStorageQuota = quota; }
    virtual void cloneSessionStorageNamespaceForPage(Page&, Page&) { RELEASE_ASSERT_NOT_REACHED(); }

protected:
    StorageNamespace* optionalLocalStorageNamespace() { return m_localStorageNamespace.get(); }
    unsigned sessionStorageQuota() const { return m_sessionStorageQuota; }

private:
    friend class Internals;
    WEBCORE_EXPORT StorageNamespace& localStorageNamespace(PAL::SessionID);
    StorageNamespace& transientLocalStorageNamespace(SecurityOrigin&, PAL::SessionID);

    virtual Ref<StorageNamespace> createLocalStorageNamespace(unsigned quota, PAL::SessionID) = 0;
    virtual Ref<StorageNamespace> createTransientLocalStorageNamespace(SecurityOrigin&, unsigned quota, PAL::SessionID) = 0;

    RefPtr<StorageNamespace> m_localStorageNamespace;
    HashMap<SecurityOriginData, RefPtr<StorageNamespace>> m_transientLocalStorageNamespaces;

    unsigned m_sessionStorageQuota { 0 };
};

} // namespace WebCore
