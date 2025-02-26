/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#include "IDBIndexIdentifier.h"
#include "IDBObjectStoreIdentifier.h"
#include "IDBObjectStoreInfo.h"
#include <wtf/ArgumentCoder.h>
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class IDBDatabaseInfo {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(IDBDatabaseInfo, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT explicit IDBDatabaseInfo(const String& name, uint64_t version, uint64_t maxIndexID, HashMap<IDBObjectStoreIdentifier, IDBObjectStoreInfo>&& objectStoreMap = { });
    IDBDatabaseInfo() = default;

    enum IsolatedCopyTag { IsolatedCopy };
    IDBDatabaseInfo(const IDBDatabaseInfo&, IsolatedCopyTag);

    IDBDatabaseInfo isolatedCopy() const;

    const String& name() const { return m_name; }

    void setVersion(uint64_t version) { m_version = version; }
    uint64_t version() const { return m_version; }

    bool hasObjectStore(const String& name) const;
    IDBObjectStoreInfo createNewObjectStore(const String& name, std::optional<IDBKeyPath>&&, bool autoIncrement);
    void addExistingObjectStore(const IDBObjectStoreInfo&);
    IDBObjectStoreInfo* infoForExistingObjectStore(IDBObjectStoreIdentifier);
    IDBObjectStoreInfo* infoForExistingObjectStore(const String& objectStoreName);
    const IDBObjectStoreInfo* infoForExistingObjectStore(IDBObjectStoreIdentifier) const;
    const IDBObjectStoreInfo* infoForExistingObjectStore(const String& objectStoreName) const;

    void renameObjectStore(IDBObjectStoreIdentifier, const String& newName);

    Vector<String> objectStoreNames() const;
    const HashMap<IDBObjectStoreIdentifier, IDBObjectStoreInfo>& objectStoreMap() const { return m_objectStoreMap; }

    void deleteObjectStore(const String& objectStoreName);
    void deleteObjectStore(IDBObjectStoreIdentifier);

    void setMaxIndexID(uint64_t maxIndexID);
    IDBIndexIdentifier generateNextIndexID() { return IDBIndexIdentifier { ++m_maxIndexID }; }

#if !LOG_DISABLED
    String loggingString() const;
#endif

private:
    friend struct IPC::ArgumentCoder<IDBDatabaseInfo, void>;
    IDBObjectStoreInfo* getInfoForExistingObjectStore(const String& objectStoreName);
    IDBObjectStoreInfo* getInfoForExistingObjectStore(IDBObjectStoreIdentifier);

    String m_name;
    uint64_t m_version { 0 };
    uint64_t m_maxIndexID { 0 };

    HashMap<IDBObjectStoreIdentifier, IDBObjectStoreInfo> m_objectStoreMap;
};

} // namespace WebCore
